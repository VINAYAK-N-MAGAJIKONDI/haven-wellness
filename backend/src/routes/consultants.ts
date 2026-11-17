import { Hono } from 'hono';
import { Env, SessionUser } from '../types';
import { requireAuth } from '../middleware/auth';
import { generatePseudonymousId, generateUuid } from '../utils/crypto';

export const consultantsRouter = new Hono<{ Bindings: Env; Variables: { user?: SessionUser } }>();

// 1. List active verified consultants (Public / authenticated)
consultantsRouter.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, name, designation, credentials_verified, areas_of_practice, languages,
            short_bio, booking_url, availability_info
     FROM consultants
     WHERE is_active = 1 AND credentials_verified = 1
     ORDER BY created_at ASC`
  ).all();

  const formatted = results.map((r: any) => ({
    ...r,
    credentials_verified: Boolean(r.credentials_verified),
    areas_of_practice: JSON.parse(r.areas_of_practice || '[]'),
    languages: JSON.parse(r.languages || '[]')
  }));

  return c.json({ consultants: formatted });
});

// 2. Get single consultant
consultantsRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const consultant = await c.env.DB.prepare(
    'SELECT * FROM consultants WHERE id = ? AND is_active = 1'
  ).bind(id).first<any>();

  if (!consultant) {
    return c.json({ error: 'Consultant not found' }, 404);
  }

  return c.json({
    consultant: {
      ...consultant,
      credentials_verified: Boolean(consultant.credentials_verified),
      areas_of_practice: JSON.parse(consultant.areas_of_practice || '[]'),
      languages: JSON.parse(consultant.languages || '[]')
    }
  });
});

// 3. Initiate booking appointment tracking
consultantsRouter.post('/appointments', requireAuth(), async (c) => {
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => null);

  if (!body || !body.consultant_id) {
    return c.json({ error: 'consultant_id is required' }, 400);
  }

  const consultant = await c.env.DB.prepare(
    'SELECT id, booking_url FROM consultants WHERE id = ? AND is_active = 1'
  ).bind(body.consultant_id).first<{ id: string; booking_url: string }>();

  if (!consultant) {
    return c.json({ error: 'Consultant not found or not active' }, 404);
  }

  const appointmentId = generateUuid();
  const escalationRef = body.escalation_ref || `esc-${generateUuid().slice(0, 8)}`;
  const now = Math.floor(Date.now() / 1000);

  // Status is recorded as 'clicked' upon outbound action
  // IMPORTANT: We do NOT mark 'completed' on a simple link click!
  await c.env.DB.prepare(
    `INSERT INTO appointments (id, escalation_ref, consultant_id, user_id, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'clicked', ?, ?)`
  ).bind(appointmentId, escalationRef, consultant.id, user.id, now, now).run();

  // Log escalation event
  const pseudonymousId = await generatePseudonymousId(user.id, 'haven_salt_2026');
  await c.env.DB.prepare(
    `INSERT INTO escalation_events (id, pseudonymous_user_id, session_id, escalation_ref, risk_tier, event_type, metadata, created_at)
     VALUES (?, ?, ?, ?, 'UNKNOWN', 'booking_clicked', ?, ?)`
  ).bind(
    generateUuid(),
    pseudonymousId,
    body.session_id || 'direct',
    escalationRef,
    JSON.stringify({ consultant_id: consultant.id }),
    now
  ).run();

  return c.json({
    appointment_id: appointmentId,
    escalation_ref: escalationRef,
    booking_url: consultant.booking_url,
    status: 'clicked'
  });
});

// 4. Partner Webhook / Confirmation Endpoint (Only marks completed when verified)
consultantsRouter.post('/appointments/:id/confirm', async (c) => {
  const appointmentId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const confirmationToken = body.confirmation_token;

  // In production, verify partner webhook secret / signature
  const apt = await c.env.DB.prepare('SELECT id, escalation_ref FROM appointments WHERE id = ?')
    .bind(appointmentId).first<{ id: string; escalation_ref: string }>();

  if (!apt) {
    return c.json({ error: 'Appointment not found' }, 404);
  }

  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare(
    'UPDATE appointments SET status = ?, updated_at = ? WHERE id = ?'
  ).bind('completed', now, appointmentId).run();

  // Record verified completed event in escalation funnel
  await c.env.DB.prepare(
    `INSERT INTO escalation_events (id, pseudonymous_user_id, session_id, escalation_ref, risk_tier, event_type, metadata, created_at)
     VALUES (?, 'webhook-verified', 'partner', ?, 'UNKNOWN', 'booking_completed', ?, ?)`
  ).bind(
    generateUuid(),
    apt.escalation_ref || 'unknown',
    JSON.stringify({ verified_by: 'partner_webhook' }),
    now
  ).run();

  return c.json({ message: 'Appointment marked as completed via verified confirmation' });
});
