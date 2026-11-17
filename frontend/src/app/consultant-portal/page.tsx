'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthModal } from '@/components/AuthModal';
import { api } from '@/lib/api';
import { Appointment } from '@/types';
import { formatDateTime } from '@/lib/utils';
import {
  HeartHandshake,
  CheckCircle2,
  Calendar,
  Clock,
  Edit3,
  ShieldCheck,
  Lock
} from 'lucide-react';

export default function ConsultantPortalPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [consultantName, setConsultantName] = useState('Dr. Priya Sharma');
  const [loading, setLoading] = useState(true);
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);
  const [notes, setNotes] = useState('');
  const [newStatus, setNewStatus] = useState<any>('clicked');
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.getConsultantAppointments();
      setAppointments(res.appointments || []);
      if (res.consultant_name) setConsultantName(res.consultant_name);
    } catch (err) {
      console.error('Failed to load appointments', err);
      if (!api.getToken()) {
        setShowAuthModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingApt) return;
    try {
      await api.updateConsultantAppointment(editingApt.id, {
        status: newStatus,
        consultant_notes: notes.trim()
      });
      setEditingApt(null);
      loadAppointments();
    } catch (err) {
      console.error('Failed to update appointment', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-haven-100 selection:text-haven-900">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-haven-700">Practitioner Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-charcoal-900">
            Consultant Portal — {consultantName}
          </h1>
          <p className="text-xs sm:text-sm text-mutedText mt-1 max-w-xl">
            Review outbound referrals and appointment statuses. Conversational chat history remains strictly confidential to the user.
          </p>
        </div>

        {/* Boundary Notice */}
        <div className="mb-8 rounded-2xl border border-beige-200 bg-white p-4 shadow-xs flex items-center gap-3">
          <Lock className="h-5 w-5 text-haven-600 shrink-0" />
          <p className="text-xs text-charcoal-700 leading-relaxed">
            <strong className="text-charcoal-900">Privacy Protection:</strong> Haven enforces strict client-therapist boundaries. Users&apos; private chats with the AI companion are never automatically transferred or viewable in this portal.
          </p>
        </div>

        {/* Appointments List */}
        <section className="rounded-2xl border border-beige-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-charcoal-900">Assigned Referrals & Bookings</h3>
            <span className="text-xs font-mono text-mutedText">{appointments.length} Total</span>
          </div>

          {appointments.length === 0 ? (
            <div className="py-12 text-center text-xs text-mutedText">
              No appointments recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-beige-200 text-mutedText">
                    <th className="py-3 font-medium">Timestamp</th>
                    <th className="py-3 font-medium">Escalation Ref</th>
                    <th className="py-3 font-medium">Status</th>
                    <th className="py-3 font-medium">Notes</th>
                    <th className="py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige-100">
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-beige-50/50 transition">
                      <td className="py-3 text-mutedText">{formatDateTime(apt.created_at)}</td>
                      <td className="py-3 font-mono font-semibold text-charcoal-800">{apt.escalation_ref}</td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                            apt.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : apt.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </td>
                      <td className="py-3 text-charcoal-600 max-w-xs truncate">
                        {apt.consultant_notes || 'No notes added'}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => {
                            setEditingApt(apt);
                            setNewStatus(apt.status);
                            setNotes(apt.consultant_notes || '');
                          }}
                          className="text-haven-700 hover:text-haven-900 font-medium transition"
                        >
                          Update
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

      {editingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-beige-200 bg-white p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-semibold text-charcoal-900">
              Update Appointment {editingApt.escalation_ref}
            </h4>
            <div>
              <label className="block text-xs font-medium text-charcoal-700 mb-1">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full rounded-xl border border-beige-300 bg-beige-50/40 px-3 py-2 text-xs text-foreground focus:outline-hidden"
              >
                <option value="prompt_shown">Prompt Shown</option>
                <option value="clicked">Clicked / Outbound</option>
                <option value="started">Booking Started</option>
                <option value="completed">Confirmed Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal-700 mb-1">Consultation Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Optional notes regarding consultation status..."
                className="w-full rounded-xl border border-beige-300 bg-beige-50/40 p-2.5 text-xs text-foreground focus:outline-hidden"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingApt(null)}
                className="rounded-lg border border-beige-300 px-3 py-1.5 text-xs font-medium text-charcoal-700 hover:bg-beige-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdate}
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
          onSuccess={() => loadAppointments()}
        />
      )}
    </div>
  );
}
