import { Hono } from 'hono';
import { Env } from '../types';
import { assessSafetyRisk, VERIFIED_EMERGENCY_RESOURCES } from '../services/safety';

export const safetyRouter = new Hono<{ Bindings: Env }>();

// 1. Get verified emergency and crisis resources
safetyRouter.get('/resources', (c) => {
  return c.json({
    disclaimer: 'These resources provide confidential, 24/7 human crisis support. Haven is not an emergency response provider.',
    resources: VERIFIED_EMERGENCY_RESOURCES
  });
});

// 2. Assess safety of arbitrary text (Used for immediate client-side or test pipeline evaluation)
safetyRouter.post('/assess', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || !body.text || typeof body.text !== 'string') {
    return c.json({ error: 'Text field is required' }, 400);
  }

  const assessment = assessSafetyRisk(body.text, body.currentRiskTier || 'LOW');

  return c.json({
    assessment,
    emergency_resources: assessment.crisis_resources_required ? VERIFIED_EMERGENCY_RESOURCES : []
  });
});
