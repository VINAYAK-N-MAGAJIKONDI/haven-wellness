import { describe, it, expect, beforeAll } from 'vitest';
import app from '../src/index';

// Minimal in-memory D1 mock for end-to-end integration verification
class MockD1PreparedStatement {
  private sql: string;
  private params: any[];
  private storage: Map<string, any[]>;

  constructor(sql: string, storage: Map<string, any[]>, params: any[] = []) {
    this.sql = sql;
    this.storage = storage;
    this.params = params;
  }

  bind(...params: any[]) {
    return new MockD1PreparedStatement(this.sql, this.storage, params);
  }

  async first<T = any>(): Promise<T | null> {
    const res = await this.all<T>();
    return res.results[0] || null;
  }

  async all<T = any>(): Promise<{ results: T[] }> {
    const s = this.sql.trim();
    if (s.includes('FROM users WHERE email = ?')) {
      const users = this.storage.get('users') || [];
      const found = users.filter(u => u.email === this.params[0]);
      return { results: found as T[] };
    }
    if (s.includes('FROM auth_sessions s')) {
      const sessions = this.storage.get('auth_sessions') || [];
      const users = this.storage.get('users') || [];
      const foundSession = sessions.find(sn => sn.token_hash === this.params[0] && sn.expires_at > this.params[1]);
      if (!foundSession) return { results: [] };
      const user = users.find(u => u.id === foundSession.user_id);
      return {
        results: [{
          session_id: foundSession.id,
          expires_at: foundSession.expires_at,
          ...user
        }] as T[]
      };
    }
    if (s.includes('FROM user_roles WHERE user_id = ?')) {
      return { results: [{ role: 'user' }] as T[] };
    }
    if (s.includes('FROM consultants')) {
      return {
        results: [{
          id: 'c-telemanas-org',
          name: 'Tele-MANAS',
          designation: 'Helpline',
          credentials_verified: 1,
          areas_of_practice: '["Crisis"]',
          languages: '["English", "Hindi"]',
          short_bio: 'Tele-MANAS',
          booking_url: 'tel:14416',
          availability_info: '24/7'
        }] as T[]
      };
    }
    if (s.includes('FROM chat_sessions WHERE id = ? AND user_id = ?')) {
      return { results: [{ id: this.params[0], title: 'Test Session', active_risk_tier: 'LOW' }] as T[] };
    }
    if (s.includes('FROM messages WHERE session_id = ?')) {
      return { results: [] };
    }
    if (s.includes('FROM memory_items WHERE user_id = ?')) {
      return { results: [] };
    }
    if (s.includes('FROM session_summaries WHERE user_id = ?')) {
      return { results: [] };
    }
    if (s.includes('FROM consents WHERE user_id = ?')) {
      return { results: [{ cross_session_memory_enabled: 1 }] as T[] };
    }
    return { results: [] };
  }

  async run(): Promise<{ success: boolean }> {
    const s = this.sql.trim();
    if (s.startsWith('INSERT INTO users')) {
      const users = this.storage.get('users') || [];
      users.push({
        id: this.params[0],
        email: this.params[1],
        password_hash: this.params[2],
        preferred_name: this.params[3],
        conversation_style: this.params[4],
        language_pref: this.params[5]
      });
      this.storage.set('users', users);
    }
    if (s.startsWith('INSERT INTO auth_sessions')) {
      const sessions = this.storage.get('auth_sessions') || [];
      sessions.push({
        id: this.params[0],
        user_id: this.params[1],
        token_hash: this.params[2],
        expires_at: this.params[3]
      });
      this.storage.set('auth_sessions', sessions);
    }
    return { success: true };
  }
}

class MockD1Database {
  private storage = new Map<string, any[]>();

  prepare(sql: string) {
    return new MockD1PreparedStatement(sql, this.storage);
  }
}

describe('End-to-End API Integration Workflows', () => {
  const mockDb = new MockD1Database();
  const env = {
    DB: mockDb as any,
    GEMINI_MODEL: 'gemini-1.5-flash',
    ENVIRONMENT: 'test',
    ADMIN_BOOTSTRAP_SECRET: 'test_bootstrap_secret'
  };

  it('GET /api/health should return platform status and version', async () => {
    const res = await app.request('/api/health', {}, env);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('healthy');
    expect(data.platform).toContain('Haven');
  });

  it('GET /api/safety/resources should return verified crisis lines', async () => {
    const res = await app.request('/api/safety/resources', {}, env);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.resources.length).toBeGreaterThanOrEqual(2);
    expect(data.resources.some((r: any) => r.contact === '14416')).toBe(true);
  });

  it('POST /api/safety/assess should classify danger without saving', async () => {
    const res = await app.request('/api/safety/assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'I am standing on the roof, ready to die right now' })
    }, env);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.assessment.risk_tier).toBe('IMMINENT');
    expect(data.emergency_resources.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/consultants should list verified providers', async () => {
    const res = await app.request('/api/consultants', {}, env);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.consultants.length).toBeGreaterThanOrEqual(1);
    expect(data.consultants[0].credentials_verified).toBe(true);
  });

  let authToken = '';

  it('POST /api/auth/register should create user account and return session token', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'ValidPassword123!',
        preferred_name: 'Alex'
      })
    }, env);

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.token).toBeDefined();
    expect(data.user.preferred_name).toBe('Alex');
    authToken = data.token;
  });

  it('GET /api/auth/me should return authenticated user profile', async () => {
    const res = await app.request('/api/auth/me', {
      headers: { Authorization: `Bearer ${authToken}` }
    }, env);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.email).toBe('testuser@example.com');
  });

  it('POST /api/chat/messages should assess safety and generate empathic response', async () => {
    const res = await app.request('/api/chat/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        sessionId: 'session-123',
        content: 'I have been having a really exhausting week with work'
      })
    }, env);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message.role).toBe('assistant');
    expect(data.safety.risk_tier).toBe('LOW');
  });
});
