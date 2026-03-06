'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { MOCK_APPLICATIONS } from '@/lib/mock-data';
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  Clock, 
  Download, 
  ExternalLink, 
  FileText, 
  Link as LinkIcon, 
  MessageSquare,
  Video
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    'Applied': 'bg-blue-50 text-blue-700 border-blue-100',
    'Screening Call': 'bg-purple-50 text-purple-700 border-purple-100',
    'Interview': 'bg-amber-50 text-amber-700 border-amber-100',
    'Assessment': 'bg-indigo-50 text-indigo-700 border-indigo-100',
    'Rejected': 'bg-red-50 text-red-700 border-red-100',
    'Offer': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${colors[status] || 'bg-slate-50 text-slate-700 border-slate-100'}`}>
      {status}
    </span>
  );
};

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const app = MOCK_APPLICATIONS.find(a => a.id === id);

  if (!app) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-slate-900">Application not found</h2>
          <button 
            onClick={() => router.back()}
            className="mt-4 text-indigo-600 font-medium hover:underline"
          >
            Go back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 font-bold text-2xl uppercase">
                  {app.companyName.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-display font-bold text-slate-900">{app.jobRole}</h1>
                  <div className="flex items-center gap-2 text-slate-500 mt-1">
                    <Building2 className="w-4 h-4" />
                    <span>{app.companyName}</span>
                  </div>
                </div>
              </div>
              <StatusBadge status={app.status} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="p-6 space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Application Date</p>
              <div className="flex items-center gap-2 text-slate-900 font-medium">
                <Calendar className="w-4 h-4 text-slate-400" />
                {app.applicationDate}
              </div>
            </div>
            <div className="p-6 space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resume Used</p>
              <button className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700">
                <FileText className="w-4 h-4" />
                Resume_v2.pdf
                <Download className="w-3 h-3 ml-1" />
              </button>
            </div>
            <div className="p-6 space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Updated</p>
              <div className="flex items-center gap-2 text-slate-900 font-medium">
                <Clock className="w-4 h-4 text-slate-400" />
                2 days ago
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Notes Section */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">Notes from Company</h2>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {app.notes || "No notes available for this application yet."}
              </p>
            </section>

            {/* Timeline/History */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-slate-900">Application History</h2>
              <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                <div className="relative pl-8">
                  <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm"></div>
                  <p className="text-sm font-bold text-slate-900">{app.status} reached</p>
                  <p className="text-xs text-slate-500">March 5, 2024</p>
                </div>
                <div className="relative pl-8">
                  <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-slate-300 border-4 border-white shadow-sm"></div>
                  <p className="text-sm font-medium text-slate-700">Application Submitted</p>
                  <p className="text-xs text-slate-500">{app.applicationDate}</p>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            {/* Upcoming Event */}
            {app.upcomingEvent && (
              <section className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">Upcoming {app.upcomingEvent.type}</h2>
                  <Video className="w-5 h-5 opacity-80" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-indigo-100">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{format(new Date(app.upcomingEvent.date), 'MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-indigo-100">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{format(new Date(app.upcomingEvent.date), 'h:mm a')}</span>
                  </div>
                </div>

                {app.upcomingEvent.meetingLink && (
                  <a 
                    href={app.upcomingEvent.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors"
                  >
                    Join Meeting
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                {app.upcomingEvent.prepNotes && (
                  <div className="pt-4 border-t border-indigo-500/50">
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-2">Prep Notes</p>
                    <p className="text-sm text-indigo-50">{app.upcomingEvent.prepNotes}</p>
                  </div>
                )}
              </section>
            )}

            {/* Quick Actions */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Quick Actions</h2>
              <div className="space-y-2">
                <button className="flex items-center gap-3 w-full p-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                  <LinkIcon className="w-4 h-4 text-slate-400" />
                  Copy Job Link
                </button>
                <button className="flex items-center gap-3 w-full p-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  Contact Advisor
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
