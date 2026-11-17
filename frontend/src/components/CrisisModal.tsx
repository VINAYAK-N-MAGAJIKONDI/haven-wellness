'use client';

import React from 'react';
import Link from 'next/link';
import { PhoneCall, AlertTriangle, ShieldCheck, X, HeartHandshake } from 'lucide-react';
import { EmergencyResource } from '@/types';

interface CrisisModalProps {
  isOpen: boolean;
  onClose: () => void;
  riskTier?: 'LOW' | 'MODERATE' | 'HIGH' | 'IMMINENT';
}

const RESOURCES: EmergencyResource[] = [
  {
    name: 'Tele-MANAS (Govt. of India)',
    contact: '14416',
    type: 'helpline',
    available: '24/7 Free Helpline',
    description: 'National Tele Mental Health Programme of India supported by NIMHANS. Multi-lingual counselors available immediately.',
    directActionUrl: 'tel:14416'
  },
  {
    name: 'National Emergency Helpline',
    contact: '112',
    type: 'emergency',
    available: '24/7 Immediate',
    description: 'Police, ambulance, and medical emergency assistance across all states and union territories in India.',
    directActionUrl: 'tel:112'
  },
  {
    name: 'Vandrevala Foundation',
    contact: '+91 9999 666 555',
    type: 'helpline',
    available: '24/7 Free',
    description: 'Experienced psychological first-aid and mental distress crisis intervention.',
    directActionUrl: 'tel:+919999666555'
  },
  {
    name: 'KIRAN National Helpline',
    contact: '1800-599-0019',
    type: 'helpline',
    available: '24/7 Toll-Free',
    description: 'Mental health rehabilitation and support by the Ministry of Social Justice.',
    directActionUrl: 'tel:18005990019'
  }
];

export function CrisisModal({ isOpen, onClose, riskTier }: CrisisModalProps) {
  if (!isOpen) return null;

  const isImminent = riskTier === 'IMMINENT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-red-200 bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 text-mutedText hover:bg-beige-100 hover:text-foreground transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
            {isImminent ? <AlertTriangle className="h-6 w-6 text-red-600 animate-pulse" /> : <PhoneCall className="h-6 w-6 text-red-600" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-charcoal-900">
              {isImminent ? 'Immediate Safety & Human Support' : 'Support Resources are Available'}
            </h3>
            <p className="text-xs text-mutedText">
              {isImminent
                ? 'Your life and safety matter. Please reach out to emergency human support right away.'
                : 'If you are experiencing distress, you do not have to carry it alone.'}
            </p>
          </div>
        </div>

        {/* Disclaimer Alert */}
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 leading-relaxed">
          <strong className="font-semibold">Notice:</strong> Haven is an AI wellness companion and{' '}
          <strong>cannot dispatch emergency services or send physical help</strong>. Please connect with the verified human resources below.
        </div>

        {/* Crisis Resource List */}
        <div className="space-y-3 mb-5 max-h-[45vh] overflow-y-auto pr-1">
          {RESOURCES.map((r) => (
            <div
              key={r.contact}
              className="flex items-center justify-between rounded-xl border border-beige-200 bg-beige-50/50 p-3.5 transition hover:border-beige-300"
            >
              <div className="space-y-1 pr-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{r.name}</span>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-800">
                    {r.available}
                  </span>
                </div>
                <p className="text-[11px] text-mutedText leading-normal">{r.description}</p>
                <div className="text-xs font-mono font-bold text-charcoal-800">{r.contact}</div>
              </div>

              <a
                href={r.directActionUrl}
                className="shrink-0 flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-700 active:scale-95 transition"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Call Now</span>
              </a>
            </div>
          ))}
        </div>

        {/* Bottom Options */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-beige-200 text-xs">
          <Link
            href="/consultants"
            onClick={onClose}
            className="flex items-center gap-1.5 font-medium text-haven-700 hover:text-haven-800 transition"
          >
            <HeartHandshake className="h-4 w-4" />
            <span>Discover Verified Human Therapists</span>
          </Link>

          <button
            onClick={onClose}
            className="rounded-lg border border-beige-300 px-4 py-1.5 text-xs font-medium text-charcoal-700 hover:bg-beige-50 transition"
          >
            Return to Conversation
          </button>
        </div>
      </div>
    </div>
  );
}
