import { Hono } from 'hono';
import { Env, SessionUser } from '../types';
import { requireAuth } from '../middleware/auth';
import { generateUuid } from '../utils/crypto';

export const userRouter = new Hono<{ Bindings: Env; Variables: { user?: SessionUser } }>();

userRouter.use('*', requireAuth());

// 1. Get profile
userRouter.get('/profile', async (c) => {
  const user = c.get('user')!;
  const userRecord = await c.env.DB.prepare(
    `SELECT u.id, u.email, u.preferred_name, u.conversation_style, u.language_pref, u.created_at,
            c.emotion_insights_enabled, c.cross_session_memory_enabled, c.analytics_enabled
     FROM users u
     LEFT JOIN consents c ON u.id = c.user_id
     WHERE u.id = ?`
  ).bind(user.id).first<any>();

  if (!userRecord) return c.json({ error: 'User not found' }, 404);

  return c.json({
    profile: {
      id: userRecord.id,
      email: userRecord.email,
      preferred_name: userRecord.preferred_name,
      conversation_style: userRecord.conversation_style,
      language_pref: userRecord.language_pref,
      created_at: userRecord.created_at,
      consents: {
        emotion_insights_enabled: userRecord.emotion_insights_enabled !== 0,
        cross_session_memory_enabled: userRecord.cross_session_memory_enabled !== 0,
        analytics_enabled: userRecord.analytics_enabled === 1
      }
    }
  });
});

// 2. Update profile & consents
userRouter.patch('/profile', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({}));
  const now = Math.floor(Date.now() / 1000);

  if (body.preferred_name || body.conversation_style || body.language_pref) {
    const preferredName = body.preferred_name ? String(body.preferred_name).trim() : user.preferred_name;
    const style = body.conversation_style || user.conversation_style;
    const lang = body.language_pref || user.language_pref;

    await c.env.DB.prepare(
      'UPDATE users SET preferred_name = ?, conversation_style = ?, language_pref = ?, updated_at = ? WHERE id = ?'
    ).bind(preferredName, style, lang, now, user.id).run();
  }

  if (body.consents) {
    const emotionInsights = body.consents.emotion_insights_enabled !== undefined ? (body.consents.emotion_insights_enabled ? 1 : 0) : null;
    const crossMemory = body.consents.cross_session_memory_enabled !== undefined ? (body.consents.cross_session_memory_enabled ? 1 : 0) : null;
    const analytics = body.consents.analytics_enabled !== undefined ? (body.consents.analytics_enabled ? 1 : 0) : null;

    if (emotionInsights !== null || crossMemory !== null || analytics !== null) {
      const current = await c.env.DB.prepare('SELECT * FROM consents WHERE user_id = ?').bind(user.id).first<any>();
      await c.env.DB.prepare(
        `UPDATE consents SET 
           emotion_insights_enabled = COALESCE(?, emotion_insights_enabled),
           cross_session_memory_enabled = COALESCE(?, cross_session_memory_enabled),
           analytics_enabled = COALESCE(?, analytics_enabled),
           updated_at = ?
         WHERE user_id = ?`
      ).bind(emotionInsights, crossMemory, analytics, now, user.id).run();
    }
  }

  return c.json({ message: 'Profile updated successfully' });
});

// 3. User Data Export (GDPR / Privacy portability)
userRouter.post('/export', async (c) => {
  const user = c.get('user')!;

  // Audit log the export request
  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare(
    `INSERT INTO audit_logs (id, actor_id, actor_role, action, target_resource, details, created_at)
     VALUES (?, ?, 'user', 'data_export_requested', ?, ?, ?)`
  ).bind(generateUuid(), user.id, `user:${user.id}`, 'User exported full personal archive', now).run();

  const userProfile = await c.env.DB.prepare('SELECT id, email, preferred_name, conversation_style, language_pref, created_at FROM users WHERE id = ?')
    .bind(user.id).first();

  const { results: chatSessions } = await c.env.DB.prepare('SELECT id, title, created_at FROM chat_sessions WHERE user_id = ?')
    .bind(user.id).all();

  const { results: messages } = await c.env.DB.prepare('SELECT id, session_id, role, content, created_at FROM messages WHERE user_id = ?')
    .bind(user.id).all();

  const { results: memories } = await c.env.DB.prepare('SELECT id, memory_type, topic, content, created_at FROM memory_items WHERE user_id = ?')
    .bind(user.id).all();

  const { results: checkins } = await c.env.DB.prepare('SELECT id, mood_score, primary_emotion, notes, created_at FROM mood_checkins WHERE user_id = ?')
    .bind(user.id).all();

  return c.json({
    export_metadata: {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      platform: 'Haven Mental Wellness'
    },
    profile: userProfile,
    sessions: chatSessions,
    messages,
    memories,
    checkins
  });
});

// 4. Permanent Account Deletion ("Right to be Forgotten")
userRouter.delete('/account', async (c) => {
  const user = c.get('user')!;

  // Delete all user related tables explicitly
  await c.env.DB.prepare('DELETE FROM messages WHERE user_id = ?').bind(user.id).run();
  await c.env.DB.prepare('DELETE FROM chat_sessions WHERE user_id = ?').bind(user.id).run();
  await c.env.DB.prepare('DELETE FROM memory_items WHERE user_id = ?').bind(user.id).run();
  await c.env.DB.prepare('DELETE FROM session_summaries WHERE user_id = ?').bind(user.id).run();
  await c.env.DB.prepare('DELETE FROM emotion_events WHERE user_id = ?').bind(user.id).run();
  await c.env.DB.prepare('DELETE FROM mood_checkins WHERE user_id = ?').bind(user.id).run();
  await c.env.DB.prepare('DELETE FROM safety_events WHERE user_id = ?').bind(user.id).run();
  await c.env.DB.prepare('DELETE FROM appointments WHERE user_id = ?').bind(user.id).run();
  await c.env.DB.prepare('DELETE FROM consents WHERE user_id = ?').bind(user.id).run();
  await c.env.DB.prepare('DELETE FROM auth_sessions WHERE user_id = ?').bind(user.id).run();
  await c.env.DB.prepare('DELETE FROM user_roles WHERE user_id = ?').bind(user.id).run();
  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run();

  c.header('Set-Cookie', 'haven_session=; Path=/; HttpOnly; Max-Age=0');

  return c.json({ message: 'User account and all associated data permanently deleted.' });
});
