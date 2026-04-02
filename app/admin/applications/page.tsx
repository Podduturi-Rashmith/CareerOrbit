'use client';

import React from 'react';
import dynamic from 'next/dynamic';
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
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Layers,
  Lightbulb,
  MessageSquare,
  ScanSearch,
  SendHorizontal,
  Sparkles,
  Tag,
  UserCircle2,
} from 'lucide-react';
import { classifyStudentRole } from '@/lib/admin/role-classification';
import { toDateInputValue } from '@/lib/admin/date-utils';
import { apiFetchJson } from '@/lib/client/api';
import { isDocxMasterFile } from '@/lib/admin/master-resume-docx';
import { htmlResumeToPlainLines, looksLikeHtml, plainTextResumeToHtml } from '@/lib/jobs/draft-html';

const ResumeRichEditor = dynamic(
  () => import('@/components/admin/ResumeRichEditor').then((m) => m.ResumeRichEditor),
  { ssr: false }
);

const MasterDocxPreviewDialog = dynamic(
  () =>
    import('@/components/admin/MasterDocxPreviewDialog').then((m) => m.MasterDocxPreviewDialog),
  { ssr: false }
);

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
  content?: string;
  downloadUrl: string;
};
type TailorAnalysis = {
  matchScore: number;
  missingSkills: string[];
  suggestedSkills: string[];
  professionalSummary: string;
  experienceBullets: Array<{
    sourceSection: string;
    targetRole: string;
    text: string;
    needsUserInput: boolean;
  }>;
  projectSuggestions: Array<{
    title: string;
    description: string;
    keywords: string[];
  }>;
  atsKeywordsUsed: string[];
  notes: string[];
};

const ROLE_CATEGORIES = Object.keys(APPLICATION_CATEGORY_MAP) as JobCategory[];

function CopyTextButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] px-2.5 py-1.5 text-[11px] font-bold text-slate-200 transition hover:bg-white/[0.1]"
    >
      <Copy className="h-3.5 w-3.5" />
      {copied ? 'Copied' : label}
    </button>
  );
}

function experienceWhereDescription(point: TailorAnalysis['experienceBullets'][0]): string {
  const role = point.targetRole?.trim();
  const src = point.sourceSection?.trim();
  if (role) {
    return `Paste as a bullet under the employer/role that best matches “${role}” in your Experience section.`;
  }
  if (src && src.toLowerCase() !== 'experience') {
    return `Paste as a bullet in Experience (hint: ${src}).`;
  }
  return 'Paste as a bullet under the most relevant role in your Experience section.';
}

function MatchScoreRing({ score, label }: { score: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  const size = 112;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;
  const tone =
    clamped >= 75 ? 'text-emerald-300' : clamped >= 50 ? 'text-amber-300' : 'text-rose-300';
  const strokeTone =
    clamped >= 75 ? 'stroke-emerald-400' : clamped >= 50 ? 'stroke-amber-400' : 'stroke-rose-400';

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            className="stroke-white/10"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            className={cn('transition-[stroke-dashoffset] duration-700', strokeTone)}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-2xl font-black tabular-nums', tone)}>{clamped}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Match
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <p className="mt-1 text-sm text-slate-300">
          {clamped >= 75
            ? 'Strong alignment with this posting. Polish wording and export when ready.'
            : clamped >= 50
              ? 'Moderate match. Add missing keywords and tighten experience bullets.'
              : 'Low match. Prioritize missing skills and weave JD terms into the resume.'}
        </p>
      </div>
    </div>
  );
}

function KeywordChips({
  title,
  items,
  variant,
  hint,
}: {
  title: string;
  items: string[];
  variant: 'missing' | 'suggested' | 'ats';
  hint?: string;
}) {
  const styles =
    variant === 'missing'
      ? 'border-rose-400/25 bg-rose-500/10 text-rose-100'
      : variant === 'suggested'
        ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100'
        : 'border-sky-400/25 bg-sky-500/10 text-sky-100';

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Tag className="h-3.5 w-3.5 text-slate-500" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</h3>
        <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
          {items.length}
        </span>
      </div>
      {hint ? <p className="mb-3 text-[11px] leading-relaxed text-slate-500">{hint}</p> : null}
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No items in this category yet.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              key={item}
              className={cn('rounded-lg border px-2.5 py-1 text-xs font-medium', styles)}
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminApplicationsPage() {
  const [jobs, setJobs] = React.useState<JobRecord[]>([]);
  const [category, setCategory] = React.useState<JobCategory>(ROLE_CATEGORIES[0]);
  const [selectedJobId, setSelectedJobId] = React.useState('');
  const [selectedStudentEmail, setSelectedStudentEmail] = React.useState('');
  const [masterResume, setMasterResume] = React.useState<ResumeResponse | null>(null);
  const [generating, setGenerating] = React.useState(false);
  const [latestDraft, setLatestDraft] = React.useState<DraftResponse | null>(null);
  const [latestAnalysis, setLatestAnalysis] = React.useState<TailorAnalysis | null>(null);
  const [editableContent, setEditableContent] = React.useState('');
  const [savingDraftEdits, setSavingDraftEdits] = React.useState(false);
  const [downloadingTailoredDocx, setDownloadingTailoredDocx] = React.useState(false);
  /** Plain shows server text as-is; Visual wraps lines as paragraphs (can look “reformatted”). */
  const [resumeEditorMode, setResumeEditorMode] = React.useState<'visual' | 'plain'>('plain');
  /** Right column: resume editor vs suggested bullets (separate views). */
  const [resumeWorkspaceTab, setResumeWorkspaceTab] = React.useState<'resume' | 'bullets'>('resume');
  const [appliedOn, setAppliedOn] = React.useState(toDateInputValue(new Date()));
  const [notes, setNotes] = React.useState('');
  const [savingRecord, setSavingRecord] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string>('');
  const scanResultsRef = React.useRef<HTMLDivElement>(null);
  const [bulletChatMessages, setBulletChatMessages] = React.useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);
  const [bulletChatInput, setBulletChatInput] = React.useState('');
  const [bulletChatLoading, setBulletChatLoading] = React.useState(false);
  const bulletChatEndRef = React.useRef<HTMLDivElement>(null);
  const [masterDocxPreviewOpen, setMasterDocxPreviewOpen] = React.useState(false);

  const downloadMasterResume = React.useCallback(() => {
    if (!masterResume?.fileDataUrl) return;
    const a = document.createElement('a');
    a.href = masterResume.fileDataUrl;
    a.download = masterResume.fileName || 'resume';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [masterResume]);

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

  React.useEffect(() => {
    setMasterDocxPreviewOpen(false);
  }, [selectedStudent?.email, masterResume?.id]);

  React.useEffect(() => {
    bulletChatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [bulletChatMessages, bulletChatLoading, resumeWorkspaceTab]);

  const onGenerateResume = async () => {
    if (!selectedJob || !selectedStudent) return;
    setFeedback('');
    setGenerating(true);
    setLatestDraft(null);
    setLatestAnalysis(null);
    setEditableContent('');
    setBulletChatMessages([]);
    setBulletChatInput('');
    try {
      const data = await apiFetchJson<{
        draft: DraftResponse | null;
        analysis: TailorAnalysis | null;
      }>(`/api/admin/jobs/${selectedJob.id}/tailor`, {
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
      });
      setLatestDraft(data.draft || null);
      setLatestAnalysis(data.analysis || null);
      setEditableContent(data.draft?.content || '');
      setResumeEditorMode('plain');
      setResumeWorkspaceTab('resume');
      setFeedback(
        'Scan complete. Use the Experience bullets tab to copy suggestions, then Resume (editable export) to paste and edit.'
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Failed to run resume scan.');
    } finally {
      setGenerating(false);
    }
  };

  React.useEffect(() => {
    if (!latestAnalysis) return;
    scanResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [latestAnalysis]);

  const onSendBulletChat = async () => {
    const text = bulletChatInput.trim();
    if (!text || !selectedJob || !selectedStudent || !latestAnalysis || !latestDraft || bulletChatLoading)
      return;
    setBulletChatLoading(true);
    setFeedback('');
    const nextMessages = [...bulletChatMessages, { role: 'user' as const, content: text }];
    try {
      const data = await apiFetchJson<{
        ok?: boolean;
        assistantMessage: string;
        experienceBullets: TailorAnalysis['experienceBullets'];
      }>(`/api/admin/jobs/${selectedJob.id}/tailor/bullets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentEmail: selectedStudent.email,
          messages: nextMessages,
          priorBullets: latestAnalysis.experienceBullets.map((b) => ({
            text: b.text,
            sourceSection: b.sourceSection,
            targetRole: b.targetRole,
            needsUserInput: b.needsUserInput,
          })),
        }),
      });
      setBulletChatMessages([
        ...nextMessages,
        { role: 'assistant', content: data.assistantMessage || 'Here are revised bullets.' },
      ]);
      setBulletChatInput('');
      setLatestAnalysis({
        ...latestAnalysis,
        experienceBullets: data.experienceBullets,
      });
      setFeedback(
        'New bullet suggestions are in the list — paste into the master resume in the editor as you like.'
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Failed to regenerate bullets.');
    } finally {
      setBulletChatLoading(false);
    }
  };

  const onSaveDraftEdits = async () => {
    if (!selectedJob || !latestDraft || !editableContent.trim()) return;
    setSavingDraftEdits(true);
    setFeedback('');
    try {
      await apiFetchJson(`/api/admin/jobs/${selectedJob.id}/tailor/${latestDraft.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editableContent }),
      });
      setLatestDraft((d) => (d ? { ...d, content: editableContent } : d));
      setFeedback('Resume saved. Your next download uses this version.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Failed to save resume edits.');
    } finally {
      setSavingDraftEdits(false);
    }
  };

  /** Persist editor content then download so the .docx matches what you edited (not the last-saved DB snapshot only). */
  const onDownloadTailoredDocx = async () => {
    if (!selectedJob || !latestDraft || !editableContent.trim()) return;
    setDownloadingTailoredDocx(true);
    setFeedback('');
    try {
      await apiFetchJson(`/api/admin/jobs/${selectedJob.id}/tailor/${latestDraft.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editableContent }),
      });
      setLatestDraft((d) => (d ? { ...d, content: editableContent } : d));

      const res = await fetch(
        `/api/admin/jobs/${selectedJob.id}/tailor/${latestDraft.id}/download`,
        { credentials: 'include' }
      );
      if (!res.ok) {
        const errPayload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errPayload?.error || `Download failed (HTTP ${res.status}).`);
      }
      const disposition = res.headers.get('Content-Disposition');
      let filename = 'tailored-resume.docx';
      const quoted = disposition?.match(/filename="([^"]+)"/);
      if (quoted?.[1]) filename = quoted[1];
      else {
        const unquoted = disposition?.match(/filename=([^;\s]+)/);
        if (unquoted?.[1]) filename = unquoted[1].replace(/^["']|["']$/g, '');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setFeedback('Downloaded your edited resume as .docx (saved to the draft first).');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Download failed.');
    } finally {
      setDownloadingTailoredDocx(false);
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

  const jobLink = selectedJob?.jobLink?.trim();
  const canScan = !!(selectedJob && selectedStudent && masterResume);

  return (
    <RoleGate expectedRole="admin">
      <DashboardLayout>
        {masterResume && isDocxMasterFile(masterResume.fileName, masterResume.mimeType) ? (
          <MasterDocxPreviewDialog
            open={masterDocxPreviewOpen}
            onOpenChange={setMasterDocxPreviewOpen}
            fileDataUrl={masterResume.fileDataUrl}
            fileName={masterResume.fileName}
          />
        ) : null}
        <div className="space-y-5 pb-8">
          {/* Workspace header — Jobscan-style title + secondary nav */}
          <header
            className={cn(
              'flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#0b1118]/90 p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-sm md:flex-row md:items-center md:justify-between'
            )}
          >
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <ScanSearch className="h-3.5 w-3.5 text-lime-300/80" />
                Resume match workspace
              </p>
              <h1 className="mt-1 font-display text-2xl font-black tracking-tight text-white md:text-3xl">
                Compare resume to job
              </h1>
              <p className="mt-2 max-w-xl text-sm text-slate-400">
                Run a scan like Jobscan: see match score, gaps, and suggested wording side by side
                with the posting, then fine-tune the export.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/admin/applications/records"
                className={cn(
                  'rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/25 hover:bg-white/[0.07]'
                )}
              >
                Applied records
              </Link>
            </div>
          </header>

          {/* Compact setup — filters */}
          <section className={cn(adminTheme.surface, 'overflow-hidden')}>
            <div className="grid grid-cols-1 gap-4 border-b border-white/10 bg-white/[0.02] p-5 md:grid-cols-3">
              <label className={adminTheme.fieldLabel}>
                <span className="mb-1 flex items-center gap-1.5 text-slate-400">
                  <Layers className="h-3.5 w-3.5" />
                  Role bucket
                </span>
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
                <span className="mb-1 flex items-center gap-1.5 text-slate-400">
                  <Building2 className="h-3.5 w-3.5" />
                  Saved job
                </span>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className={adminTheme.select}
                >
                  {filteredJobs.length === 0 && <option value="">No jobs in this category</option>}
                  {filteredJobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.companyName} — {job.jobTitle}
                    </option>
                  ))}
                </select>
              </label>
              <label className={adminTheme.fieldLabel}>
                <span className="mb-1 flex items-center gap-1.5 text-slate-400">
                  <UserCircle2 className="h-3.5 w-3.5" />
                  Student
                </span>
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
                      {student.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Master resume status strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-lime-300/90" />
                  {masterResume ? (
                    <span className="min-w-0">
                      Master file:{' '}
                      <span className="font-semibold text-white">{masterResume.fileName}</span>
                    </span>
                  ) : (
                    <span className="text-rose-200/90">
                      No master resume — add one under Admin → Students.
                    </span>
                  )}
                </div>
                {masterResume && isDocxMasterFile(masterResume.fileName, masterResume.mimeType) ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMasterDocxPreviewOpen(true)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5',
                        'text-xs font-bold text-slate-200 transition hover:bg-white/[0.1]'
                      )}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview .docx layout
                    </button>
                    <button
                      type="button"
                      onClick={downloadMasterResume}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5',
                        'text-xs font-bold text-slate-200 transition hover:bg-white/[0.1]'
                      )}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Original master (unchanged)
                    </button>
                  </div>
                ) : masterResume ? (
                  <button
                    type="button"
                    onClick={downloadMasterResume}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5',
                      'text-xs font-bold text-slate-200 transition hover:bg-white/[0.1]'
                    )}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Original master (unchanged)
                  </button>
                ) : null}
              </div>
              {selectedJob && jobLink ? (
                <a
                  href={jobLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-300 hover:text-sky-200"
                >
                  Open job posting
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>

            <div className="border-b border-white/10 px-5 py-3 text-xs leading-relaxed text-slate-500">
              After you work in the panels, <span className="font-semibold text-slate-400">Run scan</span>,{' '}
              <span className="font-semibold text-slate-400">Save resume</span>, and{' '}
              <span className="font-semibold text-emerald-200/90">Download edited .docx</span> sit{' '}
              <span className="font-semibold text-slate-400">directly under the job/resume split</span>. Match score and
              keyword lists follow below that.
            </div>

            {/* Split panes: Job vs Resume */}
            <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
              <div className="border-b border-white/10 lg:border-b-0 lg:border-r lg:border-white/10">
                <div className="sticky top-0 z-[1] flex items-center justify-between border-b border-white/10 bg-[#0a0f14]/95 px-4 py-3 backdrop-blur-md">
                  <h2 className="text-sm font-bold text-white">Job description</h2>
                  {selectedJob && (
                    <span className="truncate text-xs text-slate-500">
                      {selectedJob.companyName}
                    </span>
                  )}
                </div>
                <div className="max-h-[min(52vh,560px)] overflow-y-auto p-4">
                  {selectedJob ? (
                    <>
                      <p className="font-display text-lg font-bold text-white">{selectedJob.jobTitle}</p>
                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                        {selectedJob.category}
                      </p>
                      <div className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-300">
                        {selectedJob.jobDescription}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">Select a saved job to view the posting.</p>
                  )}
                </div>
              </div>

              <div>
                <div className="sticky top-0 z-[1] border-b border-white/10 bg-[#0a0f14]/95 backdrop-blur-md">
                  <div className="flex flex-col gap-2 px-3 py-2.5 sm:px-4">
                    <div
                      className="flex w-full rounded-xl border border-white/10 bg-white/[0.03] p-0.5"
                      role="tablist"
                      aria-label="Resume workspace"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={resumeWorkspaceTab === 'resume'}
                        onClick={() => setResumeWorkspaceTab('resume')}
                        className={cn(
                          'min-w-0 flex-1 rounded-lg px-2 py-2.5 text-center text-[11px] font-bold leading-tight transition sm:text-xs',
                          resumeWorkspaceTab === 'resume'
                            ? 'bg-lime-400/20 text-lime-100 shadow-[inset_0_0_0_1px_rgba(190,242,100,0.15)]'
                            : 'text-slate-400 hover:text-slate-200'
                        )}
                      >
                        Resume (editable export)
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={resumeWorkspaceTab === 'bullets'}
                        onClick={() => setResumeWorkspaceTab('bullets')}
                        className={cn(
                          'min-w-0 flex-1 rounded-lg px-2 py-2.5 text-center text-[11px] font-bold leading-tight transition sm:text-xs',
                          resumeWorkspaceTab === 'bullets'
                            ? 'bg-lime-400/20 text-lime-100 shadow-[inset_0_0_0_1px_rgba(190,242,100,0.15)]'
                            : 'text-slate-400 hover:text-slate-200'
                        )}
                      >
                        <span className="inline-flex flex-col items-center gap-0.5 sm:inline sm:whitespace-nowrap">
                          <span>Suggested experience bullets</span>
                          {latestAnalysis && latestAnalysis.experienceBullets.length > 0 ? (
                            <span className="text-[10px] font-semibold tabular-nums text-slate-500 sm:ml-1 sm:inline">
                              ({latestAnalysis.experienceBullets.length})
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </div>
                    {latestDraft ? (
                      <p className="text-[11px] text-slate-500">
                        Draft ready · {selectedStudent?.name ?? 'Student'}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="max-h-[min(52vh,560px)] overflow-y-auto p-4">
                  {resumeWorkspaceTab === 'resume' ? (
                    <>
                  <div className="mb-6 space-y-2 border-b border-white/10 pb-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-lime-200/85">
                        Master resume
                      </span>
                      <div className="flex rounded-lg border border-white/10 bg-white/[0.02] p-0.5">
                        <button
                          type="button"
                          disabled={!latestDraft}
                          onClick={() => {
                            if (resumeEditorMode === 'plain') {
                              setEditableContent((prev) => plainTextResumeToHtml(prev));
                              setResumeEditorMode('visual');
                            }
                          }}
                          className={cn(
                            'rounded-md px-3 py-1.5 text-xs font-bold transition',
                            resumeEditorMode === 'visual'
                              ? 'bg-lime-400/20 text-lime-100'
                              : 'text-slate-400 hover:text-slate-200'
                          )}
                        >
                          Visual
                        </button>
                        <button
                          type="button"
                          disabled={!latestDraft}
                          onClick={() => {
                            if (resumeEditorMode === 'visual') {
                              setEditableContent((prev) =>
                                looksLikeHtml(prev) ? htmlResumeToPlainLines(prev) : prev
                              );
                              setResumeEditorMode('plain');
                            }
                          }}
                          className={cn(
                            'rounded-md px-3 py-1.5 text-xs font-bold transition',
                            resumeEditorMode === 'plain'
                              ? 'bg-lime-400/20 text-lime-100'
                              : 'text-slate-400 hover:text-slate-200'
                          )}
                        >
                          Plain text
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] leading-snug text-slate-500">
                      Use the other tab to copy <span className="font-semibold text-slate-400">Suggested experience bullets</span>, then paste here. Plain mode matches the file; Visual wraps lines as paragraphs. Match score and gaps are below this split.
                    </p>
                    {latestDraft && resumeEditorMode === 'visual' ? (
                      <ResumeRichEditor
                        key={`${latestDraft.id}-${resumeEditorMode}`}
                        initialContent={editableContent}
                        onChange={setEditableContent}
                        disabled={!latestDraft}
                        placeholder="Edit your resume — use headings and bullet lists to match your final Word layout."
                      />
                    ) : (
                      <textarea
                        value={editableContent}
                        onChange={(e) => setEditableContent(e.target.value)}
                        disabled={!latestDraft}
                        placeholder={
                          latestDraft
                            ? 'Resume text loads here after a scan…'
                            : 'Run a scan (below) to load the master resume here.'
                        }
                        className={cn(
                          adminTheme.textarea,
                          'min-h-[320px] font-mono text-[13px] leading-relaxed text-slate-200 disabled:cursor-not-allowed disabled:opacity-50'
                        )}
                      />
                    )}
                  </div>

                  {latestDraft ? (
                    <div className="mb-4 rounded-xl border border-emerald-400/35 bg-emerald-500/[0.12] p-3 sm:p-4">
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-emerald-200/95">
                        Export this job’s resume (.docx)
                      </p>
                      <p className="mb-3 text-[11px] leading-snug text-emerald-100/85">
                        Saves what is in the editor above, then downloads Word — not the unchanged master file in the
                        strip at the top.
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={onSaveDraftEdits}
                          disabled={!editableContent.trim() || savingDraftEdits}
                          className="rounded-lg border border-white/20 bg-white/[0.07] px-3 py-2 text-xs font-bold text-slate-100 transition hover:bg-white/[0.11] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          {savingDraftEdits ? 'Saving…' : 'Save draft only'}
                        </button>
                        <button
                          type="button"
                          onClick={onDownloadTailoredDocx}
                          disabled={!editableContent.trim() || downloadingTailoredDocx}
                          title={
                            !editableContent.trim()
                              ? 'Editor has no text yet — run a scan or paste content.'
                              : 'Save and download your edited resume as .docx'
                          }
                          className="inline-flex items-center gap-2 rounded-lg border-2 border-emerald-400/50 bg-emerald-500/25 px-3 py-2 text-xs font-black text-emerald-50 shadow-[0_0_20px_-8px_rgba(52,211,153,0.8)] transition hover:bg-emerald-500/35 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-500 disabled:shadow-none"
                        >
                          <Download className="h-4 w-4 shrink-0" />
                          {downloadingTailoredDocx ? 'Preparing file…' : 'Download edited .docx'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mb-4 rounded-lg border border-dashed border-white/15 bg-white/[0.02] px-3 py-3 text-center text-[11px] text-slate-500">
                      Run <span className="font-semibold text-slate-400">Run scan</span> below to create a draft — then
                      you can save and download your edits as .docx.
                    </p>
                  )}

                  {latestAnalysis ? (
                    <div className="mb-4 rounded-2xl border border-sky-400/25 bg-sky-500/[0.06] p-4 text-xs leading-relaxed text-slate-300">
                      <p className="font-bold text-sky-100">Points to add / how this scan helps</p>
                      <ul className="mt-2 list-disc space-y-1.5 pl-4">
                        <li>
                          <span className="font-semibold text-slate-200">Missing / gaps</span> — keyword lists appear{' '}
                          <span className="font-semibold text-white">below this job/resume split</span>. Add those terms in{' '}
                          <span className="font-semibold text-white">Skills</span> and Experience.
                        </li>
                        <li>
                          <span className="font-semibold text-slate-200">Suggested experience bullets</span> — switch to
                          that tab, copy lines, then return here and paste into Experience.
                        </li>
                        <li>
                          <span className="font-semibold text-slate-200">Summary</span> — optional card below; paste near
                          the top if you use a professional summary.
                        </li>
                        <li className="text-slate-400">
                          The master file in Admin → Students is unchanged — only this draft updates when you save.
                        </li>
                      </ul>
                    </div>
                  ) : null}

                  {latestAnalysis?.professionalSummary ? (
                    <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.08] p-4">
                      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-200/90">
                            <Lightbulb className="h-3.5 w-3.5" />
                            Suggested summary (optional)
                          </div>
                          <p className="mt-1 text-[11px] text-emerald-200/75">
                            Where: <span className="font-semibold text-emerald-100">Professional Summary</span>{' '}
                            (or your profile blurb at the top).
                          </p>
                        </div>
                        <CopyTextButton text={latestAnalysis.professionalSummary} label="Copy summary" />
                      </div>
                      <p className="text-sm leading-relaxed text-emerald-50/95">
                        {latestAnalysis.professionalSummary}
                      </p>
                    </div>
                  ) : null}

                  {latestAnalysis && latestAnalysis.projectSuggestions.length > 0 ? (
                    <div className="mb-4">
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Project ideas
                      </h3>
                      <p className="mb-3 text-[11px] text-slate-500">
                        Where: <span className="font-semibold text-slate-300">Projects</span> or{' '}
                        <span className="font-semibold text-slate-300">Additional experience</span> if your resume
                        has that section.
                      </p>
                      <div className="space-y-2">
                        {latestAnalysis.projectSuggestions.map((project) => (
                          <div
                            key={project.title}
                            className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <p className="font-semibold text-white">{project.title}</p>
                              <CopyTextButton
                                text={`${project.title}\n${project.description}`}
                                label="Copy"
                              />
                            </div>
                            <p className="mt-1 text-sm text-slate-400">{project.description}</p>
                            {project.keywords.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {project.keywords.map((kw) => (
                                  <span
                                    key={kw}
                                    className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-400"
                                  >
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {latestAnalysis?.notes?.length ? (
                    <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/5 p-3 text-sm text-amber-100/90">
                      <p className="text-xs font-bold uppercase tracking-wide text-amber-200/80">
                        Scanner notes
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-100/80">
                        {latestAnalysis.notes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                    </>
                  ) : (
                    <>
                      <div className="mb-4 rounded-xl border border-violet-400/25 bg-violet-500/[0.12] p-4 text-[11px] leading-relaxed text-violet-100/95">
                        <p>
                          Copy bullets below, then tap{' '}
                          <button
                            type="button"
                            onClick={() => setResumeWorkspaceTab('resume')}
                            className="font-bold text-white underline decoration-white/35 underline-offset-2 hover:decoration-white"
                          >
                            Resume (editable export)
                          </button>{' '}
                          to paste into the master resume.
                        </p>
                      </div>

                      {latestAnalysis ? (
                        <>
                          <div className="mb-4">
                            <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                              <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
                              Suggested experience bullets
                            </h3>
                            <p className="mb-3 text-[11px] text-slate-500">
                              Each line is for you to copy — nothing is pasted into the resume automatically.
                            </p>
                            {latestAnalysis.experienceBullets.length === 0 ? (
                              <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-center text-xs text-slate-500">
                                No bullets from the last scan. Use &quot;Refine experience bullets&quot; below to
                                request a set.
                              </p>
                            ) : (
                              <ul className="space-y-2">
                                {latestAnalysis.experienceBullets.map((point, index) => (
                                  <li
                                    key={`${point.text}-${index}`}
                                    className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-slate-200"
                                  >
                                    <p className="text-[11px] text-slate-500">
                                      Where: <span className="font-semibold text-slate-300">Experience</span>
                                      <span className="text-slate-600"> · </span>
                                      {experienceWhereDescription(point)}
                                    </p>
                                    <p className="mt-2">{point.text}</p>
                                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                      <div className="flex flex-wrap gap-1.5">
                                        {point.needsUserInput ? (
                                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                                            <AlertTriangle className="h-3 w-3" />
                                            Verify facts before using
                                          </span>
                                        ) : null}
                                      </div>
                                      <CopyTextButton text={point.text} label="Copy bullet" />
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <div className="mb-4 rounded-2xl border border-violet-400/25 bg-violet-500/[0.06] p-4">
                            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-violet-200/90">
                              <MessageSquare className="h-3.5 w-3.5" />
                              Refine experience bullets
                            </div>
                            <p className="mb-3 text-[11px] leading-relaxed text-slate-400">
                              Ask for a fresh set (e.g. shorter, more metrics). Only this list updates — paste into the
                              resume from the other tab.
                            </p>
                            <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-[#070b10]/80 p-3 text-xs">
                              {bulletChatMessages.length === 0 ? (
                                <p className="text-slate-500">
                                  Describe how you want different bullets, then send.
                                </p>
                              ) : (
                                bulletChatMessages.map((m, i) => (
                                  <div
                                    key={`${m.role}-${i}-${m.content.slice(0, 24)}`}
                                    className={cn(
                                      'rounded-lg px-2.5 py-2',
                                      m.role === 'user'
                                        ? 'ml-4 border border-white/10 bg-white/[0.04] text-slate-200'
                                        : 'mr-4 border border-violet-400/20 bg-violet-500/10 text-violet-100/95'
                                    )}
                                  >
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                      {m.role === 'user' ? 'You' : 'Assistant'}
                                    </span>
                                    <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
                                  </div>
                                ))
                              )}
                              <div ref={bulletChatEndRef} />
                            </div>
                            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                              <label className={cn(adminTheme.fieldLabel, 'flex-1')}>
                                <span className="text-slate-500">Your feedback</span>
                                <textarea
                                  value={bulletChatInput}
                                  onChange={(e) => setBulletChatInput(e.target.value)}
                                  disabled={!latestDraft || bulletChatLoading || generating}
                                  placeholder="e.g. Make bullets shorter and add one about cross-team collaboration…"
                                  rows={2}
                                  className={cn(adminTheme.textarea, 'min-h-0 resize-y text-sm')}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={onSendBulletChat}
                                disabled={
                                  !latestDraft ||
                                  !bulletChatInput.trim() ||
                                  bulletChatLoading ||
                                  generating ||
                                  !latestAnalysis
                                }
                                className={cn(
                                  adminTheme.buttonPrimary,
                                  'inline-flex shrink-0 items-center justify-center gap-2 self-stretch sm:self-auto'
                                )}
                              >
                                <SendHorizontal className="h-4 w-4" />
                                {bulletChatLoading ? 'Regenerating…' : 'Regenerate bullets'}
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-10 text-center text-sm text-slate-500">
                          Run a scan to see suggested experience bullets.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Primary actions sit under job/resume (not below long scan results) */}
            <div className="flex flex-col gap-3 border-t border-white/10 bg-[#090d12]/95 p-4 backdrop-blur-md sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onGenerateResume}
                  disabled={!canScan || generating}
                  className={adminTheme.buttonPrimary}
                >
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {generating ? 'Scanning…' : 'Run scan (Jobscan)'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onSaveDraftEdits}
                  disabled={!latestDraft || !editableContent.trim() || savingDraftEdits}
                  className={cn(
                    'rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2.5 text-sm font-bold text-slate-100 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-45'
                  )}
                >
                  {savingDraftEdits ? 'Saving…' : 'Save resume'}
                </button>
                {latestDraft ? (
                  <button
                    type="button"
                    onClick={onDownloadTailoredDocx}
                    disabled={!editableContent.trim() || downloadingTailoredDocx}
                    title="Saves your editor text to this job draft, then downloads .docx"
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-400/45 bg-emerald-500/20 px-4 py-2.5 text-sm font-black text-emerald-50 shadow-[0_0_24px_-10px_rgba(52,211,153,0.85)] transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:border-white/15 disabled:bg-white/[0.05] disabled:font-bold disabled:text-slate-500 disabled:shadow-none"
                  >
                    <Download className="h-4 w-4" />
                    {downloadingTailoredDocx ? 'Preparing…' : 'Download edited .docx'}
                  </button>
                ) : (
                  <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-slate-500">
                    Download appears after you run a scan.
                  </span>
                )}
              </div>
              <p className="max-w-md text-xs leading-snug text-slate-400">
                Same <span className="font-semibold text-slate-300">Download edited .docx</span> also lives under the
                resume editor. It is not the &quot;Original master&quot; button at the top.
              </p>
            </div>

            {feedback ? (
              <div
                className={cn(
                  'border-t border-white/10 px-5 py-3 text-sm',
                  /fail|error|invalid|unable|missing|could not/i.test(feedback)
                    ? 'bg-rose-500/10 text-rose-100'
                    : 'bg-emerald-500/10 text-emerald-100'
                )}
              >
                {feedback}
              </div>
            ) : null}

            {/* Scan results — scroll target after Run scan */}
            <div
              ref={scanResultsRef}
              className="scroll-mt-28 border-t border-white/10 bg-white/[0.02]"
            >
              {generating ? (
                <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                  <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-lime-400/20" />
                  <div>
                    <p className="text-sm font-semibold text-white">Scanning resume…</p>
                    <p className="text-xs text-slate-500">
                      Comparing the master resume to this job description. This usually takes a few seconds.
                    </p>
                  </div>
                </div>
              ) : null}

              {!generating && latestAnalysis ? (
                <>
                  <div className="border-b border-white/10 bg-gradient-to-r from-emerald-500/[0.06] via-transparent to-transparent p-5">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <MatchScoreRing
                        score={latestAnalysis.matchScore}
                        label="ATS-style match estimate"
                      />
                      <div className="grid w-full max-w-xl grid-cols-3 gap-3 text-center">
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                          <p className="text-lg font-black text-rose-200 tabular-nums">
                            {latestAnalysis.missingSkills.length}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            Gaps
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                          <p className="text-lg font-black text-emerald-200 tabular-nums">
                            {latestAnalysis.suggestedSkills.length}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            Add-ons
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                          <p className="text-lg font-black text-sky-200 tabular-nums">
                            {latestAnalysis.atsKeywordsUsed.length}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            JD terms
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
                    <KeywordChips
                      title="Missing / gaps"
                      hint="Compared to this job description: these are weak or missing in the resume text. Add them in Skills and/or relevant Experience bullets."
                      items={latestAnalysis.missingSkills}
                      variant="missing"
                    />
                    <KeywordChips
                      title="Suggested to add"
                      hint="Stronger phrasing or skills to consider. Place where they fit naturally (Skills, Summary, or bullets)."
                      items={latestAnalysis.suggestedSkills}
                      variant="suggested"
                    />
                    <KeywordChips
                      title="Terms from posting"
                      hint="Keywords pulled from the job posting. Mirror them where truthful in your resume."
                      items={latestAnalysis.atsKeywordsUsed}
                      variant="ats"
                    />
                  </div>
                </>
              ) : null}

              {!generating && !latestAnalysis ? (
                <div className="px-5 py-4 text-sm text-slate-500">
                  No scan yet. Choose a job and student with a master resume, then tap Run scan.
                </div>
              ) : null}
            </div>
          </section>

          {/* Log application */}
          <section className={cn(adminTheme.surface, 'overflow-hidden')}>
            <div className={cn(adminTheme.sectionHeader, 'px-6 py-4')}>
              <h2 className="text-lg font-black text-white">After you apply</h2>
              <p className="mt-0.5 text-xs text-slate-500">Log the application for records.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
              <label className={adminTheme.fieldLabel}>
                Applied on
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
                  placeholder="Optional"
                />
              </label>
              <div className="md:col-span-3">
                <button
                  type="button"
                  onClick={onSaveAppliedRecord}
                  disabled={!selectedJob || !selectedStudent || !latestDraft || savingRecord}
                  className={adminTheme.buttonPrimary}
                >
                  {savingRecord ? 'Saving…' : 'Save applied record'}
                </button>
                <p className="mt-2 text-xs text-slate-500">
                  Status messages appear in the banner above <strong className="text-slate-400">Run scan</strong>.
                </p>
              </div>
            </div>
          </section>
        </div>
      </DashboardLayout>
    </RoleGate>
  );
}
