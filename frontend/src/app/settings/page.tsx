'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthModal } from '@/components/AuthModal';
import { api } from '@/lib/api';
import { User } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  User as UserIcon,
  Shield,
  Download,
  Trash2,
  Check,
  Sparkles,
  Lock,
  Heart,
  AlertTriangle
} from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [preferredName, setPreferredName] = useState('');
  const [conversationStyle, setConversationStyle] = useState('warm_empathic');
  const [languagePref, setLanguagePref] = useState('en');
  const [emotionConsent, setEmotionConsent] = useState(true);
  const [memoryConsent, setMemoryConsent] = useState(true);
  const [analyticsConsent, setAnalyticsConsent] = useState(false);

  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.getProfile();
      if (res.profile) {
        setUser(res.profile);
        setPreferredName(res.profile.preferred_name);
        setConversationStyle(res.profile.conversation_style || 'warm_empathic');
        setLanguagePref(res.profile.language_pref || 'en');
        setEmotionConsent(res.profile.consents.emotion_insights_enabled);
        setMemoryConsent(res.profile.consents.cross_session_memory_enabled);
        setAnalyticsConsent(res.profile.consents.analytics_enabled);
      }
    } catch (err) {
      console.error('Failed to load profile', err);
      if (!api.getToken()) {
        setShowAuthModal(true);
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile({
        preferred_name: preferredName.trim(),
        conversation_style: conversationStyle,
        language_pref: languagePref,
        consents: {
          emotion_insights_enabled: emotionConsent,
          cross_session_memory_enabled: memoryConsent,
          analytics_enabled: analyticsConsent
        }
      });
      flashMessage('Settings and privacy preferences updated');
      loadProfile();
    } catch (err) {
      console.error('Failed to update settings', err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await api.exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `haven-data-archive-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      flashMessage('Personal archive successfully downloaded');
    } catch (err) {
      console.error('Data export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      'Type "DELETE" to permanently erase your Haven account, conversations, and personal memories:'
    );
    if (confirmation !== 'DELETE') return;

    setDeleting(true);
    try {
      await api.deleteAccount();
      alert('Your account and all associated data have been permanently erased.');
      window.location.href = '/';
    } catch (err) {
      console.error('Account deletion failed', err);
      setDeleting(false);
    }
  };

  const flashMessage = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-haven-100 selection:text-haven-900">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-haven-700">Account Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-charcoal-900">
            Privacy & Profile Settings
          </h1>
          <p className="text-xs sm:text-sm text-mutedText mt-1">
            Control your companion style, granular feature consents, data portability, and right to be forgotten.
          </p>
        </div>

        {statusMsg && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="space-y-8">
          {/* 1. Profile Preferences Form */}
          <section className="rounded-2xl border border-beige-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-charcoal-900 mb-4 flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-haven-600" />
              <span>Personalization</span>
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-charcoal-700 mb-1">Email (Account Identifier)</label>
                  <input
                    type="text"
                    disabled
                    value={user?.email || ''}
                    className="w-full rounded-xl border border-beige-200 bg-beige-50/60 px-3 py-2 text-xs text-mutedText"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-charcoal-700 mb-1">Preferred Name</label>
                  <input
                    type="text"
                    required
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    className="w-full rounded-xl border border-beige-300 bg-beige-50/40 px-3 py-2 text-xs text-foreground focus:outline-hidden focus:border-haven-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-charcoal-700 mb-1">Conversation Style</label>
                  <select
                    value={conversationStyle}
                    onChange={(e) => setConversationStyle(e.target.value)}
                    className="w-full rounded-xl border border-beige-300 bg-beige-50/40 px-3 py-2 text-xs text-foreground focus:outline-hidden focus:border-haven-600"
                  >
                    <option value="warm_empathic">Warm & Empathetic (Default)</option>
                    <option value="gentle_reflective">Gentle & Reflective</option>
                    <option value="direct_practical">Grounding & Structured</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-charcoal-700 mb-1">Primary Language</label>
                  <select
                    value={languagePref}
                    onChange={(e) => setLanguagePref(e.target.value)}
                    className="w-full rounded-xl border border-beige-300 bg-beige-50/40 px-3 py-2 text-xs text-foreground focus:outline-hidden focus:border-haven-600"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="bn">Bengali (বাংলা)</option>
                    <option value="ta">Tamil (தமிழ்)</option>
                  </select>
                </div>
              </div>

              {/* Consent Toggles */}
              <div className="pt-4 border-t border-beige-100 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-700">Feature Consents</h3>

                <div className="flex items-center justify-between p-3 rounded-xl border border-beige-200 bg-beige-50/30">
                  <div className="pr-3">
                    <span className="text-xs font-medium text-charcoal-900 block">Emotion Insights Tracking</span>
                    <span className="text-[11px] text-mutedText">Enables emotional categorization for your reflective charts.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={emotionConsent}
                    onChange={(e) => setEmotionConsent(e.target.checked)}
                    className="h-4 w-4 rounded-sm border-beige-300 text-haven-700 focus:ring-haven-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-beige-200 bg-beige-50/30">
                  <div className="pr-3">
                    <span className="text-xs font-medium text-charcoal-900 block">Cross-Session Memory</span>
                    <span className="text-[11px] text-mutedText">Allows Haven to recall important themes across conversations.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={memoryConsent}
                    onChange={(e) => setMemoryConsent(e.target.checked)}
                    className="h-4 w-4 rounded-sm border-beige-300 text-haven-700 focus:ring-haven-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-beige-200 bg-beige-50/30">
                  <div className="pr-3">
                    <span className="text-xs font-medium text-charcoal-900 block">Anonymous System Analytics</span>
                    <span className="text-[11px] text-mutedText">Contributes non-identifiable usage statistics for performance monitoring.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={analyticsConsent}
                    onChange={(e) => setAnalyticsConsent(e.target.checked)}
                    className="h-4 w-4 rounded-sm border-beige-300 text-haven-700 focus:ring-haven-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-haven-700 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-haven-800 disabled:opacity-50 transition"
              >
                {saving ? 'Saving changes...' : 'Save Preferences'}
              </button>
            </form>
          </section>

          {/* 2. GDPR Data Portability */}
          <section className="rounded-2xl border border-beige-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-charcoal-900 mb-1 flex items-center gap-2">
              <Download className="h-4 w-4 text-haven-600" />
              <span>Export Personal Archive (GDPR / DPDP)</span>
            </h2>
            <p className="text-xs text-mutedText mb-4 leading-relaxed">
              Download your complete personal data archive in structured JSON format, including all conversation logs, mood check-ins, and memories.
            </p>
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="flex items-center gap-2 rounded-xl border border-beige-300 bg-beige-50 px-4 py-2 text-xs font-semibold text-charcoal-800 hover:bg-beige-100 disabled:opacity-50 transition"
            >
              <Download className="h-3.5 w-3.5 text-haven-600" />
              <span>{exporting ? 'Preparing archive...' : 'Download My Data Archive'}</span>
            </button>
          </section>

          {/* 3. Account Deletion (Danger Zone) */}
          <section className="rounded-2xl border border-red-200 bg-red-50/30 p-6 shadow-xs">
            <h2 className="text-base font-semibold text-red-900 mb-1 flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-600" />
              <span>Permanent Account Deletion</span>
            </h2>
            <p className="text-xs text-red-700 mb-4 leading-relaxed">
              This action is immediate and non-reversible. It permanently purges your account, sessions, messages, and memories from the Cloudflare D1 database.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-700 disabled:opacity-50 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{deleting ? 'Deleting account...' : 'Permanently Delete Account'}</span>
            </button>
          </section>
        </div>
      </main>

      <Footer />

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => loadProfile()}
        />
      )}
    </div>
  );
}
