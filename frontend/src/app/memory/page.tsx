'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthModal } from '@/components/AuthModal';
import { api } from '@/lib/api';
import { MemoryItem, SessionSummary } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  Database,
  Trash2,
  Edit3,
  Plus,
  Check,
  Shield,
  Sparkles,
  BookOpen,
  AlertCircle
} from 'lucide-react';

export default function MemoryPage() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [summaries, setSummaries] = useState<SessionSummary[]>([]);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [newPreference, setNewPreference] = useState('');
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    setLoading(true);
    try {
      const res = await api.getMemories();
      setMemories(res.memories || []);
      setSummaries(res.summaries || []);
      setMemoryEnabled(res.memory_consent_enabled ?? true);
    } catch (err) {
      console.error('Failed to load memories', err);
      if (!api.getToken()) {
        setShowAuthModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleConsent = async (enabled: boolean) => {
    try {
      setMemoryEnabled(enabled);
      await api.updateMemoryPreferences({ cross_session_memory_enabled: enabled });
      flashMessage(enabled ? 'Cross-session memory enabled' : 'Cross-session memory paused');
    } catch (err) {
      console.error('Failed to update consent', err);
    }
  };

  const handleAddPreference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPreference.trim()) return;
    try {
      await api.updateMemoryPreferences({ new_preference: newPreference.trim() });
      setNewPreference('');
      flashMessage('Explicit preference saved to semantic memory');
      loadMemories();
    } catch (err) {
      console.error('Failed to save preference', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
      flashMessage('Memory item deleted');
    } catch (err) {
      console.error('Failed to delete memory', err);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMemory) return;
    try {
      await api.updateMemory(editingMemory.id, { content: editContent.trim() });
      setEditingMemory(null);
      flashMessage('Memory updated');
      loadMemories();
    } catch (err) {
      console.error('Failed to update memory', err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to permanently clear all personal conversational memories?')) return;
    try {
      await api.clearAllMemories();
      setMemories([]);
      setSummaries([]);
      flashMessage('All personal memories permanently erased');
    } catch (err) {
      console.error('Failed to clear memories', err);
    }
  };

  const flashMessage = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-haven-100 selection:text-haven-900">
      <Navbar />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-haven-700">User Data Ownership</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-charcoal-900">
              Cross-Session Memory Management
            </h1>
            <p className="text-xs sm:text-sm text-mutedText mt-1 max-w-xl">
              Inspect, modify, or erase what Haven remembers from past conversations. You hold complete authority over your conversational history.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/60 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear All Memories</span>
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Consent Toggle Card */}
        <section className="mb-8 rounded-2xl border border-beige-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 pr-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-haven-600" />
              <h3 className="text-sm font-semibold text-charcoal-900">Cross-Session Conversational Memory</h3>
            </div>
            <p className="text-xs text-mutedText">
              When enabled, Haven references past session summaries to maintain continuity. When disabled, Haven operates in stateless mode.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={memoryEnabled}
              onChange={(e) => handleToggleConsent(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-beige-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-beige-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-haven-600" />
          </label>
        </section>

        {/* Add Semantic Preference */}
        <section className="mb-8 rounded-2xl border border-beige-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-charcoal-900 mb-1">Add Explicit Preference or Goal</h3>
          <p className="text-xs text-mutedText mb-3">
            Explicitly tell Haven how you prefer to converse (e.g. &quot;I work best with short mindfulness exercises&quot;).
          </p>
          <form onSubmit={handleAddPreference} className="flex gap-2">
            <input
              type="text"
              value={newPreference}
              onChange={(e) => setNewPreference(e.target.value)}
              placeholder="e.g. I prefer quiet listening before discussing coping strategies"
              className="flex-1 rounded-xl border border-beige-300 bg-beige-50/40 px-3.5 py-2 text-xs text-foreground placeholder:text-mutedText focus:outline-hidden focus:border-haven-600"
            />
            <button
              type="submit"
              disabled={!newPreference.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-haven-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-haven-800 disabled:opacity-40 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Save Preference</span>
            </button>
          </form>
        </section>

        {/* Stored Memory Items */}
        <section className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-haven-600" />
              <h3 className="text-base font-semibold text-charcoal-900">Stored Conversational Memories</h3>
            </div>
            <span className="text-xs font-mono text-mutedText">{memories.length} items</span>
          </div>

          {memories.length === 0 ? (
            <div className="rounded-2xl border border-beige-200 bg-white p-8 text-center text-xs text-mutedText">
              No long-term memories currently stored. Memories are generated after conversational milestones with your consent.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {memories.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-beige-200 bg-white p-4 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="rounded-full bg-beige-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-haven-800">
                        {m.memory_type} • {m.topic}
                      </span>
                      <span className="text-[10px] text-mutedText">{formatDate(m.created_at)}</span>
                    </div>
                    <p className="text-xs text-charcoal-800 leading-relaxed">{m.content}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-beige-100 flex items-center justify-end gap-2 text-xs">
                    <button
                      onClick={() => {
                        setEditingMemory(m);
                        setEditContent(m.content);
                      }}
                      className="flex items-center gap-1 text-haven-700 hover:text-haven-900 font-medium"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium ml-2"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Session Summaries */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-haven-600" />
            <h3 className="text-base font-semibold text-charcoal-900">Recent Session Summaries</h3>
          </div>

          {summaries.length === 0 ? (
            <div className="rounded-2xl border border-beige-200 bg-white p-6 text-center text-xs text-mutedText">
              No session summaries recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {summaries.map((s) => (
                <div key={s.id} className="rounded-xl border border-beige-200 bg-white p-4 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-mutedText mb-1">
                    <span>Summary Milestone</span>
                    <span>{formatDate(s.created_at)}</span>
                  </div>
                  <p className="text-charcoal-800 font-medium">{s.summary}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />

      {/* Edit Memory Modal */}
      {editingMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-beige-200 bg-white p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-semibold text-charcoal-900">Edit Memory Content</h4>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-beige-300 bg-beige-50/40 p-3 text-xs text-foreground focus:outline-hidden focus:border-haven-600"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingMemory(null)}
                className="rounded-lg border border-beige-300 px-3 py-1.5 text-xs font-medium text-charcoal-700 hover:bg-beige-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="rounded-lg bg-haven-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-haven-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => loadMemories()}
        />
      )}
    </div>
  );
}
