'use client';

import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import RoleGate from '@/components/RoleGate';
import {
  APPLICATION_CATEGORY_MAP,
  type AdminApplicationRecord,
  type ApplicationCategory,
} from '@/lib/admin/applications-store';
import { MOCK_STUDENTS } from '@/lib/mock-data';
import { adminTheme } from '@/lib/admin/admin-theme';
import { cn } from '@/lib/utils';
import { Download, FileText, Sparkles } from 'lucide-react';
import { classifyStudentRole } from '@/lib/admin/role-classification';
import { toDateInputValue } from '@/lib/admin/date-utils';
import { apiFetchJson } from '@/lib/client/api';

type JobRecord = AdminApplicationRecord & { jobLink?: string };
type JobCategory = ApplicationCategory;
type ResumeResponse = {
  id: string;
  studentEmail: string;
  fileName: string;
  mimeType: string;
  fileDataUrl: string;
  extractedText: string;
};
type DraftResponse = {
  id: string;
  createdAt: number;
  studentName: string;
  companyName: string;
  jobTitle: string;
  downloadUrl: string;
};

const ROLE_CATEGORIES = Object.keys(APPLICATION_CATEGORY_MAP) as JobCategory[];

export default function AdminApplicationsPage() {
  const [jobs, setJobs] = React.useState<JobRecord[]>([]);
  const [category, setCategory] = React.useState<JobCategory>(ROLE_CATEGORIES[0]);
  const [selectedJobId, setSelectedJobId] = React.useState('');
  const [selectedStudentEmail, setSelectedStudentEmail] = React.useState('');
  const [masterResume, setMasterResume] = React.useState<ResumeResponse | null>(null);
  const [generating, setGenerating] = React.useState(false);
  const [latestDraft, setLatestDraft] = React.useState<DraftResponse | null>(null);
  const [appliedOn, setAppliedOn] = React.useState(toDateInputValue(new Date()));
  const [notes, setNotes] = React.useState('');
  const [savingRecord, setSavingRecord] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string>('');

  React.useEffect(() => {
    const loadJobs = async () => {
      const data = await apiFetchJson<{ jobs: JobRecord[] }>('/api/admin/jobs');
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
    };
    loadJobs().catch(() => setJobs([]));
  }, []);

  const filteredJobs = React.useMemo(
    () => jobs.filter((job) => job.category === category),
    [category, jobs]
  );
  const filteredStudents = React.useMemo(
    () => MOCK_STUDENTS.filter((student) => classifyStudentRole(student) === category),
    [category]
  );

  React.useEffect(() => {
    if (!filteredJobs.some((job) => job.id === selectedJobId)) {
      setSelectedJobId(filteredJobs[0]?.id || '');
    }
  }, [filteredJobs, selectedJobId]);

  React.useEffect(() => {
    if (!filteredStudents.some((student) => student.email === selectedStudentEmail)) {
      setSelectedStudentEmail(filteredStudents[0]?.email || '');
    }
  }, [filteredStudents, selectedStudentEmail]);

  const selectedJob = filteredJobs.find((job) => job.id === selectedJobId) || null;
  const selectedStudent =
    filteredStudents.find((student) => student.email === selectedStudentEmail) || null;

  const refreshMasterResume = React.useCallback(async () => {
    if (!selectedStudent?.email) {
      setMasterResume(null);
      return;
    }
    const data = await apiFetchJson<{ resume: ResumeResponse | null }>(
      `/api/admin/master-resumes?studentEmail=${encodeURIComponent(selectedStudent.email)}`
    );
    const resume = data.resume || null;
    setMasterResume(resume);
  }, [selectedStudent?.email]);

  React.useEffect(() => {
    refreshMasterResume().catch(() => {
      setMasterResume(null);
    });
  }, [refreshMasterResume]);

  const onGenerateResume = async () => {
    if (!selectedJob || !selectedStudent) return;
    setFeedback('');
    setGenerating(true);
    try {
      const data = await apiFetchJson<{ draft: DraftResponse | null }>(
        `/api/admin/jobs/${selectedJob.id}/tailor`,
        {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: selectedJob.companyName,
          jobTitle: selectedJob.jobTitle,
          jobDescription: selectedJob.jobDescription,
          category: selectedJob.category,
          studentId: selectedStudent.studentId,
          studentName: selectedStudent.name,
          studentEmail: selectedStudent.email,
        }),
      }
      );
      setLatestDraft(data.draft || null);
      setFeedback('Tailored resume generated successfully.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Failed to generate tailored resume.');
    } finally {
      setGenerating(false);
    }
  };

  const onSaveAppliedRecord = async () => {
    if (!selectedJob || !selectedStudent || !latestDraft) return;
    setSavingRecord(true);
    setFeedback('');
    try {
      await apiFetchJson('/api/admin/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJob.id,
          jobTitle: selectedJob.jobTitle,
          companyName: selectedJob.companyName,
          category: selectedJob.category,
          studentId: selectedStudent.studentId,
          studentName: selectedStudent.name,
          studentEmail: selectedStudent.email,
          draftId: latestDraft.id,
          draftFileName: `${selectedStudent.name}-${selectedJob.companyName}-${selectedJob.jobTitle}.docx`,
          appliedOn,
          notes,
        }),
      });
      setNotes('');
      setFeedback('Applied record saved.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Failed to save applied record.');
    } finally {
      setSavingRecord(false);
    }
  };

  return (
    <RoleGate expectedRole="admin">
      <DashboardLayout>
        <div className="space-y-6">
          <section className={adminTheme.hero}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-200/80">Admin Applications</p>
            <h1 className="mt-2 text-3xl font-display font-black tracking-tight text-white md:text-4xl">
              Apply Jobs for Students
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-300 md:text-base">
              Select job and student by category, generate a tailored resume from the student master resume, then record applied status.
            </p>
          </section>

          <section className={cn(adminTheme.surface, 'overflow-hidden')}>
            <div className={cn(adminTheme.sectionHeader, 'px-6 py-5')}>
              <h2 className="text-xl font-black text-white">Generate Resume</h2>
            </div>
            <div className="space-y-5 p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className={adminTheme.fieldLabel}>
                  Category
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as JobCategory)}
                    className={adminTheme.select}
                  >
                    {ROLE_CATEGORIES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={adminTheme.fieldLabel}>
                  Job
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className={adminTheme.select}
                  >
                    {filteredJobs.length === 0 && <option value="">No jobs in this category</option>}
                    {filteredJobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.companyName} - {job.jobTitle}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={adminTheme.fieldLabel}>
                  Student
                  <select
                    value={selectedStudentEmail}
                    onChange={(e) => setSelectedStudentEmail(e.target.value)}
                    className={adminTheme.select}
                  >
                    {filteredStudents.length === 0 && (
                      <option value="">No students in this category</option>
                    )}
                    {filteredStudents.map((student) => (
                      <option key={student.email} value={student.email}>
                        {student.name} - {student.email}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className={cn(adminTheme.surfaceSubtle, 'space-y-3 p-4')}>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-lime-200" />
                  <p className="text-sm font-semibold text-slate-200">Student Master Resume</p>
                </div>
                <p className="text-xs text-slate-400">
                  Automatically loaded from Student Database for the selected student.
                </p>
                {masterResume && (
                  <div className="rounded-xl border border-lime-300/20 bg-lime-300/10 px-3 py-2 text-xs text-lime-100">
                    Loaded: {masterResume.fileName}
                  </div>
                )}
                {!masterResume && (
                  <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-100">
                    No master resume found for this student. Add it in Admin &gt; Students first.
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onGenerateResume}
                  disabled={!selectedJob || !selectedStudent || !masterResume || generating}
                  className={adminTheme.buttonPrimary}
                >
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {generating ? 'Generating...' : 'Generate Resume'}
                  </span>
                </button>
                {latestDraft?.downloadUrl && (
                  <a href={latestDraft.downloadUrl} className={adminTheme.linkAccent}>
                    <span className="inline-flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      Download Generated Resume
                    </span>
                  </a>
                )}
              </div>
            </div>
          </section>

          <section className={cn(adminTheme.surface, 'overflow-hidden')}>
            <div className={cn(adminTheme.sectionHeader, 'px-6 py-5')}>
              <h2 className="text-xl font-black text-white">Mark Applied</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
              <label className={adminTheme.fieldLabel}>
                Applied On
                <input
                  type="date"
                  value={appliedOn}
                  onChange={(e) => setAppliedOn(e.target.value)}
                  className={adminTheme.input}
                />
              </label>
              <label className={cn(adminTheme.fieldLabel, 'md:col-span-2')}>
                Notes
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={adminTheme.input}
                  placeholder="Optional notes after applying"
                />
              </label>
              <div className="md:col-span-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={onSaveAppliedRecord}
                    disabled={!selectedJob || !selectedStudent || !latestDraft || savingRecord}
                    className={adminTheme.buttonPrimary}
                  >
                    {savingRecord ? 'Saving...' : 'Save Applied Record'}
                  </button>
                  <Link href="/admin/applications/records" className={adminTheme.linkAccent}>
                    View Applied Jobs Records
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {feedback && (
            <div className="rounded-xl border border-lime-300/30 bg-lime-300/10 px-4 py-3 text-sm text-lime-100">
              {feedback}
            </div>
          )}
        </div>
      </DashboardLayout>
    </RoleGate>
  );
}
