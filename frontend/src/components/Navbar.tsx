'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { User } from '@/types';
import { HeartHandshake, Shield, Sparkles, MessageCircle, BarChart3, Database, UserCheck, LogOut, Menu, X, PhoneCall } from 'lucide-react';
import { CrisisModal } from './CrisisModal';
import { AuthModal } from './AuthModal';

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      if (api.getToken()) {
        const res = await api.getMe();
        if (res.user) setUser(res.user);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    window.location.href = '/';
  };

  const navLinks = [
    { label: 'Chat', href: '/chat', icon: MessageCircle, authRequired: true },
    { label: 'Insights', href: '/dashboard', icon: BarChart3, authRequired: true },
    { label: 'Memory', href: '/memory', icon: Database, authRequired: true },
    { label: 'Consultants', href: '/consultants', icon: HeartHandshake, authRequired: false },
  ];

  if (user?.roles?.includes('admin')) {
    navLinks.push({ label: 'Admin', href: '/admin', icon: Shield, authRequired: true });
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-beige-200/80 bg-background/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-haven-100 text-haven-700 transition group-hover:bg-haven-200">
              <Sparkles className="h-5 w-5 text-haven-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight text-foreground">Haven</span>
              <span className="text-[10px] font-medium tracking-wider text-mutedText uppercase">Mental Wellness</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              if (link.authRequired && !user && !loading) return null;
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-beige-100 text-haven-800'
                      : 'text-charcoal-500 hover:bg-beige-50 hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setShowCrisisModal(true)}
              className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50/60 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100/80 transition"
              title="Immediate crisis support"
            >
              <PhoneCall className="h-3.5 w-3.5 text-red-600" />
              <span>Crisis Support</span>
            </button>

            {loading ? (
              <div className="h-8 w-20 animate-pulse rounded-lg bg-beige-200" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/settings"
                  className="flex items-center gap-1.5 rounded-lg border border-beige-200 bg-white px-3 py-1.5 text-xs font-medium text-charcoal-800 hover:bg-beige-50 transition shadow-sm"
                >
                  <UserCheck className="h-3.5 w-3.5 text-haven-600" />
                  <span>{user.preferred_name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-lg p-1.5 text-mutedText hover:bg-beige-100 hover:text-foreground transition"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="rounded-lg bg-haven-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-haven-800 transition"
              >
                Sign In / Join
              </button>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setShowCrisisModal(true)}
              className="rounded-full bg-red-50 p-2 text-red-600"
              title="Immediate Crisis Helpline"
            >
              <PhoneCall className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-charcoal-800 hover:bg-beige-100"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="border-b border-beige-200 bg-background px-4 py-3 md:hidden">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                if (link.authRequired && !user) return null;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-charcoal-800 hover:bg-beige-100"
                  >
                    <Icon className="h-4 w-4 text-haven-600" />
                    {link.label}
                  </Link>
                );
              })}
              {user ? (
                <div className="mt-2 pt-2 border-t border-beige-200 flex items-center justify-between">
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-medium text-haven-800"
                  >
                    Settings ({user.preferred_name})
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="text-xs text-red-600 font-medium"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowAuthModal(true);
                  }}
                  className="mt-2 w-full rounded-lg bg-haven-700 py-2 text-xs font-semibold text-white"
                >
                  Sign In / Join
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Modals */}
      {showCrisisModal && (
        <CrisisModal isOpen={showCrisisModal} onClose={() => setShowCrisisModal(false)} />
      )}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => checkCurrentUser()}
        />
      )}
    </>
  );
}
