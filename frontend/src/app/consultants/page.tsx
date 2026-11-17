'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CrisisModal } from '@/components/CrisisModal';
import { AuthModal } from '@/components/AuthModal';
import { api } from '@/lib/api';
import { Consultant } from '@/types';
import {
  HeartHandshake,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  PhoneCall,
  Search,
  Globe2,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function ConsultantsPage() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('All');
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [bookingNotice, setBookingNotice] = useState<string | null>(null);

  useEffect(() => {
    loadConsultants();
  }, []);

  const loadConsultants = async () => {
    setLoading(true);
    try {
      const res = await api.getConsultants();
      setConsultants(res.consultants || []);
    } catch (err) {
      console.error('Failed to load consultants', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookConsultant = async (consultant: Consultant) => {
    if (!api.getToken()) {
      setShowAuthModal(true);
      return;
    }

    try {
      // 1. Record the booking event and get escalation ref
      const res = await api.createAppointment(consultant.id);

      setBookingNotice(`Opening appointment portal with ${consultant.name}. Ref: ${res.escalation_ref}`);

      // 2. Open external booking URL in new tab
      if (consultant.booking_url.startsWith('tel:')) {
        window.location.href = consultant.booking_url;
      } else {
        window.open(consultant.booking_url, '_blank', 'noopener,noreferrer');
      }

      // Log outbound redirect
      if (res.escalation_ref) {
        await api.logEscalationEvent(res.escalation_ref, {
          event_type: 'booking_page_opened',
          metadata: { consultant_id: consultant.id }
        });
      }
    } catch (err) {
      console.error('Booking initiation failed', err);
    }
  };

  const filteredConsultants = consultants.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.short_bio.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArea =
      selectedArea === 'All' ||
      c.areas_of_practice.some((area) => area.toLowerCase().includes(selectedArea.toLowerCase()));

    return matchesSearch && matchesArea;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-haven-100 selection:text-haven-900">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="max-w-3xl mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-haven-700">Verified Professional Network</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-charcoal-900">
            Consultant Discovery & Human Care
          </h1>
          <p className="text-xs sm:text-sm text-mutedText mt-2 leading-relaxed">
            While Haven provides an empathetic AI space for daily reflection, human therapy and medical consultations are irreplaceable. Every provider in this directory is manually verified.
          </p>
        </div>

        {bookingNotice && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-haven-300 bg-haven-50 p-3.5 text-xs text-haven-900">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-haven-700" />
              <span>{bookingNotice}</span>
            </div>
            <button
              onClick={() => setBookingNotice(null)}
              className="text-[11px] font-semibold text-haven-800 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="mb-8 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-mutedText" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, title, or specialty..."
              className="w-full rounded-xl border border-beige-300 bg-white pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-mutedText focus:outline-hidden focus:border-haven-600 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {['All', 'Crisis', 'Anxiety', 'Psychology', 'Counseling'].map((area) => (
              <button
                key={area}
                onClick={() => setSelectedArea(area)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition shrink-0 ${
                  selectedArea === area
                    ? 'bg-haven-700 text-white shadow-xs'
                    : 'border border-beige-300 bg-white text-charcoal-700 hover:bg-beige-50'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Consultants Grid */}
        {loading ? (
          <div className="py-16 text-center text-xs text-mutedText">Loading verified consultants...</div>
        ) : filteredConsultants.length === 0 ? (
          <div className="rounded-2xl border border-beige-200 bg-white p-12 text-center text-xs text-mutedText">
            No matching consultants found for your search criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConsultants.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-beige-200 bg-white p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Verified Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      <span>Verified Credentials</span>
                    </span>
                    <span className="text-[10px] text-mutedText">{c.availability_info}</span>
                  </div>

                  <h3 className="text-base font-bold text-charcoal-900">{c.name}</h3>
                  <p className="text-xs font-medium text-haven-700 mb-2">{c.designation}</p>
                  <p className="text-xs text-mutedText leading-relaxed mb-4">{c.short_bio}</p>

                  {/* Areas of practice */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {c.areas_of_practice.map((a, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-beige-100 px-2 py-0.5 text-[10px] font-medium text-charcoal-700"
                      >
                        {a}
                      </span>
                    ))}
                  </div>

                  {/* Languages */}
                  <div className="flex items-center gap-1.5 text-[11px] text-mutedText">
                    <Globe2 className="h-3.5 w-3.5 text-haven-600" />
                    <span>{c.languages.join(', ')}</span>
                  </div>
                </div>

                {/* Booking Button */}
                <div className="mt-6 pt-4 border-t border-beige-100">
                  <button
                    onClick={() => handleBookConsultant(c)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-haven-700 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-haven-800 transition active:scale-98"
                  >
                    {c.booking_url.startsWith('tel:') ? (
                      <>
                        <PhoneCall className="h-3.5 w-3.5" />
                        <span>Call Service Now</span>
                      </>
                    ) : (
                      <>
                        <span>Book Verified Consultation</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Clinical Disclaimer Notice */}
        <div className="mt-12 rounded-2xl border border-beige-200 bg-beige-50/70 p-5 text-xs text-mutedText leading-relaxed">
          <strong className="text-charcoal-800">Verification Integrity:</strong> Haven does not employ consultants directly or take commissions on appointments. Only licensed mental health institutions and RCI-registered practitioners are approved following document verification.
        </div>
      </main>

      <Footer />

      {showCrisisModal && (
        <CrisisModal isOpen={showCrisisModal} onClose={() => setShowCrisisModal(false)} />
      )}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => loadConsultants()}
        />
      )}
    </div>
  );
}
