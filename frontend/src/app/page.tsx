'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CrisisModal } from '@/components/CrisisModal';
import { AuthModal } from '@/components/AuthModal';
import {
  Sparkles,
  HeartHandshake,
  Brain,
  Shield,
  MessageSquare,
  Lock,
  ArrowRight,
  PhoneCall,
  CheckCircle2,
  TrendingUp,
  Database
} from 'lucide-react';

export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-haven-100 selection:text-haven-900">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-haven-200 bg-haven-50/80 px-3.5 py-1 text-xs font-medium text-haven-800 shadow-xs mb-6">
              <Sparkles className="h-3.5 w-3.5 text-haven-600" />
              <span>An empathetic companion built for quiet reflection</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-charcoal-900 leading-[1.15]">
              A space to talk.{' '}
              <span className="text-haven-700 block sm:inline">A little more understanding, every day.</span>
            </h1>

            {/* Subheading */}
            <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-charcoal-500 leading-relaxed font-normal">
              An empathetic AI companion that helps you express your thoughts, understand your emotions, and find the right human support when you need it.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-haven-700 px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-haven-800 transition active:scale-98"
              >
                <span>Start a conversation</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <a
                href="#how-it-works"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-beige-300 bg-white px-6 py-3.5 text-sm font-medium text-charcoal-800 shadow-xs hover:bg-beige-50 transition"
              >
                <span>How it works</span>
              </a>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-mutedText">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-haven-600" />
                <span>Zero clinical jargon</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-haven-600" />
                <span>Your private space</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-haven-600" />
                <span>Verified emergency escalation</span>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="py-20 bg-beige-50/50 border-y border-beige-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-haven-700 mb-2">Capabilities</h2>
              <h3 className="text-3xl font-bold tracking-tight text-charcoal-900">
                Thoughtful technology designed around human dignity
              </h3>
              <p className="mt-3 text-sm text-mutedText">
                Haven is deliberately crafted to step away from hollow motivational cliches and provide calm, grounded companionship.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="rounded-2xl border border-beige-200 bg-white p-7 shadow-xs hover:shadow-md transition">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-haven-100 text-haven-700 mb-4">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h4 className="text-base font-semibold text-charcoal-900 mb-2">Empathetic AI Conversations</h4>
                <p className="text-xs text-charcoal-500 leading-relaxed">
                  Powered by Google Gemini with strict non-judgmental principles. Haven listens deeply, avoids unsolicited advice, and asks gentle reflective questions.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-2xl border border-beige-200 bg-white p-7 shadow-xs hover:shadow-md transition">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-haven-100 text-haven-700 mb-4">
                  <Database className="h-5 w-5" />
                </div>
                <h4 className="text-base font-semibold text-charcoal-900 mb-2">Cross-Session Memory</h4>
                <p className="text-xs text-charcoal-500 leading-relaxed">
                  Remembers your goals and recurring reflections across conversations so you don&apos;t need to repeat context. You can view, edit, or delete every memory item.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-2xl border border-beige-200 bg-white p-7 shadow-xs hover:shadow-md transition">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-haven-100 text-haven-700 mb-4">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h4 className="text-base font-semibold text-charcoal-900 mb-2">Emotional Insights Dashboard</h4>
                <p className="text-xs text-charcoal-500 leading-relaxed">
                  Track emotional distribution and trends over time. Compare your self-reported mood check-ins against AI-inferred observations with full correction rights.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="rounded-2xl border border-beige-200 bg-white p-7 shadow-xs hover:shadow-md transition">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-haven-100 text-haven-700 mb-4">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <h4 className="text-base font-semibold text-charcoal-900 mb-2">Verified Human Support</h4>
                <p className="text-xs text-charcoal-500 leading-relaxed">
                  Browse a directory of certified, licensed clinical psychologists and crisis helplines. Haven recognizes when human intervention is needed.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="rounded-2xl border border-beige-200 bg-white p-7 shadow-xs hover:shadow-md transition">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-haven-100 text-haven-700 mb-4">
                  <Shield className="h-5 w-5" />
                </div>
                <h4 className="text-base font-semibold text-charcoal-900 mb-2">Independent Safety Engine</h4>
                <p className="text-xs text-charcoal-500 leading-relaxed">
                  A deterministic multi-tiered safety pipeline monitors for crisis signals independently of the conversation model, immediately presenting live verified helplines.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="rounded-2xl border border-beige-200 bg-white p-7 shadow-xs hover:shadow-md transition">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-haven-100 text-haven-700 mb-4">
                  <Lock className="h-5 w-5" />
                </div>
                <h4 className="text-base font-semibold text-charcoal-900 mb-2">Privacy & User Ownership</h4>
                <p className="text-xs text-charcoal-500 leading-relaxed">
                  Full control over your data. Download a complete archive of your chats and memories with one click, or permanently delete your account at any moment.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-16">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-haven-700 mb-2">The Experience</h2>
              <h3 className="text-3xl font-bold tracking-tight text-charcoal-900">How Haven Works</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-haven-600 text-white text-sm font-bold">
                  1
                </div>
                <h4 className="text-base font-semibold text-charcoal-900">Express in your own words</h4>
                <p className="text-xs text-mutedText leading-relaxed">
                  Speak freely about whatever you are feeling, whether it is work stress, relationship questions, or general loneliness.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-haven-600 text-white text-sm font-bold">
                  2
                </div>
                <h4 className="text-base font-semibold text-charcoal-900">Reflect with an empathetic ear</h4>
                <p className="text-xs text-mutedText leading-relaxed">
                  Haven reflects your thoughts back to you, isolates what feels uncontrollable, and helps you explore practical grounding steps.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-haven-600 text-white text-sm font-bold">
                  3
                </div>
                <h4 className="text-base font-semibold text-charcoal-900">Connect with care when needed</h4>
                <p className="text-xs text-mutedText leading-relaxed">
                  If you encounter overwhelming distress, Haven immediately links you with Tele-MANAS, national emergency lines, and verified therapists.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CRISIS & HUMAN SUPPORT SECTION */}
        <section className="py-16 bg-red-50/50 border-t border-red-100">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
              <PhoneCall className="h-3.5 w-3.5" />
              <span>Available 24/7 Across India</span>
            </div>
            <h3 className="text-2xl font-bold text-charcoal-900">Immediate Crisis Intervention</h3>
            <p className="text-xs text-charcoal-600 max-w-xl mx-auto leading-relaxed">
              If you or someone you know is in immediate physical danger, suicidal crisis, or severe distress, please connect directly with trained human responders right now.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-4">
              <a
                href="tel:14416"
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-xs font-semibold text-white shadow-xs hover:bg-red-700 transition"
              >
                <PhoneCall className="h-4 w-4" />
                <span>Call Tele-MANAS (14416)</span>
              </a>
              <a
                href="tel:112"
                className="flex items-center gap-2 rounded-xl border border-red-300 bg-white px-5 py-3 text-xs font-semibold text-red-700 hover:bg-red-50 transition"
              >
                <PhoneCall className="h-4 w-4" />
                <span>Call Emergency (112)</span>
              </a>
            </div>
          </div>
        </section>

        {/* ZERO COST & TRANSPARENCY SECTION */}
        <section className="py-16 bg-beige-100/50 border-t border-beige-200">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-beige-300 bg-white p-8 text-center space-y-3">
              <h3 className="text-lg font-bold text-charcoal-900">Architecture & Zero-Cost Transparency</h3>
              <p className="text-xs text-mutedText max-w-2xl mx-auto leading-relaxed">
                Haven is engineered with a strict ₹0 infrastructure budget using Cloudflare Workers, Cloudflare D1 (SQLite), and Google Gemini free tier. No commercial ads, no paid tracking, and no monetization of private mental health disclosures.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Modals */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            window.location.href = '/chat';
          }}
        />
      )}
      {showCrisisModal && (
        <CrisisModal isOpen={showCrisisModal} onClose={() => setShowCrisisModal(false)} />
      )}
    </div>
  );
}
