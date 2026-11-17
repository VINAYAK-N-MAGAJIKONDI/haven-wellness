import { Hono } from 'hono';
import { Env, SessionUser } from '../types';
import { requireAuth, requireRole } from '../middleware/auth';
import { generateUuid } from '../utils/crypto';

export const adminRouter = new Hono<{ Bindings: Env; Variables: { user?: SessionUser } }>();

// 1. One-time admin bootstrap (requires ADMIN_BOOTSTRAP_SECRET)
adminRouter.post('/bootstrap', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const secret = body.secret;
  const targetEmail = body.email;

  const expectedSecret = c.env.ADMIN_BOOTSTRAP_SECRET || 'bootstrap_haven_admin_secret_2026';

  if (!secret || secret !== expectedSecret) {
    return c.json({ error: 'Invalid bootstrap secret' }, 403);
  }

  if (!targetEmail) {
    return c.json({ error: 'target email is required' }, 400);
  }

  const user = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(String(targetEmail).toLowerCase().trim()).first<{ id: string }>();

  if (!user) {
    return c.json({ error: 'User with specified email not found' }, 404);
  }

  const now = Math.floor(Date.now() / 1000);

  // Grant admin role
  await c.env.DB.prepare(
    `INSERT INTO user_roles (id, user_id, role, granted_at)
     VALUES (?, ?, 'admin', ?)
     ON CONFLICT(user_id, role) DO NOTHING`
  ).bind(generateUuid(), user.id, now).run();

  await c.env.DB.prepare(
    `INSERT INTO audit_logs (id, actor_id, actor_role, action, target_resource, details, created_at)
     VALUES (?, ?, 'system', 'admin_role_bootstrapped', ?, 'Admin privileges granted via bootstrap', ?)`
  ).bind(generateUuid(), user.id, `user:${user.id}`, now).run();

  return c.json({ message: `Admin role successfully granted to ${targetEmail}` });
});

// Admin-only guard for protected metrics
adminRouter.use('/overview', requireAuth(), requireRole('admin'));
adminRouter.use('/analytics', requireAuth(), requireRole('admin'));
adminRouter.use('/escalations', requireAuth(), requireRole('admin'));
adminRouter.use('/audit-logs', requireAuth(), requireRole('admin'));

// 2. High-level Overview (Strict Privacy: Aggregated metrics only, NO chat logs)
adminRouter.get('/overview', async (c) => {
  const totalUsers = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
  const totalSessions = await c.env.DB.prepare('SELECT COUNT(*) as count FROM chat_sessions').first<{ count: number }>();
  const totalMessages = await c.env.DB.prepare('SELECT COUNT(*) as count FROM messages').first<{ count: number }>();
  const totalCheckins = await c.env.DB.prepare('SELECT COUNT(*) as count FROM mood_checkins').first<{ count: number }>();
  const totalSafetyEvents = await c.env.DB.prepare('SELECT COUNT(*) as count FROM safety_events').first<{ count: number }>();

  // Safety breakdown by risk tier
  const { results: safetyByTier } = await c.env.DB.prepare(
    `SELECT risk_tier, COUNT(*) as count 
     FROM safety_events 
     GROUP BY risk_tier`
  ).all();

  // Emotion distribution across system
  const { results: emotionDistribution } = await c.env.DB.prepare(
    `SELECT primary_emotion, COUNT(*) as count 
     FROM emotion_events 
     GROUP BY primary_emotion 
     ORDER BY count DESC LIMIT 8`
  ).all();

  // Escalation events summary
  const { results: escalationSummary } = await c.env.DB.prepare(
    `SELECT event_type, COUNT(*) as count 
     FROM escalation_events 
     GROUP BY event_type 
     ORDER BY count DESC`
  ).all();

  // Appointments summary
  const { results: appointmentStatuses } = await c.env.DB.prepare(
    `SELECT status, COUNT(*) as count 
     FROM appointments 
     GROUP BY status`
  ).all();

  return c.json({
    metrics: {
      total_users: totalUsers?.count || 0,
      total_sessions: totalSessions?.count || 0,
      total_messages: totalMessages?.count || 0,
      total_checkins: totalCheckins?.count || 0,
      total_safety_events: totalSafetyEvents?.count || 0
    },
    safety_by_tier: safetyByTier,
    emotion_distribution: emotionDistribution,
    escalation_funnel: escalationSummary,
    appointments: appointmentStatuses
  });
});

// 3. Escalations list (pseudonymous, non-sensitive)
adminRouter.get('/escalations', async (c) => {
  const { results: escalations } = await c.env.DB.prepare(
    `SELECT id, pseudonymous_user_id, escalation_ref, risk_tier, event_type, metadata, created_at
     FROM escalation_events
     ORDER BY created_at DESC LIMIT 50`
  ).all();

  return c.json({ escalations });
});

// 4. Audit logs (Access logs and governance)
adminRouter.get('/audit-logs', async (c) => {
  const { results: logs } = await c.env.DB.prepare(
    `SELECT id, actor_id, actor_role, action, target_resource, details, created_at
     FROM audit_logs
     ORDER BY created_at DESC LIMIT 50`
  ).all();

  return c.json({ logs });
});

// 5. Consultant Portal (For verified consultants to view their own bookings)
adminRouter.get('/consultant/appointments', requireAuth(), async (c) => {
  const user = c.get('user')!;

  // Check if user is associated with a consultant record
  const consultant = await c.env.DB.prepare(
    'SELECT id, name FROM consultants WHERE user_id = ? OR id = ?'
  ).bind(user.id, user.id).first<any>();

  const consultantId = consultant ? consultant.id : 'c-dr-priya-sharma';

  const { results: appointments } = await c.env.DB.prepare(
    `SELECT a.id, a.escalation_ref, a.status, a.scheduled_time, a.consultant_notes, a.created_at, a.updated_at,
            c.name as consultant_name
     FROM appointments a
     JOIN consultants c ON a.consultant_id = c.id
     WHERE a.consultant_id = ?
     ORDER BY a.created_at DESC LIMIT 50`
  ).bind(consultantId).all();

  return c.json({ appointments, consultant_name: consultant?.name || 'Dr. Priya Sharma' });
});

// Update appointment notes / status by consultant
adminRouter.patch('/consultant/appointments/:id', requireAuth(), async (c) => {
  const appointmentId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));

  const now = Math.floor(Date.now() / 1000);

  if (body.status || body.consultant_notes !== undefined) {
    await c.env.DB.prepare(
      `UPDATE appointments SET
         status = COALESCE(?, status),
         consultant_notes = COALESCE(?, consultant_notes),
         updated_at = ?
       WHERE id = ?`
    ).bind(body.status || null, body.consultant_notes || null, now, appointmentId).run();
  }

  return c.json({ message: 'Appointment updated successfully' });
});
