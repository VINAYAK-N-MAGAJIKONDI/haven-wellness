import { describe, it, expect } from 'vitest';
import { assessSafetyRisk, VERIFIED_EMERGENCY_RESOURCES } from '../src/services/safety';

describe('Independent Safety & Risk Detection Engine', () => {
  it('should identify IMMINENT risk scenarios and require emergency protocol', () => {
    const inputs = [
      'Goodbye world, I took all the pills and wrote my suicide note',
      'I am standing on the roof, ready to die right now',
      'Swallowed all my pills, can’t stay alive another minute'
    ];

    for (const text of inputs) {
      const assessment = assessSafetyRisk(text);
      expect(assessment.risk_tier).toBe('IMMINENT');
      expect(assessment.crisis_resources_required).toBe(true);
      expect(assessment.action_taken).toBe('emergency_protocol_activated');
    }
  });

  it('should identify HIGH risk scenarios (suicidal ideation / self-harm)', () => {
    const inputs = [
      'I want to kill myself, everything feels completely dark',
      'Thinking about suicide every single day',
      'I just cut myself and I hate being alive',
      'I wish I was dead'
    ];

    for (const text of inputs) {
      const assessment = assessSafetyRisk(text);
      expect(assessment.risk_tier).toBe('HIGH');
      expect(assessment.crisis_resources_required).toBe(true);
      expect(assessment.action_taken).toBe('crisis_modal_offered');
    }
  });

  it('should handle contextual negation without triggering false emergency alarms', () => {
    const inputs = [
      'I do not want to die, but work has been very exhausting',
      'I don’t want to kill myself, I just want some quiet time',
      'In a movie I watched, a character died and it was really sad'
    ];

    for (const text of inputs) {
      const assessment = assessSafetyRisk(text);
      expect(assessment.risk_tier).not.toBe('IMMINENT');
      expect(assessment.risk_tier).not.toBe('HIGH');
      expect(assessment.is_negated).toBe(true);
    }
  });

  it('should handle common idiomatic false-positive phrases as LOW or MODERATE', () => {
    const inputs = [
      'Today my presentation went amazing, we were killing it!',
      'After running 10 miles I am dead tired'
    ];

    for (const text of inputs) {
      const assessment = assessSafetyRisk(text);
      expect(assessment.risk_tier).toBe('LOW');
      expect(assessment.crisis_resources_required).toBe(false);
    }
  });

  it('should detect MODERATE risk for intense overwhelm needing human support', () => {
    const inputs = [
      'Everything is falling apart and I feel like giving up on everything',
      'I have severe panic attacks and unbearable pain, need a therapist'
    ];

    for (const text of inputs) {
      const assessment = assessSafetyRisk(text);
      expect(assessment.risk_tier).toBe('MODERATE');
      expect(assessment.action_taken).toBe('human_support_offered');
    }
  });

  it('should maintain elevated state if prior session was HIGH or IMMINENT', () => {
    const neutralText = 'The weather is okay today';
    const assessment = assessSafetyRisk(neutralText, 'HIGH');
    expect(assessment.risk_tier).toBe('MODERATE');
    expect(assessment.trigger_rule).toBe('persisted_prior_crisis_state');
  });

  it('should verify standard India crisis resources (112, Tele-MANAS 14416)', () => {
    expect(VERIFIED_EMERGENCY_RESOURCES.length).toBeGreaterThanOrEqual(2);
    const telemanas = VERIFIED_EMERGENCY_RESOURCES.find(r => r.contact === '14416');
    expect(telemanas).toBeDefined();
    expect(telemanas?.name).toContain('Tele-MANAS');

    const emergency112 = VERIFIED_EMERGENCY_RESOURCES.find(r => r.contact === '112');
    expect(emergency112).toBeDefined();
  });
});
