'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthModal } from '@/components/AuthModal';
import { api } from '@/lib/api';
import { ALLOWED_EMOTIONS, MoodCheckin, EmotionObservation } from '@/types';
import { formatDate, formatDateTime } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import {
  Heart,
  TrendingUp,
  Calendar,
  Sparkles,
  Smile,
  Frown,
  Meh,
  Edit2,
  Check,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

const EMOTION_OPTIONS = [
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
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<MoodCheckin[]>([]);
  const [observations, setObservations] = useState<EmotionObservation[]>([]);
  const [intensityTimeline, setIntensityTimeline] = useState<any[]>([]);

  // Mood Check-in Form
  const [moodScore, setMoodScore] = useState(4);
  const [primaryEmotion, setPrimaryEmotion] = useState('Calmness');
  const [notes, setNotes] = useState('');
  const [submittingCheckin, setSubmittingCheckin] = useState(false);
  const [checkinSuccess, setCheckinSuccess] = useState(false);

  // Correction Modal
  const [editingObservation, setEditingObservation] = useState<EmotionObservation | null>(null);
  const [correctionTarget, setCorrectionTarget] = useState('Calmness');
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [emotionsRes, trendsRes] = await Promise.all([
        api.getEmotions(),
        api.getEmotionTrends()
      ]);

      setObservations(emotionsRes.observations || []);
      setCheckins(emotionsRes.checkins || []);
      setDistribution(trendsRes.distribution || []);
      setIntensityTimeline(
        (trendsRes.intensityTimeline || []).map((t: any) => ({
          ...t,
          date: formatDate(t.created_at),
          intensityPct: Math.round(t.intensity * 100)
        }))
      );
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      if (!api.getToken()) {
        setShowAuthModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMoodCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCheckin(true);
    try {
      await api.submitMoodCheckin({
        mood_score: moodScore,
        primary_emotion: primaryEmotion,
        notes: notes.trim() || undefined
      });
      setNotes('');
      setCheckinSuccess(true);
      setTimeout(() => setCheckinSuccess(false), 3000);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to record check-in', err);
    } finally {
      setSubmittingCheckin(false);
    }
  };

  const handleSaveCorrection = async () => {
    if (!editingObservation) return;
    try {
      await api.correctEmotion(editingObservation.id, correctionTarget);
      setEditingObservation(null);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to correct observation', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-haven-100 selection:text-haven-900">
      <Navbar />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Top Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-haven-700">Reflective Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-charcoal-900">
            Emotional Insights & Check-ins
          </h1>
          <p className="text-xs sm:text-sm text-mutedText mt-1 max-w-2xl">
            Track and reflect on your emotional patterns over time. These observations represent your self-reported feelings and AI-assisted reflections, not clinical diagnostics.
          </p>
        </div>

        {/* 1. Quick Mood Check-in Widget */}
        <section className="mb-8 rounded-2xl border border-beige-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-haven-600" />
              <h2 className="text-base font-semibold text-charcoal-900">How are you feeling right now?</h2>
            </div>
            {checkinSuccess && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                <Check className="h-3.5 w-3.5" />
                <span>Check-in recorded</span>
              </span>
            )}
          </div>

          <form onSubmit={handleMoodCheckin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-charcoal-700 mb-2">Overall Mood Level (1 to 5)</label>
              <div className="flex items-center gap-3">
                {[
                  { score: 1, label: 'Very Low', icon: Frown },
                  { score: 2, label: 'Low', icon: Frown },
                  { score: 3, label: 'Neutral', icon: Meh },
                  { score: 4, label: 'Good', icon: Smile },
                  { score: 5, label: 'Peaceful', icon: Smile }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.score}
                      type="button"
                      onClick={() => setMoodScore(item.score)}
                      className={`flex-1 flex flex-col items-center py-2.5 px-2 rounded-xl border text-xs transition ${
                        moodScore === item.score
                          ? 'border-haven-600 bg-haven-50/70 text-haven-900 ring-1 ring-haven-600'
                          : 'border-beige-200 bg-beige-50/40 text-charcoal-600 hover:bg-beige-100/60'
                      }`}
                    >
                      <Icon className="h-4 w-4 mb-1 text-haven-700" />
                      <span className="font-semibold">{item.score}</span>
                      <span className="text-[10px] text-mutedText">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">Primary Feeling</label>
                <select
                  value={primaryEmotion}
                  onChange={(e) => setPrimaryEmotion(e.target.value)}
                  className="w-full rounded-xl border border-beige-300 bg-beige-50/40 px-3 py-2 text-xs text-foreground focus:outline-hidden focus:border-haven-600"
                >
                  {EMOTION_OPTIONS.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">Optional Note / Thought</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Took a slow walk after lunch"
                  className="w-full rounded-xl border border-beige-300 bg-beige-50/40 px-3 py-2 text-xs text-foreground placeholder:text-mutedText focus:outline-hidden focus:border-haven-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingCheckin}
              className="rounded-xl bg-haven-700 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-haven-800 disabled:opacity-50 transition"
            >
              {submittingCheckin ? 'Saving...' : 'Record Mood Check-in'}
            </button>
          </form>
        </section>

        {/* 2. Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Emotion Distribution Bar Chart */}
          <div className="rounded-2xl border border-beige-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-haven-600" />
                <h3 className="text-sm font-semibold text-charcoal-900">Emotion Frequency Distribution</h3>
              </div>
              <span className="text-[11px] text-mutedText">All Sessions</span>
            </div>

            {distribution.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-xs text-mutedText">
                No emotional observations recorded yet. Start a chat or submit a check-in.
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E1D7" />
                    <XAxis dataKey="emotion" tick={{ fontSize: 10, fill: '#667085' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#667085' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        borderColor: '#E8E1D7',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="count" fill="#5F7A61" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Intensity Over Time Line Chart */}
          <div className="rounded-2xl border border-beige-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-haven-600" />
                <h3 className="text-sm font-semibold text-charcoal-900">Emotional Intensity Trend</h3>
              </div>
              <span className="text-[11px] text-mutedText">0 - 100%</span>
            </div>

            {intensityTimeline.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-xs text-mutedText">
                Insufficient message history to graph intensity trends.
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={intensityTimeline}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E1D7" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#667085' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#667085' }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        borderColor: '#E8E1D7',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="intensityPct"
                      name="Intensity %"
                      stroke="#4A6B53"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#2D4A3E' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* 3. Recent Observations & Self-Correction Table */}
        <section className="rounded-2xl border border-beige-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-charcoal-900">Recent Emotional Observations</h3>
              <p className="text-xs text-mutedText">
                AI inferred patterns with option to correct any observation that does not feel accurate to you.
              </p>
            </div>
            <span className="text-xs font-mono text-mutedText">{observations.length} Observations</span>
          </div>

          {observations.length === 0 ? (
            <div className="py-8 text-center text-xs text-mutedText">
              No recent emotion events. Your observations will appear here after conversational reflections.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-beige-200 text-mutedText">
                    <th className="py-2.5 font-medium">Recorded</th>
                    <th className="py-2.5 font-medium">Inferred Emotion</th>
                    <th className="py-2.5 font-medium">Intensity</th>
                    <th className="py-2.5 font-medium">Secondary</th>
                    <th className="py-2.5 font-medium">User Correction</th>
                    <th className="py-2.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige-100">
                  {observations.slice(0, 10).map((obs) => (
                    <tr key={obs.id} className="hover:bg-beige-50/50 transition">
                      <td className="py-2.5 text-mutedText">{formatDateTime(obs.created_at)}</td>
                      <td className="py-2.5 font-medium text-charcoal-900">
                        {obs.primary_emotion}
                      </td>
                      <td className="py-2.5">
                        <span className="rounded-full bg-haven-100 px-2 py-0.5 text-[10px] font-semibold text-haven-800">
                          {Math.round(obs.intensity * 100)}%
                        </span>
                      </td>
                      <td className="py-2.5 text-mutedText">
                        {obs.secondary_emotions?.join(', ') || 'None'}
                      </td>
                      <td className="py-2.5">
                        {obs.user_corrected_emotion ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            {obs.user_corrected_emotion} (User Verified)
                          </span>
                        ) : (
                          <span className="text-[10px] text-mutedText">Original</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => {
                            setEditingObservation(obs);
                            setCorrectionTarget(obs.user_corrected_emotion || obs.primary_emotion);
                          }}
                          className="flex items-center gap-1 ml-auto text-haven-700 hover:text-haven-900 font-medium transition"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Correct</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <Footer />

      {/* Observation Correction Modal */}
      {editingObservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-beige-200 bg-white p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-semibold text-charcoal-900">Correct Inferred Emotion</h4>
            <p className="text-xs text-mutedText leading-relaxed">
              Haven inferred &quot;{editingObservation.primary_emotion}&quot;. What emotion best reflected your actual experience?
            </p>
            <select
              value={correctionTarget}
              onChange={(e) => setCorrectionTarget(e.target.value)}
              className="w-full rounded-xl border border-beige-300 bg-beige-50/40 px-3 py-2 text-xs text-foreground focus:outline-hidden"
            >
              {EMOTION_OPTIONS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingObservation(null)}
                className="rounded-lg border border-beige-300 px-3 py-1.5 text-xs font-medium text-charcoal-700 hover:bg-beige-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCorrection}
                className="rounded-lg bg-haven-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-haven-800"
              >
                Save Correction
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => loadDashboardData()}
        />
      )}
    </div>
  );
}
