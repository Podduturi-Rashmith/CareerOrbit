'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { MOCK_APPLICATIONS } from '@/lib/mock-data';
import { 
  Briefcase, 
  Calendar, 
  PhoneCall, 
  ClipboardCheck, 
  ArrowUpRight,
  Download,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';

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

export default function DashboardPage() {
  const stats = [
    { name: 'Total Applications', value: MOCK_APPLICATIONS.length, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Interviews Scheduled', value: MOCK_APPLICATIONS.filter(a => a.status === 'Interview').length, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Screening Calls', value: MOCK_APPLICATIONS.filter(a => a.status === 'Screening Call').length, icon: PhoneCall, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Assessments Pending', value: MOCK_APPLICATIONS.filter(a => a.status === 'Assessment').length, icon: ClipboardCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const recentApplications = MOCK_APPLICATIONS.slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Welcome back, Alex!</h1>
          <p className="text-slate-500">Here&apos;s what&apos;s happening with your job search.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <span className="text-xs font-medium text-slate-400">This month</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.name}</p>
            </motion.div>
          ))}
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Applications</h2>
            <Link href="/applications" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View all <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentApplications.map((app) => (
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
