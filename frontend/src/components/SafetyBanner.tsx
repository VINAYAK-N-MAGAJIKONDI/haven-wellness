'use client';

import React from 'react';
import { AlertTriangle, PhoneCall, HeartHandshake } from 'lucide-react';
import Link from 'next/link';

interface SafetyBannerProps {
  riskTier: 'LOW' | 'MODERATE' | 'HIGH' | 'IMMINENT';
  onOpenCrisisModal: () => void;
}

export function SafetyBanner({ riskTier, onOpenCrisisModal }: SafetyBannerProps) {
  if (riskTier === 'LOW') return null;

  const isImminent = riskTier === 'IMMINENT';
  const isHigh = riskTier === 'HIGH';

  return (
    <div
      className={`w-full px-4 py-2.5 transition-all flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs ${
        isImminent
          ? 'bg-red-600 text-white font-medium'
          : isHigh
          ? 'bg-red-50 border-b border-red-200 text-red-900'
          : 'bg-amber-50 border-b border-amber-200 text-amber-900'
      }`}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className={`h-4 w-4 shrink-0 ${isImminent ? 'text-white animate-bounce' : 'text-red-600'}`} />
        <span>
          {isImminent
            ? 'Immediate safety priority: If you are in crisis, please connect with live emergency assistance right now.'
            : isHigh
            ? 'We hear your deep distress. You do not have to go through this alone; human crisis counselors are standing by.'
            : 'You seem to be carrying a lot today. Free human counseling and professional consultants are available.'}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenCrisisModal}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold shadow-xs transition ${
            isImminent
              ? 'bg-white text-red-700 hover:bg-red-50'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          <PhoneCall className="h-3.5 w-3.5" />
          <span>Call 14416 (Tele-MANAS)</span>
        </button>

        <Link
          href="/consultants"
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
            isImminent
              ? 'bg-red-700 text-white hover:bg-red-800'
              : 'border border-beige-300 bg-white text-charcoal-700 hover:bg-beige-50'
          }`}
        >
          <HeartHandshake className="h-3.5 w-3.5 text-haven-700" />
          <span>Find Consultants</span>
        </Link>
      </div>
    </div>
  );
}
