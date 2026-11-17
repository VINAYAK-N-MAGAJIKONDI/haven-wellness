'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { SafetyBanner } from '@/components/SafetyBanner';
import { CrisisModal } from '@/components/CrisisModal';
import { AuthModal } from '@/components/AuthModal';
import { api } from '@/lib/api';
import { ChatSession, Message } from '@/types';
import { formatDateTime } from '@/lib/utils';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  AlertTriangle,
  HeartHandshake,
  Menu,
  X,
  MessageSquare,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeRiskTier, setActiveRiskTier] = useState<'LOW' | 'MODERATE' | 'HIGH' | 'IMMINENT'>('LOW');
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [escalationRef, setEscalationRef] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    }
  }, [activeSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    try {
      const res = await api.getSessions();
      setSessions(res.sessions || []);
      if (res.sessions && res.sessions.length > 0) {
        if (!activeSessionId) {
          setActiveSessionId(res.sessions[0].id);
          setActiveRiskTier(res.sessions[0].active_risk_tier || 'LOW');
        }
      } else {
        // Create initial session automatically
        createNewSession();
      }
    } catch (err) {
      console.error('Session loading failed', err);
      if (!api.getToken()) {
        setShowAuthModal(true);
      }
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const res = await api.getSessionMessages(sessionId);
      setMessages(res.messages || []);
      if (res.session) {
        setActiveRiskTier(res.session.active_risk_tier || 'LOW');
      }
    } catch (err) {
      console.error('Failed to load session messages', err);
    }
  };

  const createNewSession = async () => {
    try {
      const res = await api.createSession('New Conversation');
      if (res.session) {
        setSessions((prev) => [res.session, ...prev]);
        setActiveSessionId(res.session.id);
        setMessages([]);
        setActiveRiskTier('LOW');
      }
    } catch (err) {
      console.error('Failed to create session', err);
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteSession(sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);
      if (activeSessionId === sessionId) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
        } else {
          setActiveSessionId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading || !activeSessionId) return;

    const userText = input.trim();
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userText,
      created_at: Math.floor(Date.now() / 1000)
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setLoading(true);
    setTyping(true);

    try {
      const res = await api.sendMessage(activeSessionId, userText);

      if (res.message) {
        setMessages((prev) => [...prev, res.message]);
      }

      if (res.safety) {
        setActiveRiskTier(res.safety.risk_tier);
        if (res.safety.crisis_resources_required) {
          setShowCrisisModal(true);
        }
        if (res.safety.escalation_ref) {
          setEscalationRef(res.safety.escalation_ref);
        }
      }

      // Update session title in sidebar if updated
      loadSessions();
    } catch (err: any) {
      console.error('Failed to send message', err);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content:
          err.message ||
          'I am taking a mindful pause because the free-tier quota is temporarily occupied. Please try again shortly.',
        created_at: Math.floor(Date.now() / 1000)
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  return (
    <div className="flex h-screen flex-col bg-background selection:bg-haven-100 selection:text-haven-900 overflow-hidden">
      <Navbar />

      {/* Safety alert banner if elevated risk */}
      <SafetyBanner
        riskTier={activeRiskTier}
        onOpenCrisisModal={() => setShowCrisisModal(true)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR: Conversation History */}
        <aside
          className={`absolute inset-y-0 left-0 z-30 w-72 border-r border-beige-200 bg-beige-50/70 p-4 transition-transform md:relative md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } flex flex-col justify-between`}
        >
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-beige-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-700">Conversations</span>
              <button
                onClick={createNewSession}
                className="flex items-center gap-1 rounded-lg bg-haven-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-haven-800 transition"
                title="New Conversation"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New</span>
              </button>
            </div>

            {/* Sessions list */}
            <div className="mt-3 space-y-1.5 overflow-y-auto flex-1 pr-1">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setActiveSessionId(s.id);
                    setSidebarOpen(false);
                  }}
                  className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition cursor-pointer ${
                    activeSessionId === s.id
                      ? 'bg-white font-semibold text-haven-900 border border-beige-300 shadow-xs'
                      : 'text-charcoal-600 hover:bg-beige-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden pr-2">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-haven-600" />
                    <span className="truncate">{s.title || 'Conversation'}</span>
                  </div>
                  <button
                    onClick={(e) => deleteSession(s.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-mutedText hover:text-red-600 transition"
                    title="Delete session"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar bottom: Consultant shortcut */}
          <div className="pt-3 border-t border-beige-200">
            <Link
              href="/consultants"
              className="flex items-center gap-2 rounded-xl border border-beige-200 bg-white p-2.5 text-xs font-medium text-charcoal-700 hover:bg-beige-50 transition shadow-xs"
            >
              <HeartHandshake className="h-4 w-4 text-haven-600 shrink-0" />
              <span>Verified Consultants</span>
            </Link>
          </div>
        </aside>

        {/* MAIN CHAT AREA */}
        <section className="flex flex-1 flex-col overflow-hidden bg-background">
          {/* Header Bar */}
          <div className="flex h-12 items-center justify-between border-b border-beige-200 px-4 bg-background/80">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden rounded-lg p-1.5 text-charcoal-700 hover:bg-beige-100"
              >
                {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-haven-500 animate-pulse" />
                <span className="text-xs font-medium text-foreground">
                  Haven AI Companion
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCrisisModal(true)}
                className="text-[11px] font-medium text-red-700 hover:underline flex items-center gap-1"
              >
                <ShieldAlert className="h-3 w-3" />
                <span>Need support?</span>
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 space-y-5">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-haven-100 text-haven-700">
                  <Sparkles className="h-6 w-6 text-haven-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-charcoal-900">A peaceful space to begin</h3>
                  <p className="text-xs text-mutedText leading-relaxed">
                    Take a slow breath. You can talk about what has been on your mind, how your day went, or any emotions you are processing.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-2">
                  {[
                    'I am feeling overwhelmed with work lately.',
                    'Can you help me unpack why I feel so anxious?',
                    'I had a difficult interaction with a friend.',
                    'Just looking for a quiet moment to reflect.'
                  ].map((promptText, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(promptText);
                        textareaRef.current?.focus();
                      }}
                      className="rounded-xl border border-beige-200 bg-white p-2.5 text-left text-xs text-charcoal-700 hover:border-haven-300 hover:bg-beige-50/50 transition shadow-xs"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-medium text-mutedText">
                      {isAssistant ? 'Haven' : 'You'}
                    </span>
                    <span className="text-[10px] text-mutedText/70">• {formatDateTime(m.created_at)}</span>
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      isAssistant
                        ? 'border border-beige-200 bg-white text-charcoal-900 shadow-xs'
                        : 'bg-haven-700 text-white shadow-xs'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}

            {typing && (
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-medium text-mutedText">Haven is reflecting</span>
                </div>
                <div className="rounded-2xl border border-beige-200 bg-white px-4 py-3 shadow-xs">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-haven-600 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-haven-600 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-haven-600 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT AREA */}
          <div className="border-t border-beige-200 bg-background/90 p-4">
            <div className="mx-auto max-w-3xl">
              <form onSubmit={handleSendMessage} className="relative flex items-end rounded-2xl border border-beige-300 bg-white p-2 shadow-xs focus-within:border-haven-600 focus-within:ring-1 focus-within:ring-haven-600 transition">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleTextareaInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Share what's on your mind... (Enter to send, Shift+Enter for new line)"
                  rows={1}
                  className="w-full resize-none border-0 bg-transparent px-2.5 py-1 text-sm text-foreground placeholder:text-mutedText focus:outline-hidden max-h-36"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="shrink-0 rounded-xl bg-haven-700 p-2 text-white shadow-xs hover:bg-haven-800 disabled:opacity-30 transition"
                  aria-label="Send message"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>

              <div className="mt-2 flex items-center justify-between text-[11px] text-mutedText px-1">
                <span>Haven is an AI wellness tool, not clinical therapy.</span>
                <span>Enter sends • Shift+Enter new line</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Modals */}
      {showCrisisModal && (
        <CrisisModal
          isOpen={showCrisisModal}
          onClose={() => setShowCrisisModal(false)}
          riskTier={activeRiskTier}
        />
      )}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => loadSessions()}
        />
      )}
    </div>
  );
}
