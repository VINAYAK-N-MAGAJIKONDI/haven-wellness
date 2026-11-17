import { Hono } from 'hono';
import { Env, SessionUser } from '../types';
import { generateToken, generateUuid, hashPassword, hashToken, verifyPassword } from '../utils/crypto';
import { requireAuth } from '../middleware/auth';

export const authRouter = new Hono<{ Bindings: Env; Variables: { user?: SessionUser } }>();

authRouter.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Invalid request body' }, 400);

  const { email, password, preferred_name, conversation_style = 'warm_empathic', language_pref = 'en', consents } = body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return c.json({ error: 'Valid email address is required' }, 400);
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters' }, 400);
  }
  if (!preferred_name || typeof preferred_name !== 'string' || preferred_name.trim().length === 0) {
    return c.json({ error: 'Preferred name is required' }, 400);
  }

  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(email.toLowerCase().trim())
    .first();

  if (existing) {
    return c.json({ error: 'An account with this email already exists' }, 409);
  }

  const userId = generateUuid();
  const passwordHash = await hashPassword(password);
  const now = Math.floor(Date.now() / 1000);

  // Insert user
  await c.env.DB.prepare(
    `INSERT INTO users (id, email, password_hash, preferred_name, conversation_style, language_pref, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    userId,
    email.toLowerCase().trim(),
    passwordHash,
    preferred_name.trim(),
    conversation_style,
    language_pref,
    now,
    now
  ).run();

  // Insert default user role
  await c.env.DB.prepare(
    'INSERT INTO user_roles (id, user_id, role, granted_at) VALUES (?, ?, ?, ?)'
  ).bind(generateUuid(), userId, 'user', now).run();

  // Insert consents
  const emotionInsights = consents?.emotion_insights_enabled ?? true;
  const crossMemory = consents?.cross_session_memory_enabled ?? true;
  const analyticsConsent = consents?.analytics_enabled ?? false;

  await c.env.DB.prepare(
    `INSERT INTO consents (user_id, emotion_insights_enabled, cross_session_memory_enabled, analytics_enabled, updated_at)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(
    userId,
    emotionInsights ? 1 : 0,
    crossMemory ? 1 : 0,
    analyticsConsent ? 1 : 0,
    now
  ).run();

  // Create session
  const sessionToken = generateToken();
  const tokenHash = await hashToken(sessionToken);
  const sessionId = generateUuid();
  const expiresAt = now + (30 * 24 * 60 * 60); // 30 days

  await c.env.DB.prepare(
    `INSERT INTO auth_sessions (id, user_id, token_hash, expires_at, created_at, last_active_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(sessionId, userId, tokenHash, expiresAt, now, now).run();

  // Audit log
  await c.env.DB.prepare(
    `INSERT INTO audit_logs (id, actor_id, actor_role, action, target_resource, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(generateUuid(), userId, 'user', 'user_registered', `user:${userId}`, JSON.stringify({ email }), now).run();

  // Set HttpOnly cookie
  c.header('Set-Cookie', `haven_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`);

  return c.json({
    message: 'Registration successful',
    token: sessionToken,
    user: {
      id: userId,
      email: email.toLowerCase().trim(),
      preferred_name: preferred_name.trim(),
      conversation_style,
      language_pref,
      roles: ['user'],
      consents: {
        emotion_insights_enabled: emotionInsights,
        cross_session_memory_enabled: crossMemory,
        analytics_enabled: analyticsConsent
      }
    }
  }, 201);
});

authRouter.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Invalid request body' }, 400);

  const { email, password } = body;
  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

  const user = await c.env.DB.prepare(
    `SELECT u.id, u.email, u.password_hash, u.preferred_name, u.conversation_style, u.language_pref,
            c.emotion_insights_enabled, c.cross_session_memory_enabled, c.analytics_enabled
     FROM users u
     LEFT JOIN consents c ON u.id = c.user_id
     WHERE u.email = ?`
  ).bind(email.toLowerCase().trim()).first<any>();

  if (!user) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  const now = Math.floor(Date.now() / 1000);
  const sessionToken = generateToken();
  const tokenHash = await hashToken(sessionToken);
  const sessionId = generateUuid();
  const expiresAt = now + (30 * 24 * 60 * 60);

  await c.env.DB.prepare(
    `INSERT INTO auth_sessions (id, user_id, token_hash, expires_at, created_at, last_active_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(sessionId, user.id, tokenHash, expiresAt, now, now).run();

  const { results: roleResults } = await c.env.DB.prepare(
    'SELECT role FROM user_roles WHERE user_id = ?'
  ).bind(user.id).all<{ role: string }>();

  const roles = roleResults.map(r => r.role);
  if (!roles.includes('user')) roles.push('user');

  c.header('Set-Cookie', `haven_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`);

  return c.json({
    message: 'Login successful',
    token: sessionToken,
    user: {
      id: user.id,
      email: user.email,
      preferred_name: user.preferred_name,
      conversation_style: user.conversation_style,
      language_pref: user.language_pref,
      roles,
      consents: {
        emotion_insights_enabled: user.emotion_insights_enabled !== 0,
        cross_session_memory_enabled: user.cross_session_memory_enabled !== 0,
        analytics_enabled: user.analytics_enabled === 1
      }
    }
  });
});

authRouter.post('/logout', async (c) => {
  const cookieHeader = c.req.header('Cookie');
  const authHeader = c.req.header('Authorization');
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (cookieHeader) {
    const match = cookieHeader.match(/haven_session=([^;]+)/);
    if (match) token = match[1];
  }

  if (token) {
    const tokenHash = await hashToken(token);
    await c.env.DB.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').bind(tokenHash).run();
  }

  c.header('Set-Cookie', 'haven_session=; Path=/; HttpOnly; Max-Age=0');
  return c.json({ message: 'Logged out successfully' });
});

authRouter.get('/me', requireAuth(), async (c) => {
  const user = c.get('user')!;
  return c.json({ user });
});
