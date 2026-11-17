import { Env } from '../types';

export interface GeminiMessagePart {
  text: string;
}

export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiMessagePart[];
}

export interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

export class GeminiService {
  private apiKey: string;
  private model: string;

  constructor(env: Env) {
    this.apiKey = env.GEMINI_API_KEY || '';
    this.model = env.GEMINI_MODEL || 'gemini-1.5-flash';
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  /**
   * Generates a non-streaming response from Gemini
   */
  public async generateChatResponse(
    systemPrompt: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    newMessage: string
  ): Promise<string> {
    if (!this.isConfigured()) {
      return "I am currently running in offline demo mode because the Gemini API key has not been configured in the environment. Please configure GEMINI_API_KEY in your settings to enable live AI responses.";
    }

    const contents: GeminiContent[] = [];

    // Map conversation history
    for (const msg of history) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    }

    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: newMessage }]
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const body = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 1024
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.status === 429) {
        return "I am taking a mindful pause because the free-tier AI quota limit was reached. Please wait a moment before sending another message, or try again in a few minutes.";
      }

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Gemini API Error:', response.status, errorData);
        return "I'm having a momentary difficulty reaching my language service. Please know that your thoughts are valuable, and feel free to try again shortly.";
      }

      const data = (await response.json()) as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return text || "I heard you, and I am here with you. Could you share a little more about what you're experiencing?";
    } catch (err: any) {
      console.error('Gemini call failed:', err);
      return "I encountered a network connection issue. Your safety and thoughts matter—please feel free to resend your message.";
    }
  }

  /**
   * Calls Gemini for structured JSON output (e.g. emotion analysis, summarization)
   */
  public async generateStructuredJson<T>(prompt: string, schemaDescription: string): Promise<T | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const body = {
      contents: [{
        role: 'user',
        parts: [{ text: `${prompt}\n\nYou must return ONLY valid, raw JSON conforming to this schema:\n${schemaDescription}\nDo not include backticks, markdown code blocks, or extra text.` }]
      }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) return null;

      const data = (await response.json()) as GeminiResponse;
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return null;

      // Clean any potential markdown fencing if returned
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson) as T;
    } catch (err) {
      console.error('Structured JSON generation failed:', err);
      return null;
    }
  }
}
