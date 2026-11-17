import { Hono } from 'hono';
import { Env, SessionUser } from '../types';
import { generatePseudonymousId, generateUuid } from '../utils/crypto';

export const escalationRouter = new Hono<{ Bindings: Env; Variables: { user?: SessionUser } }>();

const ALLOWED_ESCALATION_EVENTS = [
  'risk_detected',
  'support_prompt_shown',
  'booking_clicked',
  'booking_page_opened',
  'booking_started',
  'booking_completed',
  'booking_cancelled',
  'support_dismissed',
  'return_to_chat',
  'emergency_resource_opened'
];

escalationRouter.post('/:ref/events', async (c) => {
  const escalationRef = c.req.param('ref');
  const body = await c.req.json().catch(() => null);

  if (!body || !body.event_type || !ALLOWED_ESCALATION_EVENTS.includes(body.event_type)) {
    return c.json({ error: `Invalid event_type. Allowed: ${ALLOWED_ESCALATION_EVENTS.join(', ')}` }, 400);
  }

  // Safety check: Never record message contents or chat transcripts
  if (body.message_text || body.content || body.transcript) {
    return c.json({ error: 'Privacy violation: raw text must never be included in escalation analytics' }, 400);
  }

  const user = c.get('user');
  const pseudonymousId = user ? await generatePseudonymousId(user.id, 'haven_salt_2026') : 'anonymous';
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(
    `INSERT INTO escalation_events (id, pseudonymous_user_id, session_id, escalation_ref, risk_tier, event_type, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    generateUuid(),
    pseudonymousId,
    body.session_id || 'unspecified',
    escalationRef,
    body.risk_tier || 'UNKNOWN',
    body.event_type,
    JSON.stringify(body.metadata || {}),
    now
  ).run();

  return c.json({ message: 'Escalation event logged' });
});
