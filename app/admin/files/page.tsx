'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import RoleGate from '@/components/RoleGate';
import { adminPremiumUi } from '@/lib/admin/admin-theme';
import { cn } from '@/lib/utils';
import {
  Folder,
  FolderOpen,
  FileText,
  Download,
  Trash2,
  Upload,
  ChevronRight,
  Loader2,
  Users,
} from 'lucide-react';

type FileEntry = {
  url: string;
  pathname: string;
  filename: string;
  uploadedAt: string;
  size: number;
};

type JobFolder = {
  jobFolder: string;
  companyName: string;
  jobTitle: string;
  files: FileEntry[];
};

type StudentFolder = {
  studentEmail: string;
  jobs: JobFolder[];
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function AdminFilesPage() {
  const [students, setStudents] = React.useState<StudentFolder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedStudent, setSelectedStudent] = React.useState<string | null>(null);
  const [openJobs, setOpenJobs] = React.useState<Set<string>>(new Set());
  const [deleting, setDeleting] = React.useState<string | null>(null);

  // Upload state
  const [uploadStudent, setUploadStudent] = React.useState('');
  const [uploadCompany, setUploadCompany] = React.useState('');
  const [uploadJob, setUploadJob] = React.useState('');
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [showUpload, setShowUpload] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/files', { credentials: 'include' });
      const data = await res.json();
      setStudents(data.students ?? []);
      if (data.students?.length > 0 && !selectedStudent) {
        setSelectedStudent(data.students[0].studentEmail);
      }
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load().catch(() => setLoading(false)); }, []);

  const activeStudent = students.find((s) => s.studentEmail === selectedStudent);

  const toggleJob = (key: string) => {
    setOpenJobs((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleDelete = async (url: string) => {
    if (!confirm('Delete this file? This cannot be undone.')) return;
    setDeleting(url);
    try {
      await fetch('/api/admin/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url }),
      });
      await load();
    } finally {
      setDeleting(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadStudent || !uploadCompany || !uploadJob) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', uploadFile);
      form.append('studentEmail', uploadStudent);
      form.append('companyName', uploadCompany);
      form.append('jobTitle', uploadJob);
      await fetch('/api/admin/files', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      setUploadStudent('');
      setUploadCompany('');
      setUploadJob('');
      setUploadFile(null);
      setShowUpload(false);
      await load();
    } finally {
      setUploading(false);
    }
  };

  const totalFiles = students.reduce(
    (sum, s) => sum + s.jobs.reduce((j, jf) => j + jf.files.length, 0),
    0
  );

  return (
    <RoleGate expectedRole="admin">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Hero */}
          <section className={adminPremiumUi.hero}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-200/80">
              File Manager
            </p>
            <h1 className="mt-2 text-3xl font-display font-black tracking-tight text-white md:text-4xl">
              Resume Files
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-300">
              All tailored resumes auto-saved here when downloaded. Browse by student and job role.
            </p>
          </section>

          {/* Stats + Upload button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Users className="w-4 h-4 text-lime-400" />
                <span><span className="font-bold text-white">{students.length}</span> students</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <FileText className="w-4 h-4 text-lime-400" />
                <span><span className="font-bold text-white">{totalFiles}</span> files</span>
              </div>
            </div>
            <button
              onClick={() => setShowUpload((v) => !v)}
              className="flex items-center gap-2 rounded-lg bg-lime-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-lime-300 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload File
            </button>
          </div>

          {/* Upload Panel */}
          {showUpload && (
            <div className={cn(adminPremiumUi.surface, 'p-6 space-y-4')}>
              <h3 className="font-bold text-white">Upload a Resume File</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className={adminPremiumUi.fieldLabel}>
                  Student Email
                  <input
                    type="email"
                    value={uploadStudent}
                    onChange={(e) => setUploadStudent(e.target.value)}
                    placeholder="student@email.com"
                    className={adminPremiumUi.input}
                  />
                </label>
                <label className={adminPremiumUi.fieldLabel}>
                  Company Name
                  <input
                    type="text"
                    value={uploadCompany}
                    onChange={(e) => setUploadCompany(e.target.value)}
                    placeholder="Stripe"
                    className={adminPremiumUi.input}
                  />
                </label>
                <label className={adminPremiumUi.fieldLabel}>
                  Job Title
                  <input
                    type="text"
                    value={uploadJob}
                    onChange={(e) => setUploadJob(e.target.value)}
                    placeholder="Software Engineer"
                    className={adminPremiumUi.input}
                  />
                </label>
              </div>
              <div
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 p-8 cursor-pointer hover:border-lime-400/50 transition-colors"
              >
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-sm text-slate-300">
                  {uploadFile ? uploadFile.name : 'Click to select a .docx file'}
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowUpload(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !uploadFile || !uploadStudent || !uploadCompany || !uploadJob}
                  className="flex items-center gap-2 rounded-lg bg-lime-400 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-lime-300 disabled:opacity-50 transition-colors"
                >
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Upload
                </button>
              </div>
            </div>
          )}

          {/* File Browser */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Student list — left panel */}
            <div className={cn(adminPremiumUi.surface, 'lg:col-span-1 overflow-hidden')}>
              <div className={cn(adminPremiumUi.sectionHeader, 'px-4 py-3')}>
                <p className="text-sm font-bold text-white">Students</p>
              </div>
              {loading ? (
                <div className="p-6 flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-lime-400" />
                </div>
              ) : students.length === 0 ? (
                <p className="p-6 text-sm text-slate-400 text-center">No files yet.</p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {students.map((s) => {
                    const fileCount = s.jobs.reduce((n, j) => n + j.files.length, 0);
                    const isActive = selectedStudent === s.studentEmail;
                    return (
                      <li key={s.studentEmail}>
                        <button
                          onClick={() => {
                            setSelectedStudent(s.studentEmail);
                            setOpenJobs(new Set());
                          }}
                          className={cn(
                            'w-full text-left px-4 py-3 flex items-center gap-3 transition-colors',
                            isActive
                              ? 'bg-lime-400/10 border-l-2 border-lime-400'
                              : 'hover:bg-white/5 border-l-2 border-transparent'
                          )}
                        >
                          <Folder className={cn('w-4 h-4 shrink-0', isActive ? 'text-lime-400' : 'text-slate-400')} />
                          <div className="min-w-0">
                            <p className={cn('text-xs font-semibold truncate', isActive ? 'text-lime-300' : 'text-slate-200')}>
                              {s.studentEmail}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {s.jobs.length} job{s.jobs.length !== 1 ? 's' : ''} · {fileCount} file{fileCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Job folders + files — right panel */}
            <div className={cn(adminPremiumUi.surface, 'lg:col-span-3 overflow-hidden')}>
              <div className={cn(adminPremiumUi.sectionHeader, 'px-6 py-3')}>
                <p className="text-sm font-bold text-white">
                  {activeStudent ? activeStudent.studentEmail : 'Select a student'}
                </p>
              </div>

              {!activeStudent ? (
                <div className="p-12 text-center text-slate-400 text-sm">
                  Select a student on the left to view their files.
                </div>
              ) : activeStudent.jobs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">
                  No files for this student yet.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {activeStudent.jobs.map((job) => {
                    const key = job.jobFolder;
                    const isOpen = openJobs.has(key);
                    return (
                      <div key={key}>
                        {/* Job folder row */}
                        <button
                          onClick={() => toggleJob(key)}
                          className="w-full flex items-center gap-3 px-6 py-4 hover:bg-white/5 transition-colors"
                        >
                          {isOpen
                            ? <FolderOpen className="w-5 h-5 text-lime-400 shrink-0" />
                            : <Folder className="w-5 h-5 text-slate-400 shrink-0" />
                          }
                          <div className="flex-1 text-left">
                            <p className="text-sm font-semibold text-slate-100 capitalize">
                              {job.companyName}
                            </p>
                            <p className="text-xs text-slate-400 capitalize">{job.jobTitle}</p>
                          </div>
                          <span className="text-xs text-slate-500">
                            {job.files.length} file{job.files.length !== 1 ? 's' : ''}
                          </span>
                          <ChevronRight className={cn('w-4 h-4 text-slate-500 transition-transform', isOpen && 'rotate-90')} />
                        </button>

                        {/* Files inside folder */}
                        {isOpen && (
                          <div className="bg-white/[0.02] divide-y divide-white/5">
                            {job.files.map((file) => (
                              <div
                                key={file.url}
                                className="flex items-center gap-4 px-8 py-3"
                              >
                                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-200 truncate">
                                    {file.filename}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {formatDate(file.uploadedAt)} · {formatBytes(file.size)}
                                  </p>
                                </div>
                                <a
                                  href={file.url}
                                  download={file.filename}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 rounded-lg border border-lime-400/40 px-3 py-1.5 text-xs font-semibold text-lime-300 hover:bg-lime-400/10 transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Download
                                </a>
                                <button
                                  onClick={() => handleDelete(file.url)}
                                  disabled={deleting === file.url}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 transition-colors disabled:opacity-50"
                                >
                                  {deleting === file.url
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <Trash2 className="w-4 h-4" />
                                  }
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RoleGate>
  );
}
