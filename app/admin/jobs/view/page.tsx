'use client';

import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import RoleGate from '@/components/RoleGate';
import {
  APPLICATION_CATEGORY_MAP,
  type ApplicationCategory,
  type AdminApplicationRecord,
} from '@/lib/admin/applications-store';
import { CalendarDays, Filter } from 'lucide-react';
import { adminPremiumUi } from '@/lib/admin/admin-theme';
import { cn } from '@/lib/utils';
import { parseDateOnlyToLocal, startOfDayLocal, toDateInputValue } from '@/lib/admin/date-utils';
import { apiFetchJson } from '@/lib/client/api';

type JobCategory = ApplicationCategory;
type TimeFilter = 'today' | 'yesterday' | 'last3' | 'last7' | 'custom';
type AdminJobRecord = AdminApplicationRecord & { jobLink?: string };

export default function AdminJobsViewPage() {
  const categoryOptions = React.useMemo(() => Object.keys(APPLICATION_CATEGORY_MAP) as JobCategory[], []);
  const [applications, setApplications] = React.useState<AdminJobRecord[]>([]);
  const [timeFilter, setTimeFilter] = React.useState<TimeFilter>('today');
  const [categoryFilter, setCategoryFilter] = React.useState<JobCategory | 'all'>('all');
  const [customFromDate, setCustomFromDate] = React.useState<string>(toDateInputValue(new Date()));
  const [customToDate, setCustomToDate] = React.useState<string>(toDateInputValue(new Date()));
  const [editingJob, setEditingJob] = React.useState<AdminJobRecord | null>(null);
  const [editForm, setEditForm] = React.useState<{
    companyName: string;
    date: string;
    category: JobCategory;
    subcategory: string;
    jobTitle: string;
    jobDescription: string;
    jobLink: string;
  } | null>(null);
  const [savingEdit, setSavingEdit] = React.useState(false);

  React.useEffect(() => {
    const loadJobs = async () => {
      const data = await apiFetchJson<{ jobs: AdminJobRecord[] }>('/api/admin/jobs');
      setApplications(Array.isArray(data.jobs) ? data.jobs : []);
    };
    loadJobs().catch(() => setApplications([]));
  }, []);

  const editSubcategoryOptions = React.useMemo(() => {
    if (!editForm) return [];
    return APPLICATION_CATEGORY_MAP[editForm.category] || [];
  }, [editForm]);

  const openEdit = (job: AdminJobRecord) => {
    setEditingJob(job);
    setEditForm({
      companyName: job.companyName || '',
      date: job.date || toDateInputValue(new Date()),
      category: job.category,
      subcategory: job.subcategory || '',
      jobTitle: job.jobTitle || '',
      jobDescription: job.jobDescription || '',
      jobLink: job.jobLink || '',
    });
  };

  const closeEdit = () => {
    setEditingJob(null);
    setEditForm(null);
  };

  const saveEdit = async () => {
    if (!editingJob || !editForm) return;
    setSavingEdit(true);
    try {
      const data = await apiFetchJson<{ job: AdminJobRecord }>(`/api/admin/jobs/${editingJob.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const updated = data.job as AdminJobRecord;
      setApplications((current) => current.map((job) => (job.id === updated.id ? updated : job)));
      closeEdit();
    } catch {
      // keep modal open for retry
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredApplications = React.useMemo(() => {
    const todayStart = startOfDayLocal(new Date());
    const now = new Date();
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const last3Start = new Date(todayStart);
    last3Start.setDate(last3Start.getDate() - 2);
    const last7Start = new Date(todayStart);
    last7Start.setDate(last7Start.getDate() - 6);

    let timeStart = todayStart;
    let timeEnd = now;

    if (timeFilter === 'yesterday') {
      timeStart = yesterdayStart;
      timeEnd = new Date(todayStart.getTime() - 1);
    } else if (timeFilter === 'last3') {
      timeStart = last3Start;
      timeEnd = now;
    } else if (timeFilter === 'last7') {
      timeStart = last7Start;
      timeEnd = now;
    } else if (timeFilter === 'custom') {
      const parsedFrom = parseDateOnlyToLocal(customFromDate);
      const parsedTo = parseDateOnlyToLocal(customToDate);
      if (!parsedFrom || !parsedTo) return [];
      timeStart = startOfDayLocal(parsedFrom);
      const customEnd = startOfDayLocal(parsedTo);
      timeEnd = new Date(customEnd.getTime() + 24 * 60 * 60 * 1000 - 1);
    }

    return applications
      .filter((application) => {
        const recordDate = parseDateOnlyToLocal(application.date);
        if (!recordDate) return false;
        const inTimeRange = recordDate >= timeStart && recordDate <= timeEnd;
        if (!inTimeRange) return false;
        if (categoryFilter !== 'all' && application.category !== categoryFilter) return false;
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [applications, categoryFilter, customFromDate, customToDate, timeFilter]);

  return (
    <RoleGate expectedRole="admin">
      <DashboardLayout>
        <div className="space-y-6">
          <section className={adminPremiumUi.hero}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-200/80">Jobs Subpage</p>
            <h1 className="mt-2 text-3xl font-display font-black tracking-tight md:text-4xl text-white">Saved Jobs</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
              Filter jobs by timeframe and category for quick retrieval.
            </p>
          </section>

          <section className={cn(adminPremiumUi.surface, 'overflow-hidden')}>
            <div className={cn(adminPremiumUi.sectionHeader, 'px-6 py-5')}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-lime-200" />
                  <h2 className="text-xl font-black text-white">Filter Jobs</h2>
                </div>
                <div className="flex items-center gap-4">
                  <span className={adminPremiumUi.badge}>
                    {filteredApplications.length} results
                  </span>
                  <Link href="/admin/jobs/add" className={adminPremiumUi.linkAccent}>
                    + Add New
                  </Link>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex flex-wrap items-center gap-2">
                {([
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: 'last3', label: 'Last 3 Days' },
                  { id: 'last7', label: 'Last 7 Days' },
                  { id: 'custom', label: 'Custom Range' },
                ] as const).map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setTimeFilter(option.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      timeFilter === option.id
                        ? 'bg-lime-300/20 text-lime-100 border border-lime-300/30'
                        : 'border border-white/15 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className={adminPremiumUi.fieldLabel}>
                  Category
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as JobCategory | 'all')}
                    className={adminPremiumUi.select}
                  >
                    <option value="all">All Categories</option>
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {timeFilter === 'custom' && (
                <div className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-2">
                  <label className={adminPremiumUi.fieldLabel}>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-slate-400" /> From
                    </span>
                    <input
                      type="date"
                      value={customFromDate}
                      onChange={(e) => setCustomFromDate(e.target.value)}
                      className={adminPremiumUi.input}
                    />
                  </label>
                  <label className={adminPremiumUi.fieldLabel}>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-slate-400" /> To
                    </span>
                    <input
                      type="date"
                      value={customToDate}
                      onChange={(e) => setCustomToDate(e.target.value)}
                      className={adminPremiumUi.input}
                    />
                  </label>
                </div>
              )}

              <div className={adminPremiumUi.tableWrap}>
                <table className="w-full text-left">
                  <thead>
                    <tr className={adminPremiumUi.tableHeadRow}>
                      <th className={adminPremiumUi.tableHeadCell}>Date</th>
                      <th className={adminPremiumUi.tableHeadCell}>Company</th>
                      <th className={adminPremiumUi.tableHeadCell}>Category</th>
                      <th className={adminPremiumUi.tableHeadCell}>Subcategory</th>
                      <th className={adminPremiumUi.tableHeadCell}>Job Title</th>
                      <th className={adminPremiumUi.tableHeadCell}>Job Link</th>
                      <th className={adminPremiumUi.tableHeadCell}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredApplications.map((application) => (
                      <tr key={application.id} className={adminPremiumUi.tableRow}>
                        <td className={cn(adminPremiumUi.tableCell, 'font-medium text-slate-300')}>{application.date}</td>
                        <td className={cn(adminPremiumUi.tableCell, 'font-semibold text-slate-100')}>{application.companyName}</td>
                        <td className={adminPremiumUi.tableCell}>{application.category}</td>
                        <td className={adminPremiumUi.tableCell}>{application.subcategory}</td>
                        <td className={adminPremiumUi.tableCell}>{application.jobTitle}</td>
                        <td className={adminPremiumUi.tableCell}>
                          {application.jobLink ? (
                            <a
                              href={application.jobLink}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-lime-200 hover:text-lime-100"
                            >
                              Open Link
                            </a>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className={adminPremiumUi.tableCell}>
                          <button
                            onClick={() => openEdit(application)}
                            className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredApplications.length === 0 && (
                      <tr>
                        <td colSpan={7} className={adminPremiumUi.emptyState}>
                          No applications found for this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {editingJob && editForm && (
            <section className={cn(adminPremiumUi.surface, 'overflow-hidden')}>
              <div className={cn(adminPremiumUi.sectionHeader, 'px-6 py-5')}>
                <h2 className="text-xl font-black text-white">Edit Saved Job</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                <label className={adminPremiumUi.fieldLabel}>
                  Company Name
                  <input
                    value={editForm.companyName}
                    onChange={(e) => setEditForm((prev) => (prev ? { ...prev, companyName: e.target.value } : prev))}
                    className={adminPremiumUi.input}
                  />
                </label>
                <label className={adminPremiumUi.fieldLabel}>
                  Date
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm((prev) => (prev ? { ...prev, date: e.target.value } : prev))}
                    className={adminPremiumUi.input}
                  />
                </label>
                <label className={adminPremiumUi.fieldLabel}>
                  Category
                  <select
                    value={editForm.category}
                    onChange={(e) => {
                      const nextCategory = e.target.value as JobCategory;
                      const nextSubcategory = APPLICATION_CATEGORY_MAP[nextCategory][0] || '';
                      setEditForm((prev) =>
                        prev
                          ? { ...prev, category: nextCategory, subcategory: nextSubcategory }
                          : prev
                      );
                    }}
                    className={adminPremiumUi.select}
                  >
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={adminPremiumUi.fieldLabel}>
                  Subcategory
                  <select
                    value={editForm.subcategory}
                    onChange={(e) => setEditForm((prev) => (prev ? { ...prev, subcategory: e.target.value } : prev))}
                    className={adminPremiumUi.select}
                  >
                    {editSubcategoryOptions.map((subcategory) => (
                      <option key={subcategory} value={subcategory}>
                        {subcategory}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={cn(adminPremiumUi.fieldLabel, 'md:col-span-2')}>
                  Job Title
                  <input
                    value={editForm.jobTitle}
                    onChange={(e) => setEditForm((prev) => (prev ? { ...prev, jobTitle: e.target.value } : prev))}
                    className={adminPremiumUi.input}
                  />
                </label>
                <label className={cn(adminPremiumUi.fieldLabel, 'md:col-span-2')}>
                  Job Link
                  <input
                    value={editForm.jobLink}
                    onChange={(e) => setEditForm((prev) => (prev ? { ...prev, jobLink: e.target.value } : prev))}
                    className={adminPremiumUi.input}
                  />
                </label>
                <label className={cn(adminPremiumUi.fieldLabel, 'md:col-span-2')}>
                  Job Description
                  <textarea
                    value={editForm.jobDescription}
                    onChange={(e) =>
                      setEditForm((prev) => (prev ? { ...prev, jobDescription: e.target.value } : prev))
                    }
                    className={cn(adminPremiumUi.textarea, 'min-h-[140px]')}
                  />
                </label>
                <div className="md:col-span-2 flex items-center gap-3">
                  <button onClick={saveEdit} disabled={savingEdit} className={adminPremiumUi.buttonPrimary}>
                    {savingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={closeEdit}
                    className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/[0.08]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </DashboardLayout>
    </RoleGate>
  );
}

