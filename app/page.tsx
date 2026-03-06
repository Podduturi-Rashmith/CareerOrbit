'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { 
  Briefcase, 
  Users, 
  Globe, 
  ArrowRight, 
  CheckCircle, 
  Building2,
  Quote
} from 'lucide-react';
import { MOCK_PLACEMENTS } from '@/lib/mock-data';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              C
            </div>
            <span className="text-2xl font-display font-bold tracking-tight text-slate-900">CareerOrbit</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
              Sign In
            </Link>
            <Link 
              href="/login" 
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider mb-6 inline-block">
              Empowering Students Worldwide
            </span>
            <h1 className="text-5xl md:text-7xl font-display font-bold text-slate-900 tracking-tight mb-8">
              Your Career Journey, <br />
              <span className="text-indigo-600">Simplified.</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              We apply to top-tier companies on your behalf and provide a seamless portal to track every step of your application process.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/login" 
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2"
              >
                Access Portal <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all">
                Learn More
              </button>
            </div>
          </motion.div>
        </div>
        
        {/* Background Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Placements Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-display font-bold text-slate-900 mb-4">Student Success Stories</h2>
              <p className="text-slate-500 leading-relaxed">
                Join hundreds of students who have successfully transitioned into their dream careers through our platform.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-indigo-600">500+</p>
                <p className="text-xs font-bold text-slate-400 uppercase">Placements</p>
              </div>
              <div className="w-px h-10 bg-slate-200"></div>
              <div className="text-center">
                <p className="text-3xl font-bold text-indigo-600">95%</p>
                <p className="text-xs font-bold text-slate-400 uppercase">Success Rate</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {MOCK_PLACEMENTS.map((placement) => (
              <div key={placement.id} className="bg-slate-900 rounded-3xl p-10 text-white relative overflow-hidden group">
                <Quote className="absolute top-6 right-6 w-12 h-12 text-white/10 group-hover:text-indigo-500/20 transition-colors" />
                <div className="relative z-10">
                  <p className="text-xl italic mb-8 text-slate-300 leading-relaxed">
                    &quot;{placement.testimonial}&quot;
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                      {placement.studentName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{placement.studentName}</h4>
                      <p className="text-sm text-slate-400">
                        {placement.role} at <span className="text-indigo-400 font-semibold">{placement.companyName}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-display font-bold text-white mb-8">Ready to start your career?</h2>
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 px-10 py-5 bg-white text-indigo-600 rounded-2xl font-bold text-xl hover:bg-indigo-50 transition-all shadow-2xl shadow-indigo-900/20"
          >
            Sign In to Portal <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center text-white font-bold text-xs">
              C
            </div>
            <span className="font-display font-bold text-slate-900">CareerOrbit</span>
          </div>
          <p className="text-slate-400 text-sm">
            © 2024 CareerOrbit Portal. All rights reserved.
          </p>
          <div className="flex gap-6 text-slate-400 text-sm font-medium">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
