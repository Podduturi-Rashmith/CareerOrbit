'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Building2, CheckCircle2, Chrome, ShieldCheck, UserPlus } from 'lucide-react';
import { MOCK_PLACEMENTS } from '@/lib/mock-data';

export default function LandingPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationLink, setVerificationLink] = useState('');

  const highlights = useMemo(
    () => [
      { label: 'Students Supported', value: '1,200+' },
      { label: 'Partner Recruiters', value: '180' },
      { label: 'Interview-to-Offer', value: '41%' },
    ],
    []
  );

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setVerificationLink('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Failed to create account.' }));
        throw new Error(body.error || 'Failed to create account.');
      }

      const body = await response.json();
      setSuccess('Account created. Please verify your email before signing in.');
      if (body.verificationLink) {
        setVerificationLink(body.verificationLink);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="border-b border-slate-200/70 bg-slate-50/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
              C
            </div>
            <span className="text-2xl font-display font-bold text-slate-900 tracking-tight">CareerOrbit</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors">
              Sign In
            </Link>
            <a href="#register" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 transition-colors">
              Create Account
            </a>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-[0.12] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-7"
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-teal-100 text-teal-800 mb-6">
                Career Planning Platform
              </span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-black tracking-tight text-slate-900 leading-[0.95]">
                Build Your Job
                <span className="block text-teal-700">Momentum Daily.</span>
              </h1>
              <p className="mt-6 text-lg text-slate-600 max-w-2xl leading-relaxed">
                One dashboard for applications, screening calls, interviews, assessments, and outcomes. Built for students who want clarity and
                consistency.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a href="#register" className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-black transition-colors">
                  Start Free <ArrowRight className="w-4 h-4" />
                </a>
                <Link href="/login" className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl border border-slate-300 bg-white/80 text-slate-800 font-bold hover:bg-white transition-colors">
                  Existing User Login
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {highlights.map((item) => (
                  <div key={item.label} className="panel-surface rounded-2xl p-4">
                    <p className="text-2xl font-black text-slate-900">{item.value}</p>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              id="register"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="lg:col-span-5 panel-surface rounded-3xl p-6 md:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-teal-700 text-white flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">Create Student Account</p>
                  <p className="text-sm text-slate-500">Instant access to your dashboard</p>
                </div>
              </div>

              <a
                href="/api/auth/google"
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Chrome className="w-4 h-4 text-slate-600" />
                Continue with Google
              </a>
              <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
                <span className="flex-1 h-px bg-slate-200" />
                or create with email
                <span className="flex-1 h-px bg-slate-200" />
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
                {success && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600" />
                    <span>{success}</span>
                  </div>
                )}
                {verificationLink && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 break-all">
                    Dev verification link: {verificationLink}
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:ring-2 focus:ring-teal-600/30"
                    placeholder="Alex Johnson"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:ring-2 focus:ring-teal-600/30"
                    placeholder="you@college.edu"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Password</label>
                  <input
                    type="password"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:ring-2 focus:ring-teal-600/30"
                    placeholder="At least 8 characters"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 rounded-xl bg-teal-700 text-white py-3 font-bold hover:bg-teal-800 transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                Secure session with encrypted cookie authentication.
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="panel-surface rounded-3xl p-6">
              <p className="text-sm uppercase tracking-wider text-slate-500 font-bold">Track</p>
              <h3 className="mt-2 text-2xl font-display font-bold text-slate-900">Know Every Stage</h3>
              <p className="mt-2 text-slate-600 text-sm">Applied, screening, interview, assessment, and offer in one timeline.</p>
            </div>
            <div className="panel-surface rounded-3xl p-6">
              <p className="text-sm uppercase tracking-wider text-slate-500 font-bold">Prepare</p>
              <h3 className="mt-2 text-2xl font-display font-bold text-slate-900">Calendar + Alerts</h3>
              <p className="mt-2 text-slate-600 text-sm">Never miss calls, coding rounds, deadlines, or follow-up tasks.</p>
            </div>
            <div className="panel-surface rounded-3xl p-6">
              <p className="text-sm uppercase tracking-wider text-slate-500 font-bold">Perform</p>
              <h3 className="mt-2 text-2xl font-display font-bold text-slate-900">Outcome Focused</h3>
              <p className="mt-2 text-slate-600 text-sm">Understand conversion rates and improve your process week by week.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold">Student Success Stories</h2>
              <p className="text-slate-300 mt-2">Real journeys from applications to offers.</p>
            </div>
            <div className="flex items-center gap-2 text-slate-200 text-sm">
              <Building2 className="w-4 h-4" />
              Trusted by top hiring teams
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MOCK_PLACEMENTS.map((placement) => (
              <div key={placement.id} className="rounded-3xl border border-slate-700 bg-slate-800/60 p-6">
                <p className="text-slate-200 italic leading-relaxed">&quot;{placement.testimonial}&quot;</p>
                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <p className="font-bold">{placement.studentName}</p>
                    <p className="text-sm text-slate-400">{placement.role}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-400/15 text-emerald-300 px-3 py-1 text-xs font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    {placement.companyName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
