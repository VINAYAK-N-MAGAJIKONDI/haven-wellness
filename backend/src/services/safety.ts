import { RiskTier, SafetyAssessment } from '../types';

export interface EmergencyResource {
  name: string;
  contact: string;
  type: 'helpline' | 'emergency' | 'institute';
  available: string;
  description: string;
  directActionUrl: string;
}

export const VERIFIED_EMERGENCY_RESOURCES: EmergencyResource[] = [
  {
    name: 'National Emergency Number',
    contact: '112',
    type: 'emergency',
    available: '24/7',
    description: 'Immediate police, medical, and distress assistance across India.',
    directActionUrl: 'tel:112'
  },
  {
    name: 'Tele-MANAS (Govt. of India)',
    contact: '14416',
    type: 'helpline',
    available: '24/7 Free',
    description: 'National Tele Mental Health Programme of India, supported by NIMHANS. Multi-lingual counseling.',
    directActionUrl: 'tel:14416'
  },
  {
    name: 'Vandrevala Foundation Helpline',
    contact: '+91 9999 666 555',
    type: 'helpline',
    available: '24/7 Free',
    description: 'Free, confidential mental health and crisis intervention service.',
    directActionUrl: 'tel:+919999666555'
  },
  {
    name: 'KIRAN Mental Health Helpline',
    contact: '1800-599-0019',
    type: 'helpline',
    available: '24/7 Toll-Free',
    description: 'Ministry of Social Justice & Empowerment helpline providing psychological first-aid.',
    directActionUrl: 'tel:18005990019'
  }
];

// Patterns for IMMINENT risk (Active attempt, immediate plan, lethal means)
const IMMINENT_PATTERNS = [
  /\b(goodbye world|saying goodbye forever|this is my last note|wrote my suicide note|swallowed all my pills|took all the pills|slit my wrist|jump off the bridge right now|jumping now|hanging myself right now|end it all tonight|ending it tonight|can't stay alive another minute)\b/i,
  /\b(ready to die right now|standing on the roof|have the blade in my hand|gun to my head)\b/i
];

// Patterns for HIGH risk (Suicidal ideation, self-harm intentions, wanting to cease existing)
const HIGH_PATTERNS = [
  /\b(i want to kill myself|i want to die|thinking (of|about) suicide|suicidal thoughts|thinking about killing myself|commit suicide|wish i was dead|wish i were dead|better off dead|don't want to live anymore|dont want to live anymore|no reason to live|hate being alive|cut myself|harm myself|hurting myself)\b/i,
  /\b(how to kill myself|ways to die peacefully|painless suicide)\b/i
];

// Patterns for MODERATE risk (Intense despair, deep hopelessness, overwhelm requiring human support)
const MODERATE_PATTERNS = [
  /\b(hopeless|cannot take this pain anymore|can't take this pain anymore|everything is falling apart|feel like giving up on everything|nobody would care if i disappeared|no point in anything|unbearable pain|drowning in anxiety|severe panic attack)\b/i,
  /\b(need professional help|need a therapist|need to talk to a doctor|mental breakdown)\b/i
];

// Contextual negation / false-positive patterns
const NEGATION_PATTERNS = [
  /\b(don't want to die|dont want to die|do not want to die|not going to kill myself|don't want to kill myself|dont want to kill myself|not suicidal|never said i want to die)\b/i,
  /\b(in a movie|in a book|song lyrics|character died|quoted|read an article about|my friend was talking about)\b/i,
  /\b(metaphorically|figuratively speaking|killing me with work|dead tired|killing it)\b/i
];

export function assessSafetyRisk(messageText: string, currentSessionRiskTier: RiskTier = 'LOW'): SafetyAssessment {
  // Normalize quotes and whitespace
  const normalized = messageText
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
    .trim()
    .toLowerCase();

  // 1. Check for explicit contextual negation or figurative expressions
  const hasNegation = NEGATION_PATTERNS.some(pattern => pattern.test(normalized));

  // 2. Evaluate IMMINENT patterns (Negation cannot easily override direct active physical harm statements)
  for (const pattern of IMMINENT_PATTERNS) {
    if (pattern.test(normalized)) {
      if (!hasNegation || normalized.includes('took all') || normalized.includes('swallowed')) {
        return {
          risk_tier: 'IMMINENT',
          trigger_rule: `imminent_pattern_match:${pattern.source}`,
          is_negated: false,
          confidence: 0.95,
          action_taken: 'emergency_protocol_activated',
          crisis_resources_required: true
        };
      }
    }
  }

  // 3. Evaluate HIGH patterns
  for (const pattern of HIGH_PATTERNS) {
    if (pattern.test(normalized)) {
      if (hasNegation) {
        return {
          risk_tier: 'MODERATE',
          trigger_rule: `high_pattern_with_negation:${pattern.source}`,
          is_negated: true,
          confidence: 0.70,
          action_taken: 'supportive_clarification',
          crisis_resources_required: false
        };
      }
      return {
        risk_tier: 'HIGH',
        trigger_rule: `high_pattern_match:${pattern.source}`,
        is_negated: false,
        confidence: 0.90,
        action_taken: 'crisis_modal_offered',
        crisis_resources_required: true
      };
    }
  }

  // 4. Evaluate MODERATE patterns
  for (const pattern of MODERATE_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        risk_tier: 'MODERATE',
        trigger_rule: `moderate_pattern_match:${pattern.source}`,
        is_negated: false,
        confidence: 0.75,
        action_taken: 'human_support_offered',
        crisis_resources_required: false
      };
    }
  }

  // 5. Session state persistence check:
  // If the session was previously HIGH or IMMINENT, keep at least MODERATE state for sustained care,
  // unless explicitly safe conversation continues with no residual risk markers.
  if (currentSessionRiskTier === 'IMMINENT' || currentSessionRiskTier === 'HIGH') {
    return {
      risk_tier: 'MODERATE',
      trigger_rule: 'persisted_prior_crisis_state',
      is_negated: false,
      confidence: 0.65,
      action_taken: 'sustained_empathic_monitoring',
      crisis_resources_required: false
    };
  }

  // 6. Default LOW risk
  return {
    risk_tier: 'LOW',
    trigger_rule: 'standard_empathic_interaction',
    is_negated: hasNegation,
    confidence: 0.85,
    action_taken: 'normal_conversation',
    crisis_resources_required: false
  };
}
