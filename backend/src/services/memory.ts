import { Env } from '../types';
import { generateUuid } from '../utils/crypto';
import { GeminiService } from './gemini';

export interface MemoryItem {
  id: string;
  user_id: string;
  session_id: string | null;
  memory_type: 'episodic' | 'semantic';
  topic: string;
  content: string;
  sensitivity_level: 'low' | 'medium' | 'high';
  is_approved: number;
  created_at: number;
  updated_at: number;
}

export class MemoryService {
  private db: D1Database;
  private gemini: GeminiService;

  constructor(env: Env) {
    this.db = env.DB;
    this.gemini = new GeminiService(env);
  }

  /**
   * Retrieves approved episodic and semantic memories for a user
   */
  public async getActiveMemoriesForUser(userId: string): Promise<{
    episodic: string[];
    semantic: string[];
  }> {
    const { results } = await this.db.prepare(
      `SELECT memory_type, content FROM memory_items 
       WHERE user_id = ? AND is_approved = 1 
       ORDER BY created_at DESC LIMIT 15`
    ).bind(userId).all<{ memory_type: string; content: string }>();

    const episodic: string[] = [];
    const semantic: string[] = [];

    for (const item of results) {
      if (item.memory_type === 'episodic') {
        episodic.push(item.content);
      } else {
        semantic.push(item.content);
      }
    }

    return { episodic, semantic };
  }

  /**
   * Generates a session summary and memory candidates when a session ends or hits a milestone
   */
  public async processSessionMilestone(
    userId: string,
    sessionId: string,
    messages: Array<{ role: string; content: string }>
  ): Promise<void> {
    if (messages.length < 3) return;

    // Check user consent for memory
    const consent = await this.db.prepare(
      'SELECT cross_session_memory_enabled FROM consents WHERE user_id = ?'
    ).bind(userId).first<{ cross_session_memory_enabled: number }>();

    if (consent && consent.cross_session_memory_enabled === 0) {
      return; // User has not consented to cross-session memory
    }

    const conversationTranscript = messages
      .slice(-8)
      .map(m => `${m.role === 'user' ? 'User' : 'Haven'}: ${m.content}`)
      .join('\n');

    let summaryText = 'User discussed personal experiences and explored coping reflections.';
    let topics: string[] = ['Reflections', 'Personal thoughts'];
    let strategies: string[] = ['Mindful reflection'];

    if (this.gemini.isConfigured()) {
      const prompt = `Summarize this mental wellness conversation objectively and extract up to 2 key topics and 1 helpful coping strategy mentioned.
Conversation:
${conversationTranscript}`;

      const schema = `{
  "summary": "1-2 sentence non-judgmental summary",
  "topics": ["topic1", "topic2"],
  "coping_strategies": ["strategy1"]
}`;

      const generated = await this.gemini.generateStructuredJson<{
        summary: string;
        topics: string[];
        coping_strategies: string[];
      }>(prompt, schema);

      if (generated && generated.summary) {
        summaryText = generated.summary;
        topics = generated.topics || topics;
        strategies = generated.coping_strategies || strategies;
      }
    }

    const now = Math.floor(Date.now() / 1000);

    // Save or update session summary
    await this.db.prepare(
      `INSERT INTO session_summaries (id, session_id, user_id, summary, key_topics, coping_strategies, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(session_id) DO UPDATE SET
         summary = excluded.summary,
         key_topics = excluded.key_topics,
         coping_strategies = excluded.coping_strategies`
    ).bind(
      generateUuid(),
      sessionId,
      userId,
      summaryText,
      JSON.stringify(topics),
      JSON.stringify(strategies),
      now
    ).run();

    // Store an episodic memory item
    await this.db.prepare(
      `INSERT INTO memory_items (id, user_id, session_id, memory_type, topic, content, sensitivity_level, is_approved, created_at, updated_at)
       VALUES (?, ?, ?, 'episodic', ?, ?, 'low', 1, ?, ?)`
    ).bind(
      generateUuid(),
      userId,
      sessionId,
      topics[0] || 'Reflection',
      summaryText,
      now,
      now
    ).run();
  }
}
