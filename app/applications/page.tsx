'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { MOCK_APPLICATIONS } from '@/lib/mock-data';
import { 
  Download,
  ExternalLink,
  Filter,
  Search
} from 'lucide-react';
import Link from 'next/link';

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
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status] || 'bg-slate-50 text-slate-700 border-slate-100'}`}>
      {status}
    </span>
  );
};

export default function ApplicationsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">All Applications</h1>
            <p className="text-slate-500">Manage and track all your submitted job applications.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Role</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Resume</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_APPLICATIONS.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                          {app.companyName.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-900">{app.companyName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{app.jobRole}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4">
                      <button className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                        <Download className="w-3 h-3" />
                        Resume.pdf
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{app.applicationDate}</td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/applications/${app.id}`}
                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors inline-block"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
