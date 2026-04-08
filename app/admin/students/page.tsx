'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import RoleGate from '@/components/RoleGate';
import { adminPremiumUi } from '@/lib/admin/admin-theme';
import { cn } from '@/lib/utils';
import { apiFetchJson } from '@/lib/client/api';
import { Database, Search, Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { StudentOnboardingSubmission } from '@/lib/admin/student-onboarding-store';

const STEP_LABELS: Record<number, string> = {
  1: 'Personal',
  2: 'Education',
  3: 'Work History',
  4: 'Visa',
  5: 'Preferences',
  6: 'Resume Upload',
  7: 'Consent',
};

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProgressBar({ completed, total = 7 }: { completed: number; total?: number }) {
  const pct = Math.round((completed / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', pct === 100 ? 'bg-lime-400' : 'bg-indigo-400')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-400 shrink-0">{completed}/{total}</span>
    </div>
  );
}

function StatusBadge({ submission }: { submission: StudentOnboardingSubmission | null }) {
  if (!submission) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
        <AlertCircle className="w-3 h-3" /> Not started
      </span>
    );
  }
  if (submission.wizardCompleted || submission.consentAccepted) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-lime-900/40 border border-lime-500/30 px-2 py-0.5 text-[10px] font-semibold text-lime-300">
        <CheckCircle2 className="w-3 h-3" /> Complete
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-900/40 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
      <Clock className="w-3 h-3" /> In progress
    </span>
  );
}

function Detail({ label, items }: { label: string; items: [string, string | undefined | null][] }) {
  const visible = items.filter(([, v]) => v);
  if (visible.length === 0) return null;
  return (
    <div className={cn(adminPremiumUi.surfaceSubtle, 'rounded-xl p-4 space-y-2')}>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{label}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {visible.map(([k, v]) => (
          <div key={k}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{k}</p>
            <p className="text-xs text-slate-200 mt-0.5 break-words">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminStudentsPage() {
  const [submissions, setSubmissions] = React.useState<StudentOnboardingSubmission[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'complete' | 'incomplete'>('all');
  const [selected, setSelected] = React.useState<StudentOnboardingSubmission | null>(null);

  React.useEffect(() => {
    const load = async () => {
      const data = await apiFetchJson<{ submissions: StudentOnboardingSubmission[] }>(
        '/api/student/onboarding?scope=all'
      );
      const list = Array.isArray(data.submissions) ? data.submissions : [];
      setSubmissions(list);
      if (list.length > 0) setSelected(list[0]);
    };
    load().catch(() => setSubmissions([])).finally(() => setLoading(false));
  }, []);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return submissions.filter((s) => {
      const isComplete = s.wizardCompleted || s.consentAccepted;
      if (statusFilter === 'complete' && !isComplete) return false;
      if (statusFilter === 'incomplete' && isComplete) return false;
      if (!q) return true;
      return (
        s.preferredName?.toLowerCase().includes(q) ||
        s.legalName?.toLowerCase().includes(q) ||
        s.submittedByEmail?.toLowerCase().includes(q) ||
        s.resumeEmail?.toLowerCase().includes(q)
      );
    });
  }, [submissions, search, statusFilter]);

  const completedCount = submissions.filter(s => s.wizardCompleted || s.consentAccepted).length;

  return (
    <RoleGate expectedRole="admin">
      <DashboardLayout>
        <div className="space-y-6">
          <section className={adminPremiumUi.hero}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-200/80">Admin Workspace</p>
            <h1 className="mt-2 text-3xl font-display font-black tracking-tight md:text-4xl text-white">
              Student Database
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-300">
              Track onboarding progress and view full profiles for every student.
            </p>
            <div className="mt-4 flex gap-6">
              <div>
                <p className="text-2xl font-black text-white">{submissions.length}</p>
                <p className="text-xs text-slate-400">Total Students</p>
              </div>
              <div>
                <p className="text-2xl font-black text-lime-300">{completedCount}</p>
                <p className="text-xs text-slate-400">Fully Onboarded</p>
              </div>
              <div>
                <p className="text-2xl font-black text-amber-300">{submissions.length - completedCount}</p>
                <p className="text-xs text-slate-400">In Progress</p>
              </div>
            </div>
          </section>

          <section className={cn(adminPremiumUi.surface, 'overflow-hidden')}>
            <div className={cn(adminPremiumUi.sectionHeader, 'px-6 py-4')}>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-lime-200" />
                <h2 className="text-xl font-black text-white">Students</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5">
              {/* Left — student list */}
              <div className="lg:col-span-2 border-r border-white/10">
                <div className="p-3 border-b border-white/10 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-lime-300/40 focus:ring-2 focus:ring-lime-300/10"
                    />
                  </div>
                  <div className="flex gap-1">
                    {(['all', 'complete', 'incomplete'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={cn(
                          'flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold capitalize transition-colors',
                          statusFilter === f
                            ? 'bg-lime-400/15 text-lime-300 border border-lime-400/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {loading ? (
                  <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
                ) : filtered.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">No students found.</div>
                ) : (
                  <ul className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                    {filtered.map(s => {
                      const isActive = selected?.id === s.id;
                      const completedSteps = s.completedSteps?.length ?? (s.consentAccepted ? 7 : 0);
                      const name = s.preferredName || s.legalName || s.submittedByEmail;
                      return (
                        <li key={s.id}>
                          <button
                            onClick={() => setSelected(s)}
                            className={cn(
                              'w-full text-left px-4 py-3 transition-colors',
                              isActive
                                ? 'bg-lime-400/10 border-l-2 border-lime-400'
                                : 'hover:bg-white/5 border-l-2 border-transparent'
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className={cn('text-sm font-semibold truncate', isActive ? 'text-lime-200' : 'text-slate-100')}>
                                {name}
                              </p>
                              <StatusBadge submission={s} />
                            </div>
                            <p className="text-xs text-slate-500 truncate mb-2">{s.submittedByEmail}</p>
                            <ProgressBar completed={completedSteps} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Right — detail panel */}
              <div className="lg:col-span-3 max-h-[700px] overflow-y-auto">
                {!selected ? (
                  <div className="p-12 text-center">
                    <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Select a student to view their profile.</p>
                  </div>
                ) : (
                  <div className="p-6 space-y-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-black text-white">
                          {selected.preferredName || selected.legalName || '—'}
                        </h3>
                        <p className="text-sm text-slate-400">{selected.submittedByEmail}</p>
                      </div>
                      <StatusBadge submission={selected} />
                    </div>

                    {/* Step checklist */}
                    <div className={cn(adminPremiumUi.surfaceSubtle, 'rounded-xl p-4')}>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Onboarding Progress</p>
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5, 6, 7].map(step => {
                          const done = selected.completedSteps?.includes(step) || !!selected.consentAccepted;
                          return (
                            <div key={step} className="flex items-center gap-3">
                              <div className={cn(
                                'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                                done ? 'bg-lime-400' : 'bg-white/10'
                              )}>
                                {done && <CheckIcon className="w-3 h-3 text-slate-900" />}
                              </div>
                              <span className={cn('text-xs font-medium', done ? 'text-slate-200' : 'text-slate-500')}>
                                Step {step} — {STEP_LABELS[step]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <Detail label="Personal Info" items={[
                      ['Legal Name', selected.legalName],
                      ['Preferred Name', selected.preferredName],
                      ['Date of Birth', selected.dateOfBirth],
                      ['Resume Email', selected.resumeEmail],
                      ['Resume Phone', selected.resumePhone],
                      ['Personal Phone', selected.personalPhone],
                      ['Address', selected.address],
                      ['LinkedIn', selected.linkedInUrl],
                    ]} />

                    <Detail label="Education" items={[
                      ['Bachelors', [selected.bachelorsUniversity, selected.bachelorsField, selected.bachelorsCompleted].filter(Boolean).join(' · ')],
                      ['Masters', [selected.mastersUniversity, selected.mastersField, selected.mastersCompleted].filter(Boolean).join(' · ')],
                      ['Certifications', selected.certifications],
                    ]} />

                    <Detail label="Visa & Eligibility" items={[
                      ['Visa Status', selected.visaStatus],
                      ['US Arrival', selected.arrivalDate],
                    ]} />

                    <Detail label="Job Preferences" items={[
                      ['Preferred Role', selected.preferredRole],
                      ['Locations', selected.jobPreferences?.locations],
                      ['Work Mode', selected.jobPreferences?.workMode],
                      ['Employment Type', selected.jobPreferences?.employmentType],
                    ]} />

                    {selected.masterResumeUrl && (
                      <div className={cn(adminPremiumUi.surfaceSubtle, 'rounded-xl p-4')}>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Resume on File</p>
                        <a
                          href={selected.masterResumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={selected.masterResumeFileName}
                          className="inline-flex items-center gap-2 rounded-lg border border-lime-400/40 px-3 py-1.5 text-xs font-semibold text-lime-300 hover:bg-lime-400/10 transition-colors"
                        >
                          ↓ {selected.masterResumeFileName || 'Download Resume'}
                        </a>
                      </div>
                    )}

                    {(selected.workExperiences?.length ?? 0) > 0 && (
                      <div className={cn(adminPremiumUi.surfaceSubtle, 'rounded-xl p-4 space-y-3')}>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Work Experience</p>
                        {selected.workExperiences.map((exp, i) => (
                          <div key={i} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 space-y-1">
                            <p className="text-sm font-semibold text-slate-200">
                              {exp.companyName} <span className="text-slate-500 font-normal">· {exp.location}</span>
                            </p>
                            <p className="text-xs text-slate-500">{exp.startDate} — {exp.endDate || 'Present'}</p>
                            <ul className="mt-1 list-disc pl-4 space-y-0.5">
                              {exp.points.filter(Boolean).map((pt, pi) => (
                                <li key={pi} className="text-xs text-slate-300">{pt}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    <Detail label="Consent & Signature" items={[
                      ['Status', selected.consentAccepted ? 'Accepted ✓' : 'Not accepted'],
                      ['Legal Name Signed', selected.legalName],
                      ['Signed Date', selected.signedDate],
                    ]} />
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </DashboardLayout>
    </RoleGate>
  );
}
