-- Migration: 0001_initial_schema.sql
-- Database schema for Haven Mental Wellness Platform (Cloudflare D1 / SQLite)

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    preferred_name TEXT NOT NULL,
    conversation_style TEXT DEFAULT 'warm_empathic',
    language_pref TEXT DEFAULT 'en',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Consents table
CREATE TABLE IF NOT EXISTS consents (
    user_id TEXT PRIMARY KEY,
    emotion_insights_enabled INTEGER DEFAULT 1,
    cross_session_memory_enabled INTEGER DEFAULT 1,
    analytics_enabled INTEGER DEFAULT 0,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. User Roles (RBAC: 'user', 'consultant', 'admin')
CREATE TABLE IF NOT EXISTS user_roles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'consultant', 'admin')),
    granted_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);

-- 4. Auth Sessions (Tokens stored as SHA-256 hashes)
CREATE TABLE IF NOT EXISTS auth_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    last_active_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);

-- 5. Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    active_risk_tier TEXT DEFAULT 'LOW' CHECK(active_risk_tier IN ('LOW', 'MODERATE', 'HIGH', 'IMMINENT')),
    is_archived INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);

-- 6. Messages
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);

-- 7. Cross-Session Memory Items
CREATE TABLE IF NOT EXISTS memory_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT,
    memory_type TEXT NOT NULL CHECK(memory_type IN ('episodic', 'semantic')),
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    sensitivity_level TEXT DEFAULT 'low' CHECK(sensitivity_level IN ('low', 'medium', 'high')),
    is_approved INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_memory_user ON memory_items(user_id, memory_type);

-- 8. Session Summaries
CREATE TABLE IF NOT EXISTS session_summaries (
    id TEXT PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    summary TEXT NOT NULL,
    key_topics TEXT, -- JSON array of topics
    coping_strategies TEXT, -- JSON array of strategies
    created_at INTEGER NOT NULL,
    FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_summaries_user ON session_summaries(user_id);

-- 9. Emotion Events (Inferred by analysis engine)
CREATE TABLE IF NOT EXISTS emotion_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    primary_emotion TEXT NOT NULL,
    secondary_emotions TEXT, -- JSON array
    intensity REAL NOT NULL,
    confidence REAL NOT NULL,
    evidence_type TEXT DEFAULT 'message_inference',
    requires_review INTEGER DEFAULT 0,
    user_corrected_emotion TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY(message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_emotions_user_time ON emotion_events(user_id, created_at);

-- 10. Self-Reported Mood Check-ins
CREATE TABLE IF NOT EXISTS mood_checkins (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    mood_score INTEGER NOT NULL CHECK(mood_score BETWEEN 1 AND 5),
    primary_emotion TEXT NOT NULL,
    notes TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mood_user_time ON mood_checkins(user_id, created_at);

-- 11. Safety Events (Risk Engine Observations)
CREATE TABLE IF NOT EXISTS safety_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    risk_tier TEXT NOT NULL CHECK(risk_tier IN ('LOW', 'MODERATE', 'HIGH', 'IMMINENT')),
    trigger_rule TEXT NOT NULL,
    is_negated INTEGER DEFAULT 0,
    confidence REAL NOT NULL,
    action_taken TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY(message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_safety_user ON safety_events(user_id, risk_tier);

-- 12. Escalation Events & Funnel
CREATE TABLE IF NOT EXISTS escalation_events (
    id TEXT PRIMARY KEY,
    pseudonymous_user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    escalation_ref TEXT UNIQUE NOT NULL,
    risk_tier TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK(event_type IN (
        'risk_detected',
        'support_prompt_shown',
        'booking_clicked',
        'booking_page_opened',
        'booking_started',
        'booking_completed',
        'booking_cancelled',
        'support_dismissed',
        'return_to_chat',
        'emergency_resource_opened'
    )),
    metadata TEXT, -- JSON non-sensitive metadata
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_escalation_ref ON escalation_events(escalation_ref);
CREATE INDEX IF NOT EXISTS idx_escalation_time ON escalation_events(created_at);

-- 13. Consultants Directory
CREATE TABLE IF NOT EXISTS consultants (
    id TEXT PRIMARY KEY,
    user_id TEXT, -- Optional link to user account if consultant logs in
    name TEXT NOT NULL,
    designation TEXT NOT NULL,
    credentials_verified INTEGER DEFAULT 0,
    areas_of_practice TEXT NOT NULL, -- JSON array
    languages TEXT NOT NULL, -- JSON array
    short_bio TEXT NOT NULL,
    booking_url TEXT NOT NULL,
    availability_info TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- 14. Appointments (Booking Workflow)
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    escalation_ref TEXT,
    consultant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('prompt_shown', 'clicked', 'started', 'completed', 'cancelled')),
    scheduled_time INTEGER,
    consultant_notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(consultant_id) REFERENCES consultants(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_appointments_consultant ON appointments(consultant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id);

-- 15. Analytics Events (Pseudonymous, non-sensitive, consent-controlled)
CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY,
    pseudonymous_user_id TEXT NOT NULL,
    session_id TEXT,
    event_name TEXT NOT NULL,
    properties TEXT, -- JSON without any message text or personal data
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event_name, created_at);

-- 16. Audit Logs (Sensitive actions, admin operations, data exports)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    target_resource TEXT NOT NULL,
    details TEXT,
    ip_hash TEXT,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id, created_at);
