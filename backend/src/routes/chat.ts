import { Hono } from 'hono';
import { Env, SessionUser } from '../types';
import { requireAuth } from '../middleware/auth';
import { generatePseudonymousId, generateUuid } from '../utils/crypto';
import { assessSafetyRisk, VERIFIED_EMERGENCY_RESOURCES } from '../services/safety';
import { EmotionService } from '../services/emotion';
import { MemoryService } from '../services/memory';
import { GeminiService } from '../services/gemini';
import { buildSystemPrompt } from '../prompts/systemPrompt';

export const chatRouter = new Hono<{ Bindings: Env; Variables: { user?: SessionUser } }>();

chatRouter.use('*', requireAuth());

// 1. Create a new chat session
chatRouter.post('/sessions', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({}));
  const title = (body.title && typeof body.title === 'string' && body.title.trim()) || 'New Conversation';

  const sessionId = generateUuid();
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(
    `INSERT INTO chat_sessions (id, user_id, title, active_risk_tier, created_at, updated_at)
     VALUES (?, ?, ?, 'LOW', ?, ?)`
  ).bind(sessionId, user.id, title.slice(0, 80), now, now).run();

  return c.json({
    session: {
      id: sessionId,
      title: title.slice(0, 80),
      active_risk_tier: 'LOW',
      created_at: now,
      updated_at: now
    }
  }, 201);
});

// 2. List all user sessions
chatRouter.get('/sessions', async (c) => {
  const user = c.get('user')!;

  const { results } = await c.env.DB.prepare(
    `SELECT s.id, s.title, s.active_risk_tier, s.created_at, s.updated_at,
            (SELECT content FROM messages WHERE session_id = s.id ORDER BY created_at DESC LIMIT 1) as last_message,
            (SELECT COUNT(*) FROM messages WHERE session_id = s.id) as message_count
     FROM chat_sessions s
     WHERE s.user_id = ? AND s.is_archived = 0
     ORDER BY s.updated_at DESC`
  ).bind(user.id).all();

  return c.json({ sessions: results });
});

// 3. Get single session messages
chatRouter.get('/sessions/:id', async (c) => {
  const user = c.get('user')!;
  const sessionId = c.req.param('id');

  const session = await c.env.DB.prepare(
    'SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?'
  ).bind(sessionId, user.id).first<any>();

  if (!session) {
    return c.json({ error: 'Session not found or access denied' }, 404);
  }

  const { results: messages } = await c.env.DB.prepare(
    'SELECT id, role, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at ASC'
  ).bind(sessionId).all();

  return c.json({ session, messages });
});

// 4. Delete session
chatRouter.delete('/sessions/:id', async (c) => {
  const user = c.get('user')!;
  const sessionId = c.req.param('id');

  const session = await c.env.DB.prepare(
    'SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?'
  ).bind(sessionId, user.id).first();

  if (!session) {
    return c.json({ error: 'Session not found or access denied' }, 404);
  }

  await c.env.DB.prepare('DELETE FROM messages WHERE session_id = ?').bind(sessionId).run();
  await c.env.DB.prepare('DELETE FROM chat_sessions WHERE id = ?').bind(sessionId).run();

  return c.json({ message: 'Session deleted successfully' });
});

// 5. Send message and receive AI response
chatRouter.post('/messages', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => null);

  if (!body || !body.sessionId || !body.content || typeof body.content !== 'string') {
    return c.json({ error: 'sessionId and message content are required' }, 400);
  }

  const sessionId = body.sessionId;
  const content = body.content.trim();
  if (content.length === 0) {
    return c.json({ error: 'Message cannot be empty' }, 400);
  }

  // 1. Verify session belongs to user (Prevent IDOR)
  const session = await c.env.DB.prepare(
    'SELECT id, title, active_risk_tier FROM chat_sessions WHERE id = ? AND user_id = ?'
  ).bind(sessionId, user.id).first<{ id: string; title: string; active_risk_tier: string }>();

  if (!session) {
    return c.json({ error: 'Session not found or access denied' }, 404);
  }

  const now = Math.floor(Date.now() / 1000);
  const userMsgId = generateUuid();

  // 2. Persist user message
  await c.env.DB.prepare(
    'INSERT INTO messages (id, session_id, user_id, role, content, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(userMsgId, sessionId, user.id, 'user', content, now).run();

  // Update session title if first user message
  if (session.title === 'New Conversation') {
    const autoTitle = content.slice(0, 40) + (content.length > 40 ? '...' : '');
    await c.env.DB.prepare('UPDATE chat_sessions SET title = ?, updated_at = ? WHERE id = ?')
      .bind(autoTitle, now, sessionId).run();
  } else {
    await c.env.DB.prepare('UPDATE chat_sessions SET updated_at = ? WHERE id = ?')
      .bind(now, sessionId).run();
  }

  // 3. Independent Safety Assessment BEFORE AI Generation
  const safetyAssessment = assessSafetyRisk(content, (session.active_risk_tier as any) || 'LOW');

  // Record safety event
  await c.env.DB.prepare(
    `INSERT INTO safety_events (id, user_id, session_id, message_id, risk_tier, trigger_rule, is_negated, confidence, action_taken, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    generateUuid(),
    user.id,
    sessionId,
    userMsgId,
    safetyAssessment.risk_tier,
    safetyAssessment.trigger_rule,
    safetyAssessment.is_negated ? 1 : 0,
    safetyAssessment.confidence,
    safetyAssessment.action_taken,
    now
  ).run();

  // Update session risk tier if escalated
  if (safetyAssessment.risk_tier !== session.active_risk_tier) {
    await c.env.DB.prepare('UPDATE chat_sessions SET active_risk_tier = ? WHERE id = ?')
      .bind(safetyAssessment.risk_tier, sessionId).run();
  }

  // If IMMINENT or HIGH risk, create an escalation event record
  let escalationRef: string | null = null;
  if (safetyAssessment.risk_tier === 'HIGH' || safetyAssessment.risk_tier === 'IMMINENT') {
    escalationRef = `esc-${generateUuid().slice(0, 8)}`;
    const pseudonymousId = await generatePseudonymousId(user.id, 'haven_salt_2026');
    await c.env.DB.prepare(
      `INSERT INTO escalation_events (id, pseudonymous_user_id, session_id, escalation_ref, risk_tier, event_type, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, 'risk_detected', ?, ?)`
    ).bind(
      generateUuid(),
      pseudonymousId,
      sessionId,
      escalationRef,
      safetyAssessment.risk_tier,
      JSON.stringify({ trigger_rule: safetyAssessment.trigger_rule }),
      now
    ).run();
  }

  // 4. Retrieve cross-session memories if consented
  let episodicMemories: string[] = [];
  let semanticMemories: string[] = [];

  const memoryService = new MemoryService(c.env);
  if (user.consents.cross_session_memory_enabled) {
    const memoryData = await memoryService.getActiveMemoriesForUser(user.id);
    episodicMemories = memoryData.episodic;
    semanticMemories = memoryData.semantic;
  }

  // 5. Retrieve recent conversation history (last 10 turns)
  const { results: recentMessages } = await c.env.DB.prepare(
    'SELECT role, content FROM messages WHERE session_id = ? AND id != ? ORDER BY created_at DESC LIMIT 10'
  ).bind(sessionId, userMsgId).all<{ role: 'user' | 'assistant'; content: string }>();

  recentMessages.reverse();

  // 6. Build empathy-first prompt
  const systemPrompt = buildSystemPrompt({
    userName: user.preferred_name,
    conversationStyle: user.conversation_style,
    preferredLanguage: user.language_pref,
    episodicMemories,
    semanticMemories,
    activeRiskTier: safetyAssessment.risk_tier
  });

  // 7. Generate Gemini response
  const gemini = new GeminiService(c.env);
  let assistantContent = '';

  if (safetyAssessment.risk_tier === 'IMMINENT') {
    assistantContent = `I can hear how much pain you are experiencing right now, and I want you to know you are not alone in this moment. 
Because your safety is the most important thing, please connect immediately with someone who can support you directly:
- Call India's National Emergency Helpline at 112
- Call Tele-MANAS at 14416 (24/7 free, confidential mental health support)

I am an AI companion and cannot dispatch help or keep you safe physically. Please take this step right now and reach out to one of the numbers above or someone you trust.`;
  } else {
    assistantContent = await gemini.generateChatResponse(systemPrompt, recentMessages, content);
  }

  const assistantMsgId = generateUuid();
  const assistantCreatedAt = Math.floor(Date.now() / 1000);

  // Persist assistant message
  await c.env.DB.prepare(
    'INSERT INTO messages (id, session_id, user_id, role, content, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(assistantMsgId, sessionId, user.id, 'assistant', assistantContent, assistantCreatedAt).run();

  // 8. Emotion Analysis (if consented)
  let emotionObservation = null;
  if (user.consents.emotion_insights_enabled) {
    const emotionService = new EmotionService(c.env);
    const emotionResult = await emotionService.analyzeMessageEmotion(content);

    const emotionEventId = generateUuid();
    await c.env.DB.prepare(
      `INSERT INTO emotion_events (id, user_id, session_id, message_id, primary_emotion, secondary_emotions, intensity, confidence, evidence_type, requires_review, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      emotionEventId,
      user.id,
      sessionId,
      userMsgId,
      emotionResult.primary_emotion,
      JSON.stringify(emotionResult.secondary_emotions),
      emotionResult.intensity,
      emotionResult.confidence,
      emotionResult.evidence_type,
      emotionResult.requires_review ? 1 : 0,
      now
    ).run();

    emotionObservation = emotionResult;
  }

  // 9. Milestone check for memory summarization
  // Trigger asynchronously if multiple messages exist
  try {
    if (c.executionCtx?.waitUntil) {
      c.executionCtx.waitUntil(
        (async () => {
          const { results: allMsgs } = await c.env.DB.prepare(
            'SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at ASC'
          ).bind(sessionId).all<{ role: string; content: string }>();

          if (allMsgs && allMsgs.length % 6 === 0) {
            await memoryService.processSessionMilestone(user.id, sessionId, allMsgs);
          }
        })()
      );
    }
  } catch {
    // In test environments without executionCtx
  }

  return c.json({
    message: {
      id: assistantMsgId,
      role: 'assistant',
      content: assistantContent,
      created_at: assistantCreatedAt
    },
    safety: {
      risk_tier: safetyAssessment.risk_tier,
      crisis_resources_required: safetyAssessment.crisis_resources_required,
      escalation_ref: escalationRef,
      resources: safetyAssessment.crisis_resources_required ? VERIFIED_EMERGENCY_RESOURCES : []
    },
    emotion: emotionObservation
  });
});
