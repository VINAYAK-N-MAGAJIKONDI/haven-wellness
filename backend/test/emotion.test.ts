import { describe, it, expect } from 'vitest';
import { EmotionService } from '../src/services/emotion';
import { ALLOWED_EMOTIONS } from '../src/types';

describe('Emotion Analysis Engine', () => {
  const service = new EmotionService({ DB: {} as any });

  it('should classify anxious and worried messages correctly', async () => {
    const result = await service.analyzeMessageEmotion('I am so worried and anxious about tomorrow’s exam');
    expect(result.primary_emotion).toBe('Anxiety');
    expect(ALLOWED_EMOTIONS).toContain(result.primary_emotion);
    expect(result.intensity).toBeGreaterThan(0);
    expect(result.intensity).toBeLessThanOrEqual(1);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should classify happy and grateful statements correctly', async () => {
    const result = await service.analyzeMessageEmotion('I feel so happy, blessed and grateful for my family');
    expect(result.primary_emotion).toBe('Happiness');
    expect(ALLOWED_EMOTIONS).toContain(result.primary_emotion);
  });

  it('should classify lonely messages correctly', async () => {
    const result = await service.analyzeMessageEmotion('I feel completely isolated and lonely, nobody talks to me');
    expect(result.primary_emotion).toBe('Loneliness');
  });

  it('should classify frustration and anger', async () => {
    const result = await service.analyzeMessageEmotion('I am so irritated and frustrated with everything today');
    expect(result.primary_emotion).toBe('Frustration');
  });
});
