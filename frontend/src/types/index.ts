export type UserRole = 'user' | 'consultant' | 'admin';

export interface User {
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

export interface ChatSession {
  id: string;
  title: string;
  active_risk_tier: 'LOW' | 'MODERATE' | 'HIGH' | 'IMMINENT';
  created_at: number;
  updated_at: number;
  last_message?: string;
  message_count?: number;
}

export interface Message {
  id: string;
  session_id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: number;
}

export interface EmergencyResource {
  name: string;
  contact: string;
  type: 'helpline' | 'emergency' | 'institute';
  available: string;
  description: string;
  directActionUrl: string;
}

export interface MemoryItem {
  id: string;
  session_id: string | null;
  memory_type: 'episodic' | 'semantic';
  topic: string;
  content: string;
  sensitivity_level: 'low' | 'medium' | 'high';
  is_approved: number;
  created_at: number;
  updated_at: number;
}

export interface SessionSummary {
  id: string;
  session_id: string;
  summary: string;
  key_topics: string;
  coping_strategies: string;
  created_at: number;
}

export interface EmotionObservation {
  id: string;
  session_id: string;
  message_id: string;
  primary_emotion: string;
  secondary_emotions: string[];
  intensity: number;
  confidence: number;
  evidence_type: string;
  user_corrected_emotion?: string;
  created_at: number;
}

export interface MoodCheckin {
  id: string;
  mood_score: number;
  primary_emotion: string;
  notes?: string;
  created_at: number;
}

export interface Consultant {
  id: string;
  name: string;
  designation: string;
  credentials_verified: boolean;
  areas_of_practice: string[];
  languages: string[];
  short_bio: string;
  booking_url: string;
  availability_info: string;
}

export interface Appointment {
  id: string;
  escalation_ref: string;
  consultant_name?: string;
  status: 'prompt_shown' | 'clicked' | 'started' | 'completed' | 'cancelled';
  scheduled_time?: number;
  consultant_notes?: string;
  created_at: number;
  updated_at: number;
}
