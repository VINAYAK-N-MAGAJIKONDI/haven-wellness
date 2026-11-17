/**
 * Haven Mental Wellness Platform - API Client
 * Secure communication with Cloudflare Worker Backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('haven_auth_token');
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('haven_auth_token', token);
      } else {
        localStorage.removeItem('haven_auth_token');
      }
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Send cookies for cross-origin if configured
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data as T;
  }

  // Health
  public async checkHealth() {
    return this.request<any>('/api/health');
  }

  // Auth
  public async register(payload: any) {
    const res = await this.request<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.token) this.setToken(res.token);
    return res;
  }

  public async login(payload: any) {
    const res = await this.request<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.token) this.setToken(res.token);
    return res;
  }

  public async logout() {
    try {
      await this.request<any>('/api/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  public async getMe() {
    return this.request<any>('/api/auth/me');
  }

  // Chat
  public async getSessions() {
    return this.request<{ sessions: any[] }>('/api/chat/sessions');
  }

  public async createSession(title?: string) {
    return this.request<{ session: any }>('/api/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ title })
    });
  }

  public async getSessionMessages(sessionId: string) {
    return this.request<{ session: any; messages: any[] }>(`/api/chat/sessions/${sessionId}`);
  }

  public async deleteSession(sessionId: string) {
    return this.request<any>(`/api/chat/sessions/${sessionId}`, { method: 'DELETE' });
  }

  public async sendMessage(sessionId: string, content: string) {
    return this.request<any>('/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ sessionId, content })
    });
  }

  // Memory
  public async getMemories() {
    return this.request<{ memories: any[]; summaries: any[]; memory_consent_enabled: boolean }>('/api/memory');
  }

  public async updateMemory(id: string, payload: { content?: string; is_approved?: boolean }) {
    return this.request<any>(`/api/memory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  public async deleteMemory(id: string) {
    return this.request<any>(`/api/memory/${id}`, { method: 'DELETE' });
  }

  public async updateMemoryPreferences(payload: { cross_session_memory_enabled?: boolean; new_preference?: string }) {
    return this.request<any>('/api/memory/preferences', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async clearAllMemories() {
    return this.request<any>('/api/memory/clear-all', { method: 'POST' });
  }

  // Emotions
  public async getEmotions() {
    return this.request<{ observations: any[]; checkins: any[] }>('/api/emotions');
  }

  public async submitMoodCheckin(payload: { mood_score: number; primary_emotion: string; notes?: string }) {
    return this.request<any>('/api/emotions/checkins', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async correctEmotion(observationId: string, corrected_emotion: string) {
    return this.request<any>(`/api/emotions/${observationId}/correct`, {
      method: 'PATCH',
      body: JSON.stringify({ corrected_emotion })
    });
  }

  public async getEmotionTrends() {
    return this.request<any>('/api/emotions/trends');
  }

  // Safety
  public async getSafetyResources() {
    return this.request<{ disclaimer: string; resources: any[] }>('/api/safety/resources');
  }

  public async assessSafety(text: string) {
    return this.request<any>('/api/safety/assess', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }

  // Consultants & Appointments
  public async getConsultants() {
    return this.request<{ consultants: any[] }>('/api/consultants');
  }

  public async createAppointment(consultantId: string, escalationRef?: string, sessionId?: string) {
    return this.request<any>('/api/consultants/appointments', {
      method: 'POST',
      body: JSON.stringify({ consultant_id: consultantId, escalation_ref: escalationRef, session_id: sessionId })
    });
  }

  // Escalation events
  public async logEscalationEvent(ref: string, payload: { event_type: string; session_id?: string; metadata?: any }) {
    return this.request<any>(`/api/escalations/${ref}/events`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // User Profile & GDPR
  public async getProfile() {
    return this.request<{ profile: any }>('/api/user/profile');
  }

  public async updateProfile(payload: any) {
    return this.request<any>('/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  public async exportUserData() {
    return this.request<any>('/api/user/export', { method: 'POST' });
  }

  public async deleteAccount() {
    const res = await this.request<any>('/api/user/account', { method: 'DELETE' });
    this.setToken(null);
    return res;
  }

  // Admin
  public async getAdminOverview() {
    return this.request<any>('/api/admin/overview');
  }

  public async getAdminEscalations() {
    return this.request<any>('/api/admin/escalations');
  }

  public async getAdminAuditLogs() {
    return this.request<any>('/api/admin/audit-logs');
  }

  public async bootstrapAdmin(email: string, secret: string) {
    return this.request<any>('/api/admin/bootstrap', {
      method: 'POST',
      body: JSON.stringify({ email, secret })
    });
  }

  public async getConsultantAppointments() {
    return this.request<any>('/api/admin/consultant/appointments');
  }

  public async updateConsultantAppointment(id: string, payload: any) {
    return this.request<any>(`/api/admin/consultant/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }
}

export const api = new ApiClient();
