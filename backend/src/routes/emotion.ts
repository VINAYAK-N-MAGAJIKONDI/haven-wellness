import { Hono } from 'hono';
import { ALLOWED_EMOTIONS, Env, SessionUser } from '../types';
import { requireAuth } from '../middleware/auth';
import { generateUuid } from '../utils/crypto';

export const emotionRouter = new Hono<{ Bindings: Env; Variables: { user?: SessionUser } }>();

emotionRouter.use('*', requireAuth());

// 1. Get recent emotion observations
emotionRouter.get('/', async (c) => {
  const user = c.get('user')!;

  const { results: observations } = await c.env.DB.prepare(
    `SELECT id, session_id, message_id, primary_emotion, secondary_emotions, intensity, confidence,
            evidence_type, user_corrected_emotion, created_at
     FROM emotion_events
     WHERE user_id = ?
     ORDER BY created_at DESC LIMIT 50`
  ).bind(user.id).all();

  const { results: checkins } = await c.env.DB.prepare(
    `SELECT id, mood_score, primary_emotion, notes, created_at
     FROM mood_checkins
     WHERE user_id = ?
     ORDER BY created_at DESC LIMIT 30`
  ).bind(user.id).all();

  return c.json({
    observations: observations.map(o => ({
      ...o,
      secondary_emotions: JSON.parse((o.secondary_emotions as string) || '[]')
    })),
    checkins
  });
});

// 2. Submit a self-reported mood check-in
emotionRouter.post('/checkins', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => null);

  if (!body) return c.json({ error: 'Invalid check-in body' }, 400);

  const moodScore = Number(body.mood_score);
  const primaryEmotion = String(body.primary_emotion || '').trim();
  const notes = body.notes ? String(body.notes).slice(0, 500) : null;

  if (isNaN(moodScore) || moodScore < 1 || moodScore > 5) {
    return c.json({ error: 'mood_score must be an integer between 1 and 5' }, 400);
  }

  if (!ALLOWED_EMOTIONS.includes(primaryEmotion as any)) {
    return c.json({ error: `primary_emotion must be one of: ${ALLOWED_EMOTIONS.join(', ')}` }, 400);
  }

  const checkinId = generateUuid();
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(
    `INSERT INTO mood_checkins (id, user_id, mood_score, primary_emotion, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(checkinId, user.id, moodScore, primaryEmotion, notes, now).run();

  return c.json({
    message: 'Mood check-in recorded successfully',
    checkin: {
      id: checkinId,
      mood_score: moodScore,
      primary_emotion: primaryEmotion,
      notes,
      created_at: now
    }
  }, 201);
});

// 3. User correction of an AI-inferred observation
emotionRouter.patch('/:id/correct', async (c) => {
  const user = c.get('user')!;
  const eventId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const correctedEmotion = String(body.corrected_emotion || '').trim();

  if (!ALLOWED_EMOTIONS.includes(correctedEmotion as any)) {
    return c.json({ error: `corrected_emotion must be one of: ${ALLOWED_EMOTIONS.join(', ')}` }, 400);
  }

  const event = await c.env.DB.prepare(
    'SELECT id FROM emotion_events WHERE id = ? AND user_id = ?'
  ).bind(eventId, user.id).first();

  if (!event) {
    return c.json({ error: 'Observation not found or access denied' }, 404);
  }

  await c.env.DB.prepare(
    'UPDATE emotion_events SET user_corrected_emotion = ? WHERE id = ?'
  ).bind(correctedEmotion, eventId).run();

  return c.json({ message: 'Emotion observation corrected successfully' });
});

// 4. Emotion Trends & Distribution analytics
emotionRouter.get('/trends', async (c) => {
  const user = c.get('user')!;

  // 1. Emotion distribution from events
  const { results: distribution } = await c.env.DB.prepare(
    `SELECT COALESCE(user_corrected_emotion, primary_emotion) as emotion, COUNT(*) as count
     FROM emotion_events
     WHERE user_id = ?
     GROUP BY COALESCE(user_corrected_emotion, primary_emotion)
     ORDER BY count DESC`
  ).bind(user.id).all();

  // 2. Timeline of recent check-ins
  const { results: checkinTimeline } = await c.env.DB.prepare(
    `SELECT id, mood_score, primary_emotion, created_at
     FROM mood_checkins
     WHERE user_id = ?
     ORDER BY created_at ASC LIMIT 14`
  ).bind(user.id).all();

  // 3. Emotion intensity over time
  const { results: intensityTimeline } = await c.env.DB.prepare(
    `SELECT id, primary_emotion, intensity, created_at
     FROM emotion_events
     WHERE user_id = ?
     ORDER BY created_at ASC LIMIT 20`
  ).bind(user.id).all();

  return c.json({
    distribution,
    checkinTimeline,
    intensityTimeline
  });
});
