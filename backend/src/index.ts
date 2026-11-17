import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env, SessionUser } from './types';
import { authMiddleware } from './middleware/auth';
import { authRouter } from './routes/auth';
import { chatRouter } from './routes/chat';
import { memoryRouter } from './routes/memory';
import { emotionRouter } from './routes/emotion';
import { safetyRouter } from './routes/safety';
import { consultantsRouter } from './routes/consultants';
import { escalationRouter } from './routes/escalation';
import { userRouter } from './routes/user';
import { adminRouter } from './routes/admin';

const app = new Hono<{ Bindings: Env; Variables: { user?: SessionUser } }>();

// Security Headers Middleware
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
});

// CORS Configuration
app.use('*', cors({
  origin: (origin) => {
    // In dev allow localhost:3000, localhost:5173, etc., or production domain
    if (!origin || origin.startsWith('http://localhost:') || origin.endsWith('.pages.dev') || origin.endsWith('.workers.dev')) {
      return origin || '*';
    }
    return origin;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: ['Set-Cookie'],
  credentials: true,
  maxAge: 86400,
}));

// Global Auth Extractor
app.use('*', authMiddleware);

// Healthcheck
app.get('/api/health', (c) => {
  return c.json({
    status: 'healthy',
    platform: 'Haven Mental Wellness Worker',
    version: '1.0.0',
    environment: c.env.ENVIRONMENT || 'development',
    gemini_configured: Boolean(c.env.GEMINI_API_KEY && c.env.GEMINI_API_KEY.length > 5),
    gemini_model: c.env.GEMINI_MODEL || 'gemini-1.5-flash',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.route('/api/auth', authRouter);
app.route('/api/chat', chatRouter);
app.route('/api/memory', memoryRouter);
app.route('/api/emotions', emotionRouter);
app.route('/api/safety', safetyRouter);
app.route('/api/consultants', consultantsRouter);
app.route('/api/escalations', escalationRouter);
app.route('/api/user', userRouter);
app.route('/api/admin', adminRouter);

// 404 Handler
app.notFound((c) => {
  return c.json({ error: 'Endpoint not found' }, 404);
});

// Error Handler
app.onError((err, c) => {
  console.error('Unhandled Worker Error:', err);
  return c.json({
    error: 'An unexpected internal error occurred. Please try again later.'
  }, 500);
});

export default app;
