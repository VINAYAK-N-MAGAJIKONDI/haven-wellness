'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Sparkles, Shield, Heart, Eye, Check } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [conversationStyle, setConversationStyle] = useState('warm_empathic');
  const [languagePref, setLanguagePref] = useState('en');
  const [emotionConsent, setEmotionConsent] = useState(true);
  const [memoryConsent, setMemoryConsent] = useState(true);
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFinish = async () => {
    setLoading(true);
    try {
      await api.updateProfile({
        conversation_style: conversationStyle,
        language_pref: languagePref,
        consents: {
          emotion_insights_enabled: emotionConsent,
          cross_session_memory_enabled: memoryConsent,
          analytics_enabled: analyticsConsent
        }
      });
      onComplete();
    } catch (err) {
      console.error('Failed to save onboarding preferences', err);
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-beige-200 bg-white p-7 shadow-xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-haven-100 text-haven-700">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-700">
              Welcome to Haven • Step {step} of 2
            </span>
          </div>
          <div className="flex gap-1.5">
            <div className={`h-1.5 w-6 rounded-full ${step >= 1 ? 'bg-haven-600' : 'bg-beige-200'}`} />
            <div className={`h-1.5 w-6 rounded-full ${step >= 2 ? 'bg-haven-600' : 'bg-beige-200'}`} />
          </div>
        </div>

        {step === 1 ? (
          <div className="space-y-5">
            <div>
              <h3 className="text-xl font-bold text-charcoal-900 mb-1">Tailor Your Companion</h3>
              <p className="text-xs text-mutedText">
                How would you prefer Haven to listen and converse with you?
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'warm_empathic',
                  title: 'Warm & Empathetic (Recommended)',
                  desc: 'Gentle, supportive, holding space for your feelings before discussing next steps.'
                },
                {
                  id: 'gentle_reflective',
                  title: 'Gentle & Reflective',
                  desc: 'Focuses deeply on asking thoughtful questions to help you unpack experiences.'
                },
                {
                  id: 'direct_practical',
                  title: 'Grounding & Structured',
                  desc: 'Focused on calm mindfulness exercises, clarity, and practical grounding tools.'
                }
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setConversationStyle(style.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition ${
                    conversationStyle === style.id
                      ? 'border-haven-600 bg-haven-50/50 text-foreground ring-1 ring-haven-600'
                      : 'border-beige-200 bg-white hover:bg-beige-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{style.title}</span>
                    {conversationStyle === style.id && <Check className="h-4 w-4 text-haven-700" />}
                  </div>
                  <p className="text-xs text-mutedText mt-1">{style.desc}</p>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-medium text-charcoal-700 mb-1">Primary Language</label>
              <select
                value={languagePref}
                onChange={(e) => setLanguagePref(e.target.value)}
                className="w-full rounded-xl border border-beige-300 bg-beige-50/40 px-3 py-2 text-sm text-foreground focus:outline-hidden focus:border-haven-600"
              >
                <option value="en">English</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="bn">Bengali (বাংলা)</option>
                <option value="ta">Tamil (தமிழ்)</option>
                <option value="te">Telugu (తెలుగు)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full rounded-xl bg-haven-700 py-2.5 text-sm font-semibold text-white hover:bg-haven-800 transition"
            >
              Continue to Privacy & Consents
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h3 className="text-xl font-bold text-charcoal-900 mb-1">Privacy & Data Control</h3>
              <p className="text-xs text-mutedText">
                You retain complete ownership over what is remembered. Toggle your preferences anytime in Settings.
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Emotion Insights Consent */}
              <div className="flex items-start justify-between p-3 rounded-xl border border-beige-200 bg-beige-50/40">
                <div className="pr-3">
                  <div className="flex items-center gap-1.5">
                    <Heart className="h-4 w-4 text-haven-600" />
                    <span className="text-xs font-semibold text-charcoal-900">Emotion Insights Dashboard</span>
                  </div>
                  <p className="text-[11px] text-mutedText mt-0.5">
                    Classifies emotional patterns so you can view trends and reflect over time.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={emotionConsent}
                  onChange={(e) => setEmotionConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded-sm border-beige-300 text-haven-700 focus:ring-haven-500"
                />
              </div>

              {/* Cross Session Memory Consent */}
              <div className="flex items-start justify-between p-3 rounded-xl border border-beige-200 bg-beige-50/40">
                <div className="pr-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-haven-600" />
                    <span className="text-xs font-semibold text-charcoal-900">Cross-Session Memory</span>
                  </div>
                  <p className="text-[11px] text-mutedText mt-0.5">
                    Allows Haven to recall important themes from past chats so you don&apos;t have to repeat yourself.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={memoryConsent}
                  onChange={(e) => setMemoryConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded-sm border-beige-300 text-haven-700 focus:ring-haven-500"
                />
              </div>

              {/* Anonymous Analytics Consent */}
              <div className="flex items-start justify-between p-3 rounded-xl border border-beige-200 bg-beige-50/40">
                <div className="pr-3">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-haven-600" />
                    <span className="text-xs font-semibold text-charcoal-900">Anonymous Aggregate Analytics</span>
                  </div>
                  <p className="text-[11px] text-mutedText mt-0.5">
                    Helps us measure system stability. Never includes conversation messages or personal identity.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={analyticsConsent}
                  onChange={(e) => setAnalyticsConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded-sm border-beige-300 text-haven-700 focus:ring-haven-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 rounded-xl border border-beige-300 py-2.5 text-xs font-semibold text-charcoal-700 hover:bg-beige-50 transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="w-2/3 rounded-xl bg-haven-700 py-2.5 text-sm font-semibold text-white hover:bg-haven-800 disabled:opacity-50 transition"
              >
                {loading ? 'Saving...' : 'Start Conversation'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
