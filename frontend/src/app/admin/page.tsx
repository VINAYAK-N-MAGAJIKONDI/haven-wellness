'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthModal } from '@/components/AuthModal';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import {
  ShieldAlert,
  Users,
  MessageSquare,
  HeartHandshake,
  AlertTriangle,
  Lock,
  FileText,
  Key,
  CheckCircle,
  BarChart2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [escalations, setEscalations] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Bootstrap state
  const [bootstrapEmail, setBootstrapEmail] = useState('');
  const [bootstrapSecret, setBootstrapSecret] = useState('');
  const [bootstrapMsg, setBootstrapMsg] = useState<string | null>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [ovRes, escRes, logsRes] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminEscalations(),
        api.getAdminAuditLogs()
      ]);
      setOverview(ovRes);
      setEscalations(escRes.escalations || []);
      setAuditLogs(logsRes.logs || []);
      setIsAuthorized(true);
    } catch (err: any) {
      console.error('Admin loading failed', err);
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.bootstrapAdmin(bootstrapEmail.trim(), bootstrapSecret.trim());
      setBootstrapMsg(res.message);
      setBootstrapEmail('');
      setBootstrapSecret('');
      loadAdminData();
    } catch (err: any) {
      setBootstrapMsg(err.message || 'Bootstrap failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-haven-100 selection:text-haven-900">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-700 flex items-center gap-1">
              <Lock className="h-3 w-3" />
              <span>Privileged Governance Area</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-charcoal-900">
            Admin Governance & Safety Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-mutedText mt-1 max-w-2xl">
            Aggregate clinical safety metrics, escalation funnel health, and audit logs. In accordance with zero-leak privacy design, private chat transcripts are strictly redacted from this portal.
          </p>
        </div>

        {!isAuthorized && !loading && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-amber-900">Admin Role Required</h3>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    You do not have active administrator permissions. If this is a fresh zero-cost installation, you can initialize the first administrator using your environment secret.
                  </p>
                </div>

                <form onSubmit={handleBootstrap} className="flex flex-wrap gap-2 pt-1">
                  <input
                    type="email"
                    required
                    value={bootstrapEmail}
                    onChange={(e) => setBootstrapEmail(e.target.value)}
                    placeholder="Your registered email"
                    className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs text-foreground focus:outline-hidden"
                  />
                  <input
                    type="password"
                    required
                    value={bootstrapSecret}
                    onChange={(e) => setBootstrapSecret(e.target.value)}
                    placeholder="ADMIN_BOOTSTRAP_SECRET"
                    className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs text-foreground focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-amber-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-900"
                  >
                    Bootstrap Role
                  </button>
                </form>

                {bootstrapMsg && <p className="text-xs font-semibold text-amber-900">{bootstrapMsg}</p>}
              </div>
            </div>
          </div>
        )}

        {isAuthorized && overview && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-beige-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between text-mutedText mb-2">
                  <span className="text-xs font-medium">Registered Users</span>
                  <Users className="h-4 w-4 text-haven-600" />
                </div>
                <div className="text-2xl font-bold text-charcoal-900">{overview.metrics?.total_users || 0}</div>
              </div>

              <div className="rounded-2xl border border-beige-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between text-mutedText mb-2">
                  <span className="text-xs font-medium">Active Sessions</span>
                  <MessageSquare className="h-4 w-4 text-haven-600" />
                </div>
                <div className="text-2xl font-bold text-charcoal-900">{overview.metrics?.total_sessions || 0}</div>
              </div>

              <div className="rounded-2xl border border-beige-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between text-mutedText mb-2">
                  <span className="text-xs font-medium">Messages Processed</span>
                  <BarChart2 className="h-4 w-4 text-haven-600" />
                </div>
                <div className="text-2xl font-bold text-charcoal-900">{overview.metrics?.total_messages || 0}</div>
              </div>

              <div className="rounded-2xl border border-beige-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between text-mutedText mb-2">
                  <span className="text-xs font-medium">Safety Assessments</span>
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-charcoal-900">{overview.metrics?.total_safety_events || 0}</div>
              </div>
            </div>

            {/* Charts: Safety Tier Breakdown & Escalation Funnel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Safety Tiers */}
              <div className="rounded-2xl border border-beige-200 bg-white p-6 shadow-xs">
                <h3 className="text-sm font-semibold text-charcoal-900 mb-1">Safety Risk Tier Breakdown</h3>
                <p className="text-xs text-mutedText mb-4">Volume of incoming interactions classified per tier</p>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overview.safety_by_tier || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E1D7" />
                      <XAxis dataKey="risk_tier" tick={{ fontSize: 10, fill: '#667085' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#667085' }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#4A6B53" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Escalation Funnel */}
              <div className="rounded-2xl border border-beige-200 bg-white p-6 shadow-xs">
                <h3 className="text-sm font-semibold text-charcoal-900 mb-1">Escalation Funnel Events</h3>
                <p className="text-xs text-mutedText mb-4">Outbound referral and booking progression</p>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overview.escalation_funnel || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E1D7" />
                      <XAxis dataKey="event_type" tick={{ fontSize: 9, fill: '#667085' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#667085' }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#5F7A61" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="rounded-2xl border border-beige-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-haven-600" />
                  <h3 className="text-sm font-semibold text-charcoal-900">System Audit Trail</h3>
                </div>
                <span className="text-xs font-mono text-mutedText">{auditLogs.length} events logged</span>
              </div>

              {auditLogs.length === 0 ? (
                <div className="py-6 text-center text-xs text-mutedText">No audit logs recorded.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-beige-200 text-mutedText">
                        <th className="py-2.5 font-medium">Timestamp</th>
                        <th className="py-2.5 font-medium">Actor Role</th>
                        <th className="py-2.5 font-medium">Action</th>
                        <th className="py-2.5 font-medium">Target Resource</th>
                        <th className="py-2.5 font-medium">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-beige-100">
                      {auditLogs.slice(0, 10).map((log) => (
                        <tr key={log.id} className="hover:bg-beige-50/50 transition">
                          <td className="py-2 text-mutedText">{formatDateTime(log.created_at)}</td>
                          <td className="py-2 font-mono font-medium text-charcoal-700">{log.actor_role}</td>
                          <td className="py-2 font-semibold text-haven-800">{log.action}</td>
                          <td className="py-2 font-mono text-mutedText">{log.target_resource}</td>
                          <td className="py-2 text-charcoal-600 truncate max-w-xs">{log.details || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => loadAdminData()}
        />
      )}
    </div>
  );
}
