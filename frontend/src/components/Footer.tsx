'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Heart, Sparkles, PhoneCall } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-beige-200 bg-beige-50/60 pt-12 pb-8 text-sm text-charcoal-500">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-beige-200">
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-haven-100 text-haven-700">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-semibold text-foreground tracking-tight">Haven</span>
            </div>
            <p className="text-xs text-mutedText leading-relaxed">
              An empathetic AI companion that helps you reflect on thoughts, understand your emotions, and connect with verified human care.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-haven-700 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-haven-600" />
              <span>Zero-cost, privacy-first architecture</span>
            </div>
          </div>

          {/* Crisis Contacts */}
          <div className="space-y-2 md:col-span-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal-800 flex items-center gap-1.5">
              <PhoneCall className="h-3.5 w-3.5 text-red-600" />
              Emergency & Crisis
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex flex-col">
                <span className="font-medium text-foreground">National Emergency</span>
                <a href="tel:112" className="text-red-700 font-semibold hover:underline">112 (Police & Medical)</a>
              </li>
              <li className="flex flex-col">
                <span className="font-medium text-foreground">Tele-MANAS (Govt of India)</span>
                <a href="tel:14416" className="text-haven-700 font-semibold hover:underline">14416 (24/7 Free Helpline)</a>
              </li>
              <li className="flex flex-col">
                <span className="font-medium text-foreground">Vandrevala Foundation</span>
                <a href="tel:+919999666555" className="text-haven-700 font-semibold hover:underline">+91 9999 666 555</a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-2 md:col-span-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal-800">Explore</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/chat" className="hover:text-foreground transition">AI Companion Chat</Link></li>
              <li><Link href="/dashboard" className="hover:text-foreground transition">Emotional Insights</Link></li>
              <li><Link href="/memory" className="hover:text-foreground transition">Cross-Session Memory</Link></li>
              <li><Link href="/consultants" className="hover:text-foreground transition">Verified Consultants</Link></li>
              <li><Link href="/settings" className="hover:text-foreground transition">Privacy & Data Controls</Link></li>
            </ul>
          </div>

          {/* Clinical Boundary Notice */}
          <div className="space-y-2 md:col-span-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal-800">Essential Boundary</h4>
            <div className="rounded-xl border border-beige-200 bg-white p-3 text-[11px] leading-relaxed text-mutedText shadow-xs">
              <p>
                <strong className="text-charcoal-800">Haven is a wellness support companion, not a licensed medical or therapy clinic.</strong> It does not diagnose mental health conditions, prescribe medication, or replace professional psychiatric intervention.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-mutedText">
          <p>© {new Date().getFullYear()} Haven Mental Wellness. Built with Google Gemini API & Cloudflare.</p>
          <div className="flex items-center gap-4">
            <Link href="/settings" className="hover:underline">Privacy Terms</Link>
            <Link href="/consultants" className="hover:underline">Consultant Verification</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
