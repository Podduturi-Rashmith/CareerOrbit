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
import { BriefcaseBusiness } from 'lucide-react';
import { adminPremiumUi } from '@/lib/admin/admin-theme';
import { cn } from '@/lib/utils';
import { toDateInputValue } from '@/lib/admin/date-utils';
import { apiFetchJson } from '@/lib/client/api';

type JobCategory = ApplicationCategory;
type AdminJobRecord = AdminApplicationRecord & { jobLink?: string };

type JobFormState = {
  companyName: string;
  date: string;
  category: JobCategory;
  subcategory: string;
  jobLink: string;
  jobTitle: string;
  jobDescription: string;
};

export default function AdminJobsAddPage() {
  const categoryOptions = React.useMemo(() => Object.keys(APPLICATION_CATEGORY_MAP) as JobCategory[], []);
  const defaultCategory = categoryOptions[0];
  const defaultSubcategory = APPLICATION_CATEGORY_MAP[defaultCategory][0];

  const [applications, setApplications] = React.useState<AdminJobRecord[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState('');
  const [form, setForm] = React.useState<JobFormState>({
    companyName: '',
    date: toDateInputValue(new Date()),
    category: defaultCategory,
    subcategory: defaultSubcategory,
    jobLink: '',
    jobTitle: '',
    jobDescription: '',
  });

  const subcategoryOptions = React.useMemo(
    () => APPLICATION_CATEGORY_MAP[form.category] || [],
    [form.category]
  );

  React.useEffect(() => {
    const loadJobs = async () => {
      const data = await apiFetchJson<{ jobs: AdminJobRecord[] }>('/api/admin/jobs');
      setApplications(Array.isArray(data.jobs) ? data.jobs : []);
    };
    loadJobs().catch(() => setApplications([]));
  }, []);

  const canSaveApplication =
    form.companyName.trim().length > 1 &&
    form.category.trim().length > 0 &&
    form.subcategory.trim().length > 1 &&
    form.jobLink.trim().length > 5 &&
    form.jobTitle.trim().length > 2 &&
    form.jobDescription.trim().length > 10 &&
    /^\d{4}-\d{2}-\d{2}$/.test(form.date);

  const saveApplication = async () => {
    if (!canSaveApplication) return;
    setSaving(true);
    setStatusMessage('');
    try {
      const data = await apiFetchJson<{ job: AdminJobRecord }>('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: form.companyName.trim(),
          category: form.category,
          subcategory: form.subcategory,
          jobTitle: form.jobTitle.trim(),
          jobDescription: form.jobDescription.trim(),
          jobLink: form.jobLink.trim(),
          date: form.date,
          studentId: 'unassigned',
          studentName: 'Unassigned',
        }),
      });
      const next = data.job as AdminJobRecord;
      setApplications((current) => [next, ...current]);
      setForm({
        companyName: '',
        date: toDateInputValue(new Date()),
        category: defaultCategory,
        subcategory: defaultSubcategory,
        jobLink: '',
        jobTitle: '',
        jobDescription: '',
      });
      setStatusMessage('Job saved to MongoDB.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to save job.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGate expectedRole="admin">
      <DashboardLayout>
        <div className="space-y-6">
          <section className={adminPremiumUi.hero}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-200/80">Jobs Subpage</p>
            <h1 className="mt-2 text-3xl font-display font-black tracking-tight md:text-4xl text-white">Add Jobs</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
              Enter job details and save quickly. View and filter all saved records in the jobs view subpage.
            </p>
          </section>

          <section className={cn(adminPremiumUi.surface, 'overflow-hidden')}>
            <div className={cn(adminPremiumUi.sectionHeader, 'px-6 py-5')}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <BriefcaseBusiness className="h-5 w-5 text-lime-200" />
                  <h2 className="text-xl font-black text-white">Add / Save Job</h2>
                </div>
                <span className={adminPremiumUi.badge}>
                  {applications.length} saved
                </span>
              </div>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className={adminPremiumUi.fieldLabel}>
                  Company Name
                  <input
                    value={form.companyName}
                    onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
                    className={adminPremiumUi.input}
                    placeholder="e.g., Google"
                  />
                </label>

                <label className={adminPremiumUi.fieldLabel}>
                  Date
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                    className={adminPremiumUi.input}
                  />
                </label>

                <label className={adminPremiumUi.fieldLabel}>
                  Category
                  <select
                    value={form.category}
                    onChange={(e) => {
                      const nextCategory = e.target.value as JobCategory;
                      const nextSubcategory = APPLICATION_CATEGORY_MAP[nextCategory][0] || '';
                      setForm((prev) => ({
                        ...prev,
                        category: nextCategory,
                        subcategory: nextSubcategory,
                        jobTitle: prev.jobTitle.trim().length === 0 ? nextSubcategory : prev.jobTitle,
                      }));
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
                    value={form.subcategory}
                    onChange={(e) => setForm((prev) => ({ ...prev, subcategory: e.target.value }))}
                    className={adminPremiumUi.select}
                  >
                    {subcategoryOptions.map((subcategory) => (
                      <option key={subcategory} value={subcategory}>
                        {subcategory}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={cn(adminPremiumUi.fieldLabel, 'md:col-span-2')}>
                  Job Link
                  <input
                    value={form.jobLink}
                    onChange={(e) => setForm((prev) => ({ ...prev, jobLink: e.target.value }))}
                    className={adminPremiumUi.input}
                    placeholder="https://company.com/careers/job-id"
                  />
                </label>

                <label className={cn(adminPremiumUi.fieldLabel, 'md:col-span-2')}>
                  Job Title
                  <input
                    value={form.jobTitle}
                    onChange={(e) => setForm((prev) => ({ ...prev, jobTitle: e.target.value }))}
                    className={adminPremiumUi.input}
                    placeholder="e.g., Backend Engineer"
                  />
                </label>

                <label className={cn(adminPremiumUi.fieldLabel, 'md:col-span-2')}>
                  Job Description
                  <textarea
                    value={form.jobDescription}
                    onChange={(e) => setForm((prev) => ({ ...prev, jobDescription: e.target.value }))}
                    className={cn(adminPremiumUi.textarea, 'min-h-[180px]')}
                    placeholder="Paste the full job description..."
                  />
                </label>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={saveApplication}
                  disabled={!canSaveApplication || saving}
                  className={adminPremiumUi.buttonPrimary}
                >
                  {saving ? 'Saving...' : 'Save Job'}
                </button>
                <Link href="/admin/jobs/view" className={adminPremiumUi.linkAccent}>
                  Go to Saved Jobs
                </Link>
              </div>
              {statusMessage && <p className="text-xs text-lime-200">{statusMessage}</p>}
            </div>
          </section>
        </div>
      </DashboardLayout>
    </RoleGate>
  );
}

