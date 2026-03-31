'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import RoleGate from '@/components/RoleGate';
import { MOCK_STUDENTS } from '@/lib/mock-data';
import { loadAdminApplications, type AdminApplicationRecord } from '@/lib/admin/applications-store';
import {
  loadStudentAppliedJobs,
  saveStudentAppliedJobs,
  type StudentAppliedJobRecord,
} from '@/lib/admin/student-applied-jobs-store';
import { GraduationCap, Paperclip, Plus, Search, X } from 'lucide-react';

const ROLE_CATEGORIES = [
  'Software Engineering',
  'Data Roles',
  'AI/Machine Learning',
  'Cloud/DevOps',
  'QA/Testing',
  'Business/Product',
  'Cybersecurity',
  'Design',
] as const;

type RoleCategory = (typeof ROLE_CATEGORIES)[number];

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function toDateInputValue(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function classifyStudentRole(student: (typeof MOCK_STUDENTS)[number]): RoleCategory {
  const skillText = Object.entries(student.baseResume?.technicalSkills || {})
    .map(([k, v]) => `${k} ${(v || []).join(' ')}`)
    .join(' ')
    .toLowerCase();

  const corpus = `${student.major} ${student.baseResume?.headline || ''} ${skillText}`.toLowerCase();
  const has = (re: RegExp) => re.test(corpus);

  if (has(/\b(cyber|security|cybersecurity|siem|soc|pentest|vulnerability)\b/)) return 'Cybersecurity';
  if (has(/\b(ui|ux|design|figma|prototype|product designer|interaction)\b/)) return 'Design';
  if (has(/\b(qa|testing|test automation|manual tester|sdet|software test)\b/)) return 'QA/Testing';
  if (has(/\b(cloud|devops|aws|gcp|azure|kubernetes|docker|platform engineer|sre)\b/)) return 'Cloud/DevOps';
  if (has(/\b(product manager|project manager|program manager|operations analyst|business operations)\b/)) return 'Business/Product';
  if (has(/\b(ai|ml|machine learning|nlp|computer vision|deep learning)\b/)) return 'AI/Machine Learning';
  if (has(/\b(data analyst|data scientist|data engineer|analytics|bi|business intelligence|sql)\b/)) return 'Data Roles';
  return 'Software Engineering';
}

export default function AdminStudentsPage() {
  const [applications, setApplications] = React.useState<AdminApplicationRecord[]>([]);
  const [appliedJobs, setAppliedJobs] = React.useState<StudentAppliedJobRecord[]>([]);
  const [search, setSearch] = React.useState('');
  const [selectedRoleCategory, setSelectedRoleCategory] = React.useState<RoleCategory>('Software Engineering');
  const [activeStudentId, setActiveStudentId] = React.useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = React.useState('');
  const [resumeFileName, setResumeFileName] = React.useState('');
  const [resumeFileDataUrl, setResumeFileDataUrl] = React.useState('');
  const [resumeMimeType, setResumeMimeType] = React.useState('');
  const [appliedOn, setAppliedOn] = React.useState(toDateInputValue(new Date()));

  React.useEffect(() => {
    const sync = () => setApplications(loadAdminApplications());
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  React.useEffect(() => {
    setAppliedJobs(loadStudentAppliedJobs());
  }, []);

  React.useEffect(() => {
    saveStudentAppliedJobs(appliedJobs);
  }, [appliedJobs]);

  const activeStudent = React.useMemo(
    () => MOCK_STUDENTS.find((s) => s.studentId === activeStudentId) || null,
    [activeStudentId]
  );

  const modalApplications = React.useMemo(() => {
    if (!activeStudentId) return [];
    const assigned = applications.filter((a) => a.studentId === activeStudentId);
    if (assigned.length > 0) return assigned;
    return applications;
  }, [activeStudentId, applications]);

  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const allRows = MOCK_STUDENTS
      .map((student) => {
        const assigned = appliedJobs
          .filter((a) => a.studentId === student.studentId)
          .sort((a, b) => b.createdAt - a.createdAt);
        return { student, assigned, roleCategory: classifyStudentRole(student) };
      })
      .filter((entry) => {
        if (!q) return true;
        return `${entry.student.name} ${entry.student.email} ${entry.student.studentId}`.toLowerCase().includes(q);
      });

    const grouped: Record<RoleCategory, typeof allRows> = {
      'Software Engineering': [],
      'Data Roles': [],
      'AI/Machine Learning': [],
      'Cloud/DevOps': [],
      'QA/Testing': [],
      'Business/Product': [],
      Cybersecurity: [],
      Design: [],
    };

    for (const row of allRows) grouped[row.roleCategory].push(row);
    return grouped;
  }, [appliedJobs, search]);

  const openAddAppliedJob = (studentId: string) => {
    setActiveStudentId(studentId);
    const preferred = applications.find((a) => a.studentId === studentId) || applications[0];
    setSelectedApplicationId(preferred?.id || '');
    setResumeFileName('');
    setResumeFileDataUrl('');
    setResumeMimeType('');
    setAppliedOn(toDateInputValue(new Date()));
  };

  const closeModal = () => {
    setActiveStudentId(null);
    setSelectedApplicationId('');
    setResumeFileName('');
    setResumeFileDataUrl('');
    setResumeMimeType('');
  };

  const onResumeFileChange = (file: File | null) => {
    if (!file) {
      setResumeFileName('');
      setResumeFileDataUrl('');
      setResumeMimeType('');
      return;
    }

    // Keep localStorage payload reasonable.
    if (file.size > 2 * 1024 * 1024) {
      window.alert('Please upload a file smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setResumeFileName(file.name);
      setResumeFileDataUrl(result);
      setResumeMimeType(file.type || 'application/octet-stream');
    };
    reader.readAsDataURL(file);
  };

  const saveAppliedJob = () => {
    if (!activeStudent) return;
    if (!selectedApplicationId || !resumeFileName || !resumeFileDataUrl || !/^\d{4}-\d{2}-\d{2}$/.test(appliedOn)) return;
    const picked = applications.find((a) => a.id === selectedApplicationId);
    if (!picked) return;

    const nextRecord: StudentAppliedJobRecord = {
      id: uid(),
      studentId: activeStudent.studentId,
      studentName: activeStudent.name,
      applicationId: picked.id,
      companyName: picked.companyName,
      jobTitle: picked.jobTitle,
      category: picked.category,
      subcategory: picked.subcategory,
      appliedOn,
      resumeFileName,
      resumeFileDataUrl,
      resumeMimeType,
      createdAt: Date.now(),
    };

    setAppliedJobs((current) => [nextRecord, ...current]);
    closeModal();
  };

  return (
    <RoleGate expectedRole="admin">
      <DashboardLayout>
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500">Admin Workspace</p>
            <h1 className="mt-2 text-2xl md:text-3xl font-display font-black text-slate-900">Students</h1>
            <p className="mt-2 text-sm text-slate-500 max-w-2xl">
              View each student and the applications assigned to them from the Jobs panel.
            </p>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-slate-700" />
                <h2 className="text-lg font-bold text-slate-900">Student Assignments</h2>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-xs font-semibold text-slate-600">
                  Category
                  <select
                    value={selectedRoleCategory}
                    onChange={(e) => setSelectedRoleCategory(e.target.value as RoleCategory)}
                    className="ml-2 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700"
                  >
                    {ROLE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search students..."
                    className="w-72 pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-teal-600/25"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {(() => {
                const categoryRows = rows[selectedRoleCategory];
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-slate-900">{selectedRoleCategory}</h3>
                      <span className="text-xs font-bold text-slate-500">{categoryRows.length} students</span>
                    </div>
                    {categoryRows.length === 0 && (
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                        No students found in this category.
                      </div>
                    )}
                    {categoryRows.map(({ student, assigned }) => (
                      <div key={student.studentId} className="rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-extrabold text-slate-900">{student.name}</p>
                            <p className="text-xs text-slate-500">{student.email} • Graduation {student.graduationYear}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-500">{assigned.length} applied jobs</span>
                            <button
                              onClick={() => openAddAppliedJob(student.studentId)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 text-white px-3 py-1.5 text-xs font-extrabold hover:bg-black"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add Applied Job
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-white">
                                <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-bold">Company</th>
                                <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-bold">Job Title</th>
                                <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-bold">Category</th>
                                <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-bold">Applied On</th>
                                <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-bold">Resume Used</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {assigned.map((app) => (
                                <tr key={app.id} className="hover:bg-slate-50/70">
                                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{app.companyName}</td>
                                  <td className="px-4 py-3 text-sm text-slate-700">{app.jobTitle}</td>
                                  <td className="px-4 py-3 text-sm text-slate-700">{app.category} / {app.subcategory}</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">{app.appliedOn}</td>
                                  <td className="px-4 py-3 text-sm text-slate-700">
                                    {app.resumeFileDataUrl && app.resumeFileName ? (
                                      <a
                                        href={app.resumeFileDataUrl}
                                        download={app.resumeFileName}
                                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100"
                                      >
                                        <Paperclip className="w-3.5 h-3.5" />
                                        {app.resumeFileName}
                                      </a>
                                    ) : (
                                      app.resumeUsed || '—'
                                    )}
                                  </td>
                                </tr>
                              ))}
                              {assigned.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="px-4 py-6 text-sm text-center text-slate-500">
                                    No applied jobs recorded yet.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </section>

          {activeStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <div className="w-full max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Add Applied Job</h3>
                    <p className="text-xs text-slate-500 mt-1">Student: {activeStudent.name}</p>
                  </div>
                  <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="text-xs font-semibold text-slate-600 md:col-span-2">
                    Application / Job
                    <select
                      value={selectedApplicationId}
                      onChange={(e) => setSelectedApplicationId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900"
                    >
                      {modalApplications.length === 0 && <option value="">No saved applications found</option>}
                      {modalApplications.map((app) => (
                        <option key={app.id} value={app.id}>
                          {app.jobTitle} — {app.companyName} ({app.category} / {app.subcategory})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-xs font-semibold text-slate-600">
                    Applied On
                    <input
                      type="date"
                      value={appliedOn}
                      onChange={(e) => setAppliedOn(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900"
                    />
                  </label>

                  <label className="text-xs font-semibold text-slate-600">
                    Resume Attachment
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.rtf"
                      onChange={(e) => onResumeFileChange(e.target.files?.[0] || null)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      {resumeFileName ? `Attached: ${resumeFileName}` : 'Attach the resume used for this application (max 2MB).'}
                    </p>
                  </label>
                </div>

                <div className="mt-6 flex gap-3">
                  <button onClick={closeModal} className="flex-1 rounded-xl bg-slate-100 py-2.5 font-bold text-slate-700 hover:bg-slate-200">
                    Cancel
                  </button>
                  <button
                    onClick={saveAppliedJob}
                    disabled={!selectedApplicationId || !resumeFileName || !resumeFileDataUrl || !/^\d{4}-\d{2}-\d{2}$/.test(appliedOn)}
                    className="flex-1 rounded-xl bg-teal-700 py-2.5 font-bold text-white hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Applied Job
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </RoleGate>
  );
}

