'use client';

import React, { Suspense, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AuthProvider } from '@/hooks/use-auth';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Briefcase, CheckCircle2, Chrome, Lock, User } from 'lucide-react';
import { motion } from 'motion/react';

function LoginPageContent() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const { login } = useAuth();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const verified = searchParams.get('verified');
    const oauth = searchParams.get('oauth');
    if (verified === '1') {
      setNotice('Email verified. You can sign in now.');
    } else if (verified === '0') {
      setNotice('Verification link expired or invalid. Please request a new link.');
    }
    if (oauth === 'failed') {
      setError('Google sign-in failed. Please try again.');
    } else if (oauth === 'blocked') {
      setError('This email is linked to an admin. Please sign in with admin credentials.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(identifier, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email/admin ID or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendVerification = async () => {
    if (!identifier) return;
    setResendStatus('sending');
    await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier }),
    });
    setResendStatus('sent');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl text-white mb-4 shadow-lg shadow-indigo-200">
            <Briefcase className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">CareerOrbit</h1>
          <p className="text-slate-500 mt-2">Your career journey starts here</p>
        </div>

        <div className="space-y-4">
          <a
            href="/api/auth/google"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            <Chrome className="w-4 h-4 text-slate-600" />
            Continue with Google
          </a>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex-1 h-px bg-slate-200" />
            or sign in with email
            <span className="flex-1 h-px bg-slate-200" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {notice && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-100 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600" />
              <span>{notice}</span>
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}
          {error.includes('Email not verified') && (
            <button
              type="button"
              onClick={resendVerification}
              disabled={resendStatus === 'sending'}
              className="w-full py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70"
            >
              {resendStatus === 'sent' ? 'Verification email sent' : resendStatus === 'sending' ? 'Sending...' : 'Resend verification email'}
            </button>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email or Admin ID</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="Enter email or admin ID"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all transform active:scale-[0.98] disabled:opacity-70"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Don&apos;t have an account? Create one from the home page.
          </p>
          <Link href="/" className="inline-block mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
            Go to Sign Up
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <Suspense>
        <LoginPageContent />
      </Suspense>
    </AuthProvider>
  );
}
