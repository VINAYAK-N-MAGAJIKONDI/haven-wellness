import { ALLOWED_EMOTIONS, AllowedEmotion, EmotionClassification, Env } from '../types';
import { GeminiService } from './gemini';

export class EmotionService {
  private gemini: GeminiService;

  constructor(env: Env) {
    this.gemini = new GeminiService(env);
  }

  /**
   * Classifies emotion of a user message.
   * Uses Gemini structured JSON if available, with a deterministic heuristic fallback.
   */
  public async analyzeMessageEmotion(messageText: string): Promise<EmotionClassification> {
    const prompt = `Analyze the emotional state expressed in the following message from a mental wellness companion chat:
"${messageText}"

Allowed primary emotions: ${ALLOWED_EMOTIONS.join(', ')}.`;

    const schemaDescription = `{
  "primary_emotion": "one of the allowed emotions",
  "secondary_emotions": ["array of up to 2 other allowed emotions"],
  "intensity": number between 0.0 and 1.0,
  "confidence": number between 0.0 and 1.0,
  "evidence_type": "message_inference",
  "requires_review": boolean
}`;

    if (this.gemini.isConfigured()) {
      const result = await this.gemini.generateStructuredJson<EmotionClassification>(prompt, schemaDescription);
      if (result && this.validateEmotionOutput(result)) {
        return result;
      }
    }

    // Heuristic fallback for zero-cost / offline / resilience
    return this.heuristicAnalyze(messageText);
  }

  private validateEmotionOutput(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    if (!ALLOWED_EMOTIONS.includes(data.primary_emotion)) return false;
    if (typeof data.intensity !== 'number' || data.intensity < 0 || data.intensity > 1) return false;
    if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) return false;
    if (!Array.isArray(data.secondary_emotions)) return false;
    return true;
  }

  private heuristicAnalyze(text: string): EmotionClassification {
    const t = text.toLowerCase();

    // Check keywords for each category
    if (/\b(happy|grateful|joy|wonderful|blessed|delighted|excited)\b/.test(t)) {
      return {
        primary_emotion: 'Happiness',
        secondary_emotions: ['Relief', 'Hopefulness'],
        intensity: 0.75,
        confidence: 0.85,
        evidence_type: 'message_inference',
        requires_review: false
      };
    }

    if (/\b(anxious|nervous|worry|worried|panic|racing|uneasy|tense)\b/.test(t)) {
      return {
        primary_emotion: 'Anxiety',
        secondary_emotions: ['Fear', 'Confusion'],
        intensity: 0.8,
        confidence: 0.88,
        evidence_type: 'message_inference',
        requires_review: false
      };
    }

    if (/\b(sad|crying|depressed|heartbroken|grief|sorrow|tearful|miserable)\b/.test(t)) {
      return {
        primary_emotion: 'Sadness',
        secondary_emotions: ['Hopelessness', 'Loneliness'],
        intensity: 0.85,
        confidence: 0.90,
        evidence_type: 'message_inference',
        requires_review: false
      };
    }

    if (/\b(lonely|alone|isolated|nobody|abandoned)\b/.test(t)) {
      return {
        primary_emotion: 'Loneliness',
        secondary_emotions: ['Sadness'],
        intensity: 0.7,
        confidence: 0.82,
        evidence_type: 'message_inference',
        requires_review: false
      };
    }

    if (/\b(angry|furious|mad|irritated|frustrated|pissed)\b/.test(t)) {
      return {
        primary_emotion: 'Frustration',
        secondary_emotions: ['Anger'],
        intensity: 0.75,
        confidence: 0.84,
        evidence_type: 'message_inference',
        requires_review: false
      };
    }

    if (/\b(calm|peaceful|relaxed|centered|breathing)\b/.test(t)) {
      return {
        primary_emotion: 'Calmness',
        secondary_emotions: ['Relief'],
        intensity: 0.65,
        confidence: 0.80,
        evidence_type: 'message_inference',
        requires_review: false
      };
    }

    // Default neutral / calm baseline
    return {
      primary_emotion: 'Calmness',
      secondary_emotions: ['Confusion'],
      intensity: 0.40,
      confidence: 0.60,
      evidence_type: 'message_inference',
      requires_review: false
    };
  }
}
