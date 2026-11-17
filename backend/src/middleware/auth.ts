import { Context, Next } from 'hono';
import { Env, SessionUser, UserRole } from '../types';
import { hashToken } from '../utils/crypto';

export async function authMiddleware(c: Context<{ Bindings: Env; Variables: { user?: SessionUser } }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else {
    // Check cookie
    const cookieHeader = c.req.header('Cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/haven_session=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }
  }

  if (!token) {
    return next();
  }

  try {
    const tokenHash = await hashToken(token);
    const now = Math.floor(Date.now() / 1000);

    const sessionRecord = await c.env.DB.prepare(
      `SELECT s.id as session_id, s.expires_at, u.id, u.email, u.preferred_name, 
              u.conversation_style, u.language_pref,
              c.emotion_insights_enabled, c.cross_session_memory_enabled, c.analytics_enabled
       FROM auth_sessions s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN consents c ON u.id = c.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`
    ).bind(tokenHash, now).first<any>();

    if (!sessionRecord) {
      return next();
    }

    // Fetch roles
    const { results: roleResults } = await c.env.DB.prepare(
      'SELECT role FROM user_roles WHERE user_id = ?'
    ).bind(sessionRecord.id).all<{ role: UserRole }>();

    const roles = roleResults.map(r => r.role);
    if (!roles.includes('user')) {
      roles.push('user');
    }

    const user: SessionUser = {
      id: sessionRecord.id,
      email: sessionRecord.email,
      preferred_name: sessionRecord.preferred_name,
      conversation_style: sessionRecord.conversation_style || 'warm_empathic',
      language_pref: sessionRecord.language_pref || 'en',
      roles,
      consents: {
        emotion_insights_enabled: sessionRecord.emotion_insights_enabled !== 0,
        cross_session_memory_enabled: sessionRecord.cross_session_memory_enabled !== 0,
        analytics_enabled: sessionRecord.analytics_enabled === 1
      }
    };

    c.set('user', user);

    // Update last_active_at periodically
    try {
      if (c.executionCtx?.waitUntil) {
        c.executionCtx.waitUntil(
          c.env.DB.prepare('UPDATE auth_sessions SET last_active_at = ? WHERE id = ?')
            .bind(now, sessionRecord.session_id)
            .run()
        );
      }
    } catch {
      // In test environments without executionCtx
    }
  } catch (err) {
    console.error('Session lookup failed:', err);
  }

  return next();
}

export function requireAuth() {
  return async (c: Context<{ Bindings: Env; Variables: { user?: SessionUser } }>, next: Next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Authentication required. Please sign in.' }, 401);
    }
    return next();
  };
}

export function requireRole(role: UserRole) {
  return async (c: Context<{ Bindings: Env; Variables: { user?: SessionUser } }>, next: Next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Authentication required.' }, 401);
    }
    if (!user.roles.includes(role)) {
      return c.json({ error: `Forbidden: role '${role}' required.` }, 403);
    }
    return next();
  };
}
