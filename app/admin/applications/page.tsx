'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import RoleGate from '@/components/RoleGate';
import {
  APPLICATION_CATEGORY_MAP,
  loadAdminApplications,
  type AdminApplicationRecord,
  type ApplicationCategory,
} from '@/lib/admin/applications-store';
import { MOCK_STUDENTS } from '@/lib/mock-data';
import { BriefcaseBusiness, CalendarDays, Search } from 'lucide-react';

type DatePreset = 'all' | 'today' | 'last7' | 'last30' | 'custom';

function toDateInputValue(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseDateOnly(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function AdminApplicationsPage() {
  const categoryOptions = React.useMemo(() => Object.keys(APPLICATION_CATEGORY_MAP) as ApplicationCategory[], []);
  const [applications, setApplications] = React.useState<AdminApplicationRecord[]>([]);
  const [categoryFilter, setCategoryFilter] = React.useState<ApplicationCategory | 'all'>('all');
  const [search, setSearch] = React.useState('');
  const [datePreset, setDatePreset] = React.useState<DatePreset>('all');
  const [fromDate, setFromDate] = React.useState('');
  const [toDate, setToDate] = React.useState('');

  React.useEffect(() => {
    const sync = () => {
      const data = loadAdminApplications();
      const normalized = data.map((app) => {
        if (app.studentId && app.studentName) return app;
        const fallback = MOCK_STUDENTS[0];
        return {
          ...app,
          studentId: fallback?.studentId || 'unknown',
          studentName: fallback?.name || 'Unknown Student',
        };
      });
      setApplications(normalized);
    };
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const filtered = React.useMemo(() => {
    const now = new Date();
    const today = parseDateOnly(toDateInputValue(now));
    let start: Date | null = null;
    let end: Date | null = null;

    if (datePreset === 'today' && today) {
      start = today;
      end = today;
    } else if (datePreset === 'last7' && today) {
      start = new Date(today);
      start.setDate(start.getDate() - 6);
      end = today;
    } else if (datePreset === 'last30' && today) {
      start = new Date(today);
      start.setDate(start.getDate() - 29);
      end = today;
    } else if (datePreset === 'custom') {
      start = fromDate ? parseDateOnly(fromDate) : null;
      end = toDate ? parseDateOnly(toDate) : null;
    }

    const q = search.trim().toLowerCase();
    return applications
      .filter((a) => (categoryFilter === 'all' ? true : a.category === categoryFilter))
      .filter((a) => {
        if (datePreset === 'all') return true;
        const d = parseDateOnly(a.date);
        if (!d) return false;
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      })
      .filter((a) => {
        if (!q) return true;
        return `${a.companyName} ${a.jobTitle} ${a.subcategory} ${a.category}`.toLowerCase().includes(q);
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [applications, categoryFilter, datePreset, fromDate, search, toDate]);

  const grouped = React.useMemo(() => {
    const out: Record<ApplicationCategory, AdminApplicationRecord[]> = {} as Record<ApplicationCategory, AdminApplicationRecord[]>;
    for (const c of categoryOptions) out[c] = [];
    for (const app of filtered) out[app.category].push(app);
    return out;
  }, [categoryOptions, filtered]);

  return (
    <RoleGate expectedRole="admin">
      <DashboardLayout>
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500">Admin Workspace</p>
            <h1 className="mt-2 text-2xl md:text-3xl font-display font-black text-slate-900">Applications</h1>
            <p className="mt-2 text-sm text-slate-500 max-w-2xl">
              All applications created in the Jobs panel are stored and organized here by category for easy tracking.
            </p>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <BriefcaseBusiness className="w-5 h-5 text-slate-700" />
                <h2 className="text-lg font-bold text-slate-900">Saved Applications</h2>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-xs font-semibold text-slate-600">
                  Date
                  <select
                    value={datePreset}
                    onChange={(e) => setDatePreset(e.target.value as DatePreset)}
                    className="ml-2 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700"
                  >
                    <option value="all">All time</option>
                    <option value="today">Today</option>
                    <option value="last7">Last 7 days</option>
                    <option value="last30">Last 30 days</option>
                    <option value="custom">Custom range</option>
                  </select>
                </label>

                <label className="text-xs font-semibold text-slate-600">
                  Category
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as ApplicationCategory | 'all')}
                    className="ml-2 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700"
                  >
                    <option value="all">All categories</option>
                    {categoryOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search applications..."
                    className="w-72 pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-teal-600/25"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {datePreset === 'custom' && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <CalendarDays className="w-4 h-4" /> Custom Date Range
                  </div>
                  <label className="text-xs font-semibold text-slate-600">
                    From
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="ml-2 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    To
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="ml-2 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700"
                    />
                  </label>
                </div>
              )}

              {categoryOptions.map((category) => {
                const items = grouped[category];
                if (categoryFilter !== 'all' && categoryFilter !== category) return null;
                return (
                  <div key={category} className="rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                      <p className="text-sm font-extrabold text-slate-900">{category}</p>
                      <span className="text-xs font-bold text-slate-500">{items.length} applications</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-white">
                            <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-bold">Company</th>
                            <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-bold">Job Title</th>
                            <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-bold">Subcategory</th>
                            <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-bold">Student</th>
                            <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-bold">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {items.map((app) => (
                            <tr key={app.id} className="hover:bg-slate-50/70">
                              <td className="px-4 py-3 text-sm font-semibold text-slate-900">{app.companyName}</td>
                              <td className="px-4 py-3 text-sm text-slate-700">{app.jobTitle}</td>
                              <td className="px-4 py-3 text-sm text-slate-700">{app.subcategory}</td>
                              <td className="px-4 py-3 text-sm text-slate-700">{app.studentName}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{app.date}</td>
                            </tr>
                          ))}
                          {items.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-4 py-6 text-sm text-center text-slate-500">
                                No applications in this category.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </DashboardLayout>
    </RoleGate>
  );
}

