'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import RoleGate from '@/components/RoleGate';
import { MOCK_STUDENTS } from '@/lib/mock-data';
import { type AdminApplicationRecord } from '@/lib/admin/applications-store';
import { loadStudentAppliedJobs, type StudentAppliedJobRecord } from '@/lib/admin/student-applied-jobs-store';
import { Database, Search, Users } from 'lucide-react';
import type { StudentOnboardingSubmission } from '@/lib/admin/student-onboarding-store';
import { adminPremiumUi } from '@/lib/admin/admin-theme';
import { cn } from '@/lib/utils';
import { classifyStudentRole } from '@/lib/admin/role-classification';
import { apiFetchJson } from '@/lib/client/api';

type MasterResumeResponse = {
  id: string;
  studentEmail: string;
  fileName: string;
  mimeType: string;
  fileDataUrl: string;
  extractedText: string;
};

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

export default function AdminStudentsPage() {
  const [applications, setApplications] = React.useState<AdminApplicationRecord[]>([]);
  const [appliedJobs, setAppliedJobs] = React.useState<StudentAppliedJobRecord[]>([]);
  const [onboardingSubmissions, setOnboardingSubmissions] = React.useState<StudentOnboardingSubmission[]>([]);
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<RoleCategory | 'all'>('all');
  const [selectedStudentId, setSelectedStudentId] = React.useState<string>('');
  const [masterResume, setMasterResume] = React.useState<MasterResumeResponse | null>(null);
  const [masterResumeStatus, setMasterResumeStatus] = React.useState('');
  const [masterResumeSaving, setMasterResumeSaving] = React.useState(false);

  React.useEffect(() => {
    const loadJobs = async () => {
      const data = await apiFetchJson<{ jobs: AdminApplicationRecord[] }>('/api/admin/jobs');
      setApplications(Array.isArray(data.jobs) ? data.jobs : []);
    };
    loadJobs().catch(() => setApplications([]));
  }, []);

  React.useEffect(() => {
    setAppliedJobs(loadStudentAppliedJobs());
  }, []);

  React.useEffect(() => {
    const loadOnboardingSubmissions = async () => {
      try {
        const data = await apiFetchJson<{ submissions: StudentOnboardingSubmission[] }>(
          '/api/student/onboarding?scope=all'
        );
        setOnboardingSubmissions(Array.isArray(data.submissions) ? data.submissions : []);
      } catch {
        setOnboardingSubmissions([]);
      }
    };
    loadOnboardingSubmissions().catch(() => setOnboardingSubmissions([]));
  }, []);

  const studentRows = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOCK_STUDENTS.map((student) => {
      const roleCategory = classifyStudentRole(student);
      const assignedJobs = applications.filter((a) => a.studentId === student.studentId);
      const appliedRecords = appliedJobs
        .filter((a) => a.studentId === student.studentId)
        .sort((a, b) => b.createdAt - a.createdAt);
      const onboarding = onboardingSubmissions.find((submission) => {
        const submittedBy = submission.submittedByEmail?.toLowerCase() || '';
        const resumeEmail = submission.resumeEmail?.toLowerCase() || '';
        const studentEmail = student.email.toLowerCase();
        return submittedBy === studentEmail || resumeEmail === studentEmail;
      }) || null;

      return {
        student,
        roleCategory,
        assignedJobs,
        appliedRecords,
        onboarding,
      };
    }).filter((row) => {
      if (roleFilter !== 'all' && row.roleCategory !== roleFilter) return false;
      if (!q) return true;
      return `${row.student.name} ${row.student.email} ${row.student.major}`
        .toLowerCase()
        .includes(q);
    });
  }, [applications, appliedJobs, onboardingSubmissions, roleFilter, search]);

  React.useEffect(() => {
    if (studentRows.length === 0) {
      setSelectedStudentId('');
      return;
    }
    if (!studentRows.some((row) => row.student.studentId === selectedStudentId)) {
      setSelectedStudentId(studentRows[0].student.studentId);
    }
  }, [selectedStudentId, studentRows]);

  const selectedRow = React.useMemo(
    () => studentRows.find((row) => row.student.studentId === selectedStudentId) || null,
    [selectedStudentId, studentRows]
  );

  React.useEffect(() => {
    const loadMasterResume = async () => {
      if (!selectedRow?.student.email) {
        setMasterResume(null);
        return;
      }
      try {
        const data = await apiFetchJson<{ resume: MasterResumeResponse | null }>(
          `/api/admin/master-resumes?studentEmail=${encodeURIComponent(selectedRow.student.email)}`
        );
        const resume = (data.resume || null) as MasterResumeResponse | null;
        setMasterResume(resume);
      } catch {
        setMasterResume(null);
      }
    };
    loadMasterResume().catch(() => {
      setMasterResume(null);
    });
  }, [selectedRow?.student.email]);

  const onUploadMasterResume = async (file: File | null) => {
    if (!file || !selectedRow) return;
    setMasterResumeStatus('');
    setMasterResumeSaving(true);
    try {
      const fileDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const extractedText = file.type.startsWith('text/') ? await file.text() : '';

      const data = await apiFetchJson<{ resume: MasterResumeResponse | null }>(
        '/api/admin/master-resumes',
        {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedRow.student.studentId,
          studentName: selectedRow.student.name,
          studentEmail: selectedRow.student.email,
          fileName: file.name,
          mimeType: file.type,
          fileDataUrl,
          extractedText,
        }),
      }
      );

      const resume = (data.resume || null) as MasterResumeResponse | null;
      setMasterResume(resume);
      setMasterResumeStatus('Master resume uploaded.');
    } catch (error) {
      setMasterResumeStatus(error instanceof Error ? error.message : 'Failed to upload master resume.');
    } finally {
      setMasterResumeSaving(false);
    }
  };

  return (
    <RoleGate expectedRole="admin">
      <DashboardLayout>
        <div className="space-y-6">
          <section className={adminPremiumUi.hero}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-200/80">Admin Workspace</p>
            <h1 className="mt-2 text-3xl font-display font-black tracking-tight md:text-4xl text-white">Student Database</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-300 md:text-base">
              Centralized student records with academic profile, role category, assigned jobs, and application history.
            </p>
          </section>

          <section className={cn(adminPremiumUi.surface, 'overflow-hidden')}>
            <div className={cn(adminPremiumUi.sectionHeader, 'px-6 py-5')}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-lime-200" />
                  <h2 className="text-xl font-black text-white">Student Records</h2>
                </div>
                <p className="text-sm font-semibold text-slate-300">
                  Active Students: <span className="text-white">{studentRows.length}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-0 lg:grid-cols-5">
              <div className="border-r border-white/10 lg:col-span-3">
                <div className="border-b border-white/10 bg-white/[0.02] p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="relative md:col-span-2">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email, major..."
                        className="w-full rounded-xl border border-white/15 bg-white/[0.03] py-2 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-lime-300/45 focus:ring-2 focus:ring-lime-300/20"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as RoleCategory | 'all')}
                        className="w-full rounded-xl border border-white/15 bg-[#0e1621] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-lime-300/45 focus:ring-2 focus:ring-lime-300/20"
                      >
                        <option value="all">All Roles</option>
                        {ROLE_CATEGORIES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className={adminPremiumUi.tableWrap}>
                  <table className="w-full text-left">
                    <thead>
                      <tr className={adminPremiumUi.tableHeadRow}>
                        <th className={adminPremiumUi.tableHeadCell}>Student</th>
                        <th className={adminPremiumUi.tableHeadCell}>Role</th>
                        <th className={adminPremiumUi.tableHeadCell}>Graduation</th>
                        <th className={adminPremiumUi.tableHeadCell}>Assigned</th>
                        <th className={adminPremiumUi.tableHeadCell}>Applied</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 bg-transparent">
                      {studentRows.map((row) => {
                        const isSelected = row.student.studentId === selectedStudentId;
                        return (
                          <tr
                            key={row.student.studentId}
                            onClick={() => setSelectedStudentId(row.student.studentId)}
                            className={cn('cursor-pointer transition', isSelected ? 'bg-lime-300/10' : adminPremiumUi.tableRow)}
                          >
                            <td className={adminPremiumUi.tableCell}>
                              <p className="text-sm font-semibold text-slate-100">{row.student.name}</p>
                              <p className="text-xs text-slate-400">{row.student.email}</p>
                            </td>
                            <td className={adminPremiumUi.tableCell}>{row.roleCategory}</td>
                            <td className={adminPremiumUi.tableCell}>{row.student.graduationYear}</td>
                            <td className={cn(adminPremiumUi.tableCell, 'font-semibold text-slate-100')}>{row.assignedJobs.length}</td>
                            <td className={cn(adminPremiumUi.tableCell, 'font-semibold text-slate-100')}>{row.appliedRecords.length}</td>
                          </tr>
                        );
                      })}
                      {studentRows.length === 0 && (
                        <tr>
                          <td colSpan={5} className={adminPremiumUi.emptyState}>
                            No students found for the selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <aside className="bg-transparent lg:col-span-2">
                {!selectedRow ? (
                  <div className="p-6 text-sm text-slate-400">Select a student to view full record.</div>
                ) : (
                  <div className="space-y-5 p-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-lime-200" />
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Student Record</p>
                      </div>
                      <h3 className="mt-2 text-xl font-black text-white">{selectedRow.student.name}</h3>
                      <p className="text-sm text-slate-300">{selectedRow.student.email}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className={cn(adminPremiumUi.surfaceSubtle, 'p-3')}>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Graduation</p>
                        <p className="mt-1 text-sm font-semibold text-slate-100">{selectedRow.student.graduationYear}</p>
                      </div>
                      <div className={cn(adminPremiumUi.surfaceSubtle, 'p-3 col-span-2')}>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Role Bucket</p>
                        <p className="mt-1 text-sm font-semibold text-slate-100">{selectedRow.roleCategory}</p>
                      </div>
                      <div className={cn(adminPremiumUi.surfaceSubtle, 'p-3 col-span-2')}>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Major</p>
                        <p className="mt-1 text-sm font-semibold text-slate-100">{selectedRow.student.major}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Profile Headline</p>
                      <p className={cn(adminPremiumUi.surfaceSubtle, 'mt-2 p-3 text-sm text-slate-300')}>
                        {selectedRow.student.baseResume?.headline || 'No headline available'}
                      </p>
                    </div>

                    <div className={cn(adminPremiumUi.surfaceSubtle, 'space-y-3 rounded-xl p-3')}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Master Resume (Used for Tailoring)
                        </p>
                        {masterResume?.fileName && (
                          <p className="text-[11px] text-slate-400">{masterResume.fileName}</p>
                        )}
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.md,.rtf"
                        onChange={(e) => onUploadMasterResume(e.target.files?.[0] || null)}
                        className={adminPremiumUi.input}
                      />
                      {masterResumeStatus && (
                        <p className="text-xs text-lime-200">{masterResumeStatus}</p>
                      )}
                    </div>

                    <div className={cn(adminPremiumUi.surfaceSubtle, 'rounded-xl')}>
                      <div className="border-b border-white/10 px-3 py-2.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Onboarding Profile</p>
                      </div>
                      {selectedRow.onboarding ? (
                        <div className="space-y-3 p-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className={cn(adminPremiumUi.surfaceSubtle, 'rounded-lg p-2')}>
                              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Preferred Name</p>
                              <p className="mt-1 text-xs font-semibold text-slate-200">{selectedRow.onboarding.preferredName || '-'}</p>
                            </div>
                            <div className={cn(adminPremiumUi.surfaceSubtle, 'rounded-lg p-2')}>
                              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Date of Birth</p>
                              <p className="mt-1 text-xs font-semibold text-slate-200">{selectedRow.onboarding.dateOfBirth || '-'}</p>
                            </div>
                            <div className={cn(adminPremiumUi.surfaceSubtle, 'rounded-lg p-2')}>
                              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Preferred Role</p>
                              <p className="mt-1 text-xs font-semibold text-slate-200">{selectedRow.onboarding.preferredRole || '-'}</p>
                            </div>
                            <div className={cn(adminPremiumUi.surfaceSubtle, 'rounded-lg p-2')}>
                              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Visa Status</p>
                              <p className="mt-1 text-xs font-semibold text-slate-200">{selectedRow.onboarding.visaStatus || '-'}</p>
                            </div>
                            <div className={cn(adminPremiumUi.surfaceSubtle, 'rounded-lg p-2')}>
                              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Arrival Date</p>
                              <p className="mt-1 text-xs font-semibold text-slate-200">{selectedRow.onboarding.arrivalDate || '-'}</p>
                            </div>
                          </div>
                          <div className={cn(adminPremiumUi.surfaceSubtle, 'rounded-lg p-2')}>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">LinkedIn</p>
                            {selectedRow.onboarding.linkedInUrl ? (
                              <a
                                href={selectedRow.onboarding.linkedInUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-block text-xs font-semibold text-lime-200 transition hover:text-lime-100"
                              >
                                {selectedRow.onboarding.linkedInUrl}
                              </a>
                            ) : (
                              <p className="mt-1 text-xs font-semibold text-slate-200">-</p>
                            )}
                          </div>
                          <div className={cn(adminPremiumUi.surfaceSubtle, 'rounded-lg p-2')}>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Contact</p>
                            <p className="mt-1 text-xs text-slate-300">{selectedRow.onboarding.resumeEmail || '-'}</p>
                            <p className="text-xs text-slate-300">{selectedRow.onboarding.resumePhone || '-'}</p>
                            <p className="text-xs text-slate-300">{selectedRow.onboarding.personalPhone || '-'}</p>
                          </div>
                          <div className={cn(adminPremiumUi.surfaceSubtle, 'rounded-lg p-2')}>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Address</p>
                            <p className="mt-1 text-xs text-slate-300">{selectedRow.onboarding.address || '-'}</p>
                          </div>
                          <div className={cn(adminPremiumUi.surfaceSubtle, 'rounded-lg p-2')}>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Education</p>
                            <p className="mt-1 text-xs text-slate-300">
                              Masters: {selectedRow.onboarding.mastersUniversity || '-'} / {selectedRow.onboarding.mastersField || '-'} / {selectedRow.onboarding.mastersCompleted || '-'}
                            </p>
                            <p className="text-xs text-slate-300">
                              Bachelors: {selectedRow.onboarding.bachelorsUniversity || '-'} / {selectedRow.onboarding.bachelorsField || '-'} / {selectedRow.onboarding.bachelorsCompleted || '-'}
                            </p>
                          </div>
                          <div className={cn(adminPremiumUi.surfaceSubtle, 'rounded-lg p-2')}>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Certifications & Achievements</p>
                            <p className="mt-1 text-xs text-slate-300">{selectedRow.onboarding.certifications || '-'}</p>
                          </div>
                          <div className={cn(adminPremiumUi.surfaceSubtle, 'rounded-lg p-2')}>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Work Experience</p>
                            {selectedRow.onboarding.workExperiences.length === 0 ? (
                              <p className="mt-1 text-xs text-slate-300">No work experience submitted.</p>
                            ) : (
                              <div className="mt-1 space-y-1.5">
                                {selectedRow.onboarding.workExperiences.map((experience, index) => (
                                  <div key={`${experience.companyName}-${index}`} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5">
                                    <p className="text-xs font-semibold text-slate-200">
                                      {experience.companyName || 'Unknown Company'} - {experience.location || 'Unknown Location'}
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                      {experience.startDate || '-'} to {experience.endDate || 'Present'}
                                    </p>
                                    {experience.points.length > 0 && (
                                      <ul className="mt-1 list-disc pl-4 text-[11px] text-slate-300">
                                        {experience.points.map((point, pointIndex) => (
                                          <li key={`${index}-${pointIndex}`}>{point}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className={cn(adminPremiumUi.surfaceSubtle, 'rounded-lg p-2')}>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Consent & Signature</p>
                            <p className="mt-1 text-xs text-slate-300">
                              Consent: {selectedRow.onboarding.consentAccepted ? 'Accepted' : 'Not accepted'}
                            </p>
                            <p className="text-xs text-slate-300">Legal Name: {selectedRow.onboarding.legalName || '-'}</p>
                            <p className="text-xs text-slate-300">Signed Date: {selectedRow.onboarding.signedDate || '-'}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 text-xs text-slate-400">No onboarding submission yet.</div>
                      )}
                    </div>

                  </div>
                )}
              </aside>
            </div>
          </section>
        </div>
      </DashboardLayout>
    </RoleGate>
  );
}

