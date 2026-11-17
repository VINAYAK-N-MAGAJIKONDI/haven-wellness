import { Hono } from 'hono';
import { Env, SessionUser } from '../types';
import { requireAuth } from '../middleware/auth';
import { generateUuid } from '../utils/crypto';

export const memoryRouter = new Hono<{ Bindings: Env; Variables: { user?: SessionUser } }>();

memoryRouter.use('*', requireAuth());

// 1. List all memory items for the user
memoryRouter.get('/', async (c) => {
  const user = c.get('user')!;

  const { results: memories } = await c.env.DB.prepare(
    `SELECT id, session_id, memory_type, topic, content, sensitivity_level, is_approved, created_at, updated_at
     FROM memory_items WHERE user_id = ? ORDER BY created_at DESC`
  ).bind(user.id).all();

  const { results: summaries } = await c.env.DB.prepare(
    `SELECT id, session_id, summary, key_topics, coping_strategies, created_at
     FROM session_summaries WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`
  ).bind(user.id).all();

  return c.json({
    memories,
    summaries,
    memory_consent_enabled: user.consents.cross_session_memory_enabled
  });
});

// 2. Update memory item
memoryRouter.patch('/:id', async (c) => {
  const user = c.get('user')!;
  const memoryId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));

  const item = await c.env.DB.prepare(
    'SELECT id FROM memory_items WHERE id = ? AND user_id = ?'
  ).bind(memoryId, user.id).first();

  if (!item) {
    return c.json({ error: 'Memory item not found or access denied' }, 404);
  }

  const content = body.content ? String(body.content).trim() : null;
  const isApproved = typeof body.is_approved === 'boolean' ? (body.is_approved ? 1 : 0) : null;
  const now = Math.floor(Date.now() / 1000);

  if (content !== null && isApproved !== null) {
    await c.env.DB.prepare(
      'UPDATE memory_items SET content = ?, is_approved = ?, updated_at = ? WHERE id = ?'
    ).bind(content, isApproved, now, memoryId).run();
  } else if (content !== null) {
    await c.env.DB.prepare(
      'UPDATE memory_items SET content = ?, updated_at = ? WHERE id = ?'
    ).bind(content, now, memoryId).run();
  } else if (isApproved !== null) {
    await c.env.DB.prepare(
      'UPDATE memory_items SET is_approved = ?, updated_at = ? WHERE id = ?'
    ).bind(isApproved, now, memoryId).run();
  }

  return c.json({ message: 'Memory item updated successfully' });
});

// 3. Delete memory item
memoryRouter.delete('/:id', async (c) => {
  const user = c.get('user')!;
  const memoryId = c.req.param('id');

  const item = await c.env.DB.prepare(
    'SELECT id FROM memory_items WHERE id = ? AND user_id = ?'
  ).bind(memoryId, user.id).first();

  if (!item) {
    return c.json({ error: 'Memory item not found or access denied' }, 404);
  }

  await c.env.DB.prepare('DELETE FROM memory_items WHERE id = ?').bind(memoryId).run();

  return c.json({ message: 'Memory item deleted successfully' });
});

// 4. Update memory preferences & consent
memoryRouter.post('/preferences', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({}));

  const now = Math.floor(Date.now() / 1000);

  if (typeof body.cross_session_memory_enabled === 'boolean') {
    const val = body.cross_session_memory_enabled ? 1 : 0;
    await c.env.DB.prepare(
      'UPDATE consents SET cross_session_memory_enabled = ?, updated_at = ? WHERE user_id = ?'
    ).bind(val, now, user.id).run();
  }

  // Allow explicitly adding a semantic memory preference (e.g. "I prefer shorter mindfulness exercises")
  if (body.new_preference && typeof body.new_preference === 'string') {
    const pref = body.new_preference.trim();
    if (pref.length > 0) {
      await c.env.DB.prepare(
        `INSERT INTO memory_items (id, user_id, session_id, memory_type, topic, content, sensitivity_level, is_approved, created_at, updated_at)
         VALUES (?, ?, NULL, 'semantic', 'User Preference', ?, 'low', 1, ?, ?)`
      ).bind(generateUuid(), user.id, pref, now, now).run();
    }
  }

  return c.json({ message: 'Preferences updated successfully' });
});

// 5. Clear all memories for user
memoryRouter.post('/clear-all', async (c) => {
  const user = c.get('user')!;

  await c.env.DB.prepare('DELETE FROM memory_items WHERE user_id = ?').bind(user.id).run();
  await c.env.DB.prepare('DELETE FROM session_summaries WHERE user_id = ?').bind(user.id).run();

  return c.json({ message: 'All personal conversational memories cleared successfully' });
});
