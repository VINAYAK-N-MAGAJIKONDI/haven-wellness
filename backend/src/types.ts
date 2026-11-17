export interface Env {
  DB: D1Database;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  ADMIN_BOOTSTRAP_SECRET?: string;
  JWT_SECRET?: string;
  ENVIRONMENT?: string;
}

export type UserRole = 'user' | 'consultant' | 'admin';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  preferred_name: string;
  conversation_style: string;
  language_pref: string;
  created_at: number;
  updated_at: number;
}

export interface UserConsents {
  user_id: string;
  emotion_insights_enabled: number;
  cross_session_memory_enabled: number;
  analytics_enabled: number;
  updated_at: number;
}

export interface SessionUser {
  id: string;
  email: string;
  preferred_name: string;
  conversation_style: string;
  language_pref: string;
  roles: UserRole[];
  consents: {
    emotion_insights_enabled: boolean;
    cross_session_memory_enabled: boolean;
    analytics_enabled: boolean;
  };
}

export type RiskTier = 'LOW' | 'MODERATE' | 'HIGH' | 'IMMINENT';

export interface SafetyAssessment {
  risk_tier: RiskTier;
  trigger_rule: string;
  is_negated: boolean;
  confidence: number;
  action_taken: string;
  crisis_resources_required: boolean;
}

export interface EmotionClassification {
  primary_emotion: string;
  secondary_emotions: string[];
  intensity: number;
  confidence: number;
  evidence_type: string;
  requires_review: boolean;
}

export const ALLOWED_EMOTIONS = [
  'Happiness',
  'Sadness',
  'Anxiety',
  'Fear',
  'Anger',
  'Frustration',
  'Loneliness',
  'Guilt',
  'Hopelessness',
  'Confusion',
  'Calmness',
  'Relief',
  'Hopefulness'
] as const;

export type AllowedEmotion = typeof ALLOWED_EMOTIONS[number];
