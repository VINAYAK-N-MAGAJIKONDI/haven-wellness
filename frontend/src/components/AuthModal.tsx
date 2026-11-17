'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { X, Sparkles, Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react';
import { OnboardingModal } from './OnboardingModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<any>(null);

  if (!isOpen && !showOnboarding) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!preferredName.trim()) {
          setError('Please provide a preferred name or nickname.');
          setLoading(false);
          return;
        }
        const res = await api.register({
          email,
          password,
          preferred_name: preferredName
        });
        setRegisteredUser(res.user);
        setShowOnboarding(true);
      } else {
        await api.login({ email, password });
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    onSuccess();
    onClose();
  };

  if (showOnboarding) {
    return <OnboardingModal isOpen={showOnboarding} onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-beige-200 bg-white p-7 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 text-mutedText hover:bg-beige-100 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-haven-100 text-haven-700">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-base font-semibold text-foreground">Haven</span>
        </div>

        <h3 className="text-xl font-bold tracking-tight text-charcoal-900 mb-1">
          {isRegister ? 'Begin Your Wellness Journey' : 'Welcome Back'}
        </h3>
        <p className="text-xs text-mutedText mb-5 leading-relaxed">
          {isRegister
            ? 'Create a secure space for reflection, emotional insights, and empathetic conversations.'
            : 'Sign in to access your personal conversations, emotional trends, and memories.'}
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-charcoal-700 mb-1">Preferred Name / Nickname</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-mutedText" />
                <input
                  type="text"
                  required
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  placeholder="e.g. Maya"
                  className="w-full rounded-xl border border-beige-300 bg-beige-50/40 pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-mutedText focus:border-haven-600 focus:bg-white focus:outline-hidden transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-charcoal-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-mutedText" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-beige-300 bg-beige-50/40 pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-mutedText focus:border-haven-600 focus:bg-white focus:outline-hidden transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-charcoal-700 mb-1">Password (min 8 characters)</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-mutedText" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-beige-300 bg-beige-50/40 pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-mutedText focus:border-haven-600 focus:bg-white focus:outline-hidden transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-haven-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-haven-800 disabled:opacity-50 transition"
          >
            {loading ? 'Please wait...' : isRegister ? 'Create Secure Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-mutedText">
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
                className="font-semibold text-haven-700 hover:underline"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              New to Haven?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
                className="font-semibold text-haven-700 hover:underline"
              >
                Create Account
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
