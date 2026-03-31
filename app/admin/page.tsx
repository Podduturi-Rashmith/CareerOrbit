'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { MOCK_APPLICATIONS, MOCK_STUDENTS } from '@/lib/mock-data';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Edit2,
  FileText,
  Funnel,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  XCircle,
} from 'lucide-react';
import type { JobRoleCategory, StudentCandidate } from '@/lib/jobs/types';
import { roleLabel } from '@/lib/jobs/role-utils';
import type { Student } from '@/lib/mock-data';
import RoleGate from '@/components/RoleGate';
import AdminDashboardV2 from '@/components/admin/AdminDashboard';

type ActiveTab = 'students' | 'applications' | 'bot-lab';
type DashboardRoleFilter =
  | 'all'
  | 'software-engineer'
  | 'data-analyst'
  | 'machine-learning'
  | 'fullstack-developer'
  | 'python-developer'
  | 'java-developer'
  | 'aiml'
  | 'other';

type AdminJob = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  roleCategory: string;
  workMode: string | null;
  description: string;
  applyUrl: string;
  postedAt: string;
  isNew: boolean;
};

type TailoredDraft = {
  id: string;
  studentEmail: string;
  studentName: string;
  roleCategory: string;
  summary: string;
  createdAt: string;
};

type RefreshRoleStat = {
  role: string;
  count: number;
};

const statusTone: Record<string, string> = {
  Applied: 'bg-sky-100 text-sky-800 border-sky-200',
  'Screening Call': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  Interview: 'bg-amber-100 text-amber-900 border-amber-200',
  Assessment: 'bg-violet-100 text-violet-800 border-violet-200',
  Rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  Offer: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

function LegacyAdminDashboard() {
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [activeTab, setActiveTab] = useState<ActiveTab>('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddApplication, setShowAddApplication] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editStudentForm, setEditStudentForm] = useState({
    name: '',
    email: '',
    major: '',
    graduationYear: '',
  });

  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState('');
  const [roleFilter, setRoleFilter] = useState<DashboardRoleFilter>('all');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<StudentCandidate[]>([]);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [selectedCandidateEmail, setSelectedCandidateEmail] = useState('');
  const [selectedCandidateName, setSelectedCandidateName] = useState('');
  const [tailoring, setTailoring] = useState(false);
  const [tailoredDraft, setTailoredDraft] = useState<TailoredDraft | null>(null);
  const [refreshMeta, setRefreshMeta] = useState<{
    fetchedCount: number;
    newCount: number;
    provider?: string;
    targetPerRole?: number;
    roleStats?: RefreshRoleStat[];
  } | null>(null);

  const interviewCount = MOCK_APPLICATIONS.filter((a) => a.status === 'Interview').length;
  const offerCount = MOCK_APPLICATIONS.filter((a) => a.status === 'Offer').length;
  const rejectedCount = MOCK_APPLICATIONS.filter((a) => a.status === 'Rejected').length;
  const riskStudents = Math.max(0, students.length - offerCount);

  const conversion = MOCK_APPLICATIONS.length ? Math.round((offerCount / MOCK_APPLICATIONS.length) * 100) : 0;

  const filteredStudents = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return students;
    return students.filter((s) => `${s.name} ${s.email} ${s.major}`.toLowerCase().includes(q));
  }, [searchTerm, students]);

  const filteredApps = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return MOCK_APPLICATIONS;
    return MOCK_APPLICATIONS.filter((a) => `${a.companyName} ${a.jobRole} ${a.status}`.toLowerCase().includes(q));
  }, [searchTerm]);

  const cards = [
    { label: 'Active Students', value: students.length, icon: Users, accent: 'from-sky-600 to-sky-500' },
    { label: 'Open Applications', value: MOCK_APPLICATIONS.length, icon: BriefcaseBusiness, accent: 'from-teal-700 to-teal-600' },
    { label: 'Interview Pipeline', value: interviewCount, icon: Clock3, accent: 'from-amber-600 to-amber-500' },
    { label: 'Offer Conversion', value: `${conversion}%`, icon: CheckCircle2, accent: 'from-emerald-700 to-emerald-600' },
  ];

  const selectedJob = jobs.find((job) => job.id === selectedJobId) || null;

  const filteredJobs = useMemo(() => {
    if (roleFilter === 'all') return jobs;
    const queryByRole: Record<Exclude<DashboardRoleFilter, 'all'>, string[]> = {
      'software-engineer': ['software engineer', 'sde', 'backend engineer', 'frontend engineer'],
      'data-analyst': ['data analyst', 'analytics'],
      'machine-learning': ['machine learning', 'ml engineer', 'deep learning'],
      'fullstack-developer': ['fullstack', 'full stack'],
      'python-developer': ['python developer', 'python engineer'],
      'java-developer': ['java developer', 'spring boot'],
      aiml: ['ai', 'ml', 'machine learning'],
      other: [],
    };

    const current = queryByRole[roleFilter];
    return jobs.filter((job) => {
      if (roleFilter === 'other') return job.roleCategory === 'other';
      if (job.roleCategory === roleFilter) return true;
      const haystack = `${job.title} ${job.description}`.toLowerCase();
      return current.some((keyword) => haystack.includes(keyword));
    });
  }, [jobs, roleFilter]);

  const selectedVisibleJob = filteredJobs.find((job) => job.id === selectedJobId) || selectedJob;

  const openEditStudent = (student: Student) => {
    setEditingStudentId(student.id);
    setEditStudentForm({
      name: student.name,
      email: student.email,
      major: student.major,
      graduationYear: student.graduationYear,
    });
  };

  const saveEditedStudent = () => {
    if (!editingStudentId) return;

    setStudents((current) =>
      current.map((student) =>
        student.id === editingStudentId
          ? {
              ...student,
              name: editStudentForm.name.trim() || student.name,
              email: editStudentForm.email.trim() || student.email,
              major: editStudentForm.major.trim() || student.major,
              graduationYear: editStudentForm.graduationYear.trim() || student.graduationYear,
            }
          : student
      )
    );

    setEditingStudentId(null);
  };

  const loadJobs = async (currentRole = roleFilter) => {
    setJobsLoading(true);
    setJobsError('');
    try {
      const query = new URLSearchParams();
      const serverRoleFilters = new Set(['software-engineer', 'data-analyst', 'java-developer', 'aiml', 'other']);
      if (currentRole && currentRole !== 'all' && serverRoleFilters.has(currentRole)) query.set('role', currentRole);
      const response = await fetch(`/api/admin/jobs?${query.toString()}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data.jobs || []);
      if (!selectedJobId && data.jobs?.length) {
        setSelectedJobId(data.jobs[0].id);
      }
    } catch (error) {
      setJobsError(error instanceof Error ? error.message : 'Failed to fetch jobs');
    } finally {
      setJobsLoading(false);
    }
  };

  const refreshJobs = async () => {
    setJobsLoading(true);
    setJobsError('');
    try {
      const response = await fetch('/api/admin/jobs/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Bot refresh failed');
      const data = await response.json();
      setJobs(data.jobs || []);
      setRefreshMeta(data.meta || null);
	      if (data.jobs?.length) {
	        setSelectedJobId(data.jobs[0].id);
	      }
    } catch (error) {
      setJobsError(error instanceof Error ? error.message : 'Bot refresh failed');
    } finally {
      setJobsLoading(false);
    }
  };

  const loadCandidates = async (jobId: string) => {
    setCandidateLoading(true);
    setCandidates([]);
    setSelectedCandidateEmail('');
    setSelectedCandidateName('');
    setTailoredDraft(null);
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}/candidates`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load candidates');
      const data = await response.json();
      setCandidates(data.candidates || []);
      if (data.candidates?.length) {
        setSelectedCandidateEmail(data.candidates[0].email);
        setSelectedCandidateName(data.candidates[0].name);
      }
    } catch {
      setCandidates([]);
    } finally {
      setCandidateLoading(false);
    }
  };

  const generateTailoredResume = async () => {
    if (!selectedJobId || !selectedCandidateEmail || !selectedCandidateName) return;
    setTailoring(true);
    try {
      const response = await fetch(`/api/admin/jobs/${selectedJobId}/tailor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          studentEmail: selectedCandidateEmail,
          studentName: selectedCandidateName,
        }),
      });
      if (!response.ok) throw new Error('Tailoring failed');
      const data = await response.json();
      setTailoredDraft(data.draft);
    } catch {
      setTailoredDraft(null);
    } finally {
      setTailoring(false);
    }
  };

  const downloadResumeDocx = async () => {
    if (!selectedJobId || !tailoredDraft?.id) return;
    const response = await fetch(`/api/admin/jobs/${selectedJobId}/tailor/${tailoredDraft.id}/download`, {
      credentials: 'include',
    });
    if (!response.ok) return;

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedCandidateName || 'tailored_resume'}.docx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (activeTab === 'bot-lab' && jobs.length === 0 && !jobsLoading) {
      loadJobs().catch(() => undefined);
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'bot-lab' && selectedJobId) {
      loadCandidates(selectedJobId).catch(() => undefined);
    }
  }, [selectedJobId, activeTab]);

  return (
    <RoleGate expectedRole="admin">
      <DashboardLayout>
        <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-slate-900 text-white p-8 md:p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(20,184,166,0.2),transparent_38%),radial-gradient(circle_at_85%_30%,rgba(14,165,233,0.2),transparent_30%)]" />
          <div className="relative flex flex-col lg:flex-row justify-between gap-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300 font-semibold">Admin Operations</p>
              <h1 className="mt-2 text-3xl md:text-4xl font-display font-black tracking-tight">Placement Command Center</h1>
              <p className="mt-3 text-slate-300 max-w-2xl">Monitor student progress, identify risk early, and keep outcomes moving from application to offer.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 min-w-[260px]">
              <div className="rounded-xl border border-white/20 bg-white/10 p-3">
                <p className="text-xs uppercase tracking-wider text-slate-300">At Risk</p>
                <p className="text-2xl font-black">{riskStudents}</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-3">
                <p className="text-xs uppercase tracking-wider text-slate-300">Rejected</p>
                <p className="text-2xl font-black">{rejectedCount}</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-3 col-span-2">
                <p className="text-xs uppercase tracking-wider text-slate-300">System Health</p>
                <p className="text-sm font-semibold mt-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" /> Authentication + Session Controls Active
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {cards.map((card, idx) => (
            <motion.article
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="panel-surface rounded-2xl p-5"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.accent} text-white flex items-center justify-center`}>
                <card.icon className="w-5 h-5" />
              </div>
              <p className="mt-4 text-3xl font-black text-slate-900">{card.value}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-slate-500 font-semibold">{card.label}</p>
            </motion.article>
          ))}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 panel-surface rounded-3xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-white/80">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="inline-flex w-fit rounded-xl bg-slate-100 border border-slate-200 p-1">
                  <button
                    onClick={() => setActiveTab('students')}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                      activeTab === 'students'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Students
                  </button>
                  <button
                    onClick={() => setActiveTab('applications')}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                      activeTab === 'applications'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <BriefcaseBusiness className="w-4 h-4" />
                    Applications
                  </button>
                  <button
                    onClick={() => setActiveTab('bot-lab')}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                      activeTab === 'bot-lab'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    Lab
                  </button>
                </div>

                {activeTab !== 'bot-lab' && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={`Search ${activeTab}...`}
                        className="w-full sm:w-64 pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-teal-600/25"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAddApplication(true)}
                        className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-black inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" /> Application
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5">
              {activeTab === 'students' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/70">
                        <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Student</th>
                        <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Major</th>
                        <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Graduation</th>
                        <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Applications</th>
                        <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center">{student.name.charAt(0)}</div>
                              <div>
                                <p className="font-semibold text-slate-900">{student.name}</p>
                                <p className="text-xs text-slate-500">{student.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">{student.major}</td>
                          <td className="px-6 py-4 text-sm text-slate-700">{student.graduationYear}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex rounded-md bg-slate-100 text-slate-700 px-2.5 py-1 text-xs font-semibold">
                              {MOCK_APPLICATIONS.filter((app) => app.studentId === student.studentId).length}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => openEditStudent(student)}
                              className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
                            >
                              <Edit2 className="w-4 h-4" /> Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'applications' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/70">
                        <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Student</th>
                        <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Company</th>
                        <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Role</th>
                        <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Stage</th>
                        <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredApps.map((app) => {
                        const student = students.find((s) => s.studentId === app.studentId);
                        return (
                          <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-6 py-4 text-sm font-semibold text-slate-900">{student?.name || 'Unknown'}</td>
                            <td className="px-6 py-4 text-sm text-slate-700">{app.companyName}</td>
                            <td className="px-6 py-4 text-sm text-slate-700">{app.jobRole}</td>
                            <td className="px-6 py-4">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${statusTone[app.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>{app.status}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900">
                                <Edit2 className="w-4 h-4" /> Update
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'bot-lab' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-sm font-bold text-slate-900">Job Scout Bot</p>
                          <p className="text-xs text-slate-500">Pilot mode: fetches a fresh mock feed and stores it in DB.</p>
                        </div>
                        <button onClick={refreshJobs} disabled={jobsLoading} className="rounded-lg bg-teal-700 text-white px-3 py-2 text-sm font-semibold hover:bg-teal-800 disabled:opacity-70">
                          {jobsLoading ? 'Running...' : 'Run Bot Now'}
                        </button>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
	                        <select
	                          value={roleFilter}
	                          onChange={(e) => {
	                            const next = e.target.value as DashboardRoleFilter;
	                            setRoleFilter(next);
	                            loadJobs(next).catch(() => undefined);
	                          }}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                        >
	                          <option value="all">All Roles</option>
	                          <option value="software-engineer">Software Engineer</option>
	                          <option value="data-analyst">Data Analyst</option>
	                          <option value="machine-learning">Machine Learning</option>
	                          <option value="fullstack-developer">Fullstack Developer</option>
	                          <option value="python-developer">Python Developer</option>
	                          <option value="java-developer">Java Developer</option>
	                          <option value="aiml">AI/ML</option>
	                          <option value="other">Other</option>
	                        </select>
                        <button onClick={() => loadJobs().catch(() => undefined)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                          Refresh View
                        </button>
                      </div>
	                      {refreshMeta && (
	                        <div className="mt-2 space-y-1">
	                          <p className="text-xs text-emerald-700">
	                            Last run fetched {refreshMeta.fetchedCount} jobs, with {refreshMeta.newCount} new.
	                          </p>
	                          {refreshMeta.roleStats && refreshMeta.targetPerRole && (
	                            <p className="text-xs text-amber-700">
	                              {refreshMeta.roleStats.some((stat) => stat.count < refreshMeta.targetPerRole!)
	                                ? `Low volume today: ${refreshMeta.roleStats
	                                    .filter((stat) => stat.count < refreshMeta.targetPerRole!)
	                                    .map((stat) => `${stat.role} (${stat.count}/${refreshMeta.targetPerRole})`)
	                                    .join(', ')}. This is normal when fewer fresh full-time jobs are posted.`
	                                : `Target met: ${refreshMeta.targetPerRole} per role.`}
	                            </p>
	                          )}
	                        </div>
	                      )}
	                      {jobsError && <p className="mt-2 text-xs text-rose-600">{jobsError}</p>}
	                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-200">
                        <p className="text-sm font-bold text-slate-900">Fetched Jobs</p>
                      </div>
                      <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-200">
	                        {filteredJobs.map((job) => (
	                          <button
                            key={job.id}
                            onClick={() => setSelectedJobId(job.id)}
                            className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${selectedJobId === job.id ? 'bg-slate-50' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{job.title}</p>
                                <p className="text-xs text-slate-500">{job.company} • {roleLabel(job.roleCategory as JobRoleCategory)}</p>
                              </div>
                              {job.isNew && <span className="text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">NEW</span>}
                            </div>
                          </button>
                        ))}
	                        {!jobsLoading && filteredJobs.length === 0 && <p className="px-4 py-6 text-sm text-slate-500">No jobs found for this role yet. Click “Run Bot Now”.</p>}
	                      </div>
	                    </div>
	                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-bold text-slate-900">Selected Job</p>
	                      {selectedVisibleJob ? (
	                        <div className="mt-2 space-y-2">
	                          <p className="font-semibold text-slate-900">{selectedVisibleJob.title}</p>
	                          <p className="text-sm text-slate-600">{selectedVisibleJob.company} • {selectedVisibleJob.location || 'Location not listed'}</p>
	                          <p className="text-xs text-slate-500">{selectedVisibleJob.description}</p>
	                          <a href={selectedVisibleJob.applyUrl} target="_blank" rel="noreferrer" className="inline-flex mt-2 rounded-lg bg-slate-900 text-white px-3 py-2 text-sm font-semibold hover:bg-black">
	                            Open Company Apply Link
	                          </a>
	                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">Pick a job from the left panel.</p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-bold text-slate-900">Role-Matched Candidates</p>
                      {candidateLoading && <p className="mt-2 text-sm text-slate-500">Finding candidates...</p>}
                      {!candidateLoading && (
                        <div className="mt-3 space-y-2">
                          {candidates.map((candidate) => (
                            <label key={candidate.email} className="flex items-start gap-3 rounded-xl border border-slate-200 px-3 py-2 cursor-pointer hover:bg-slate-50">
                              <input
                                type="radio"
                                name="candidate"
                                checked={selectedCandidateEmail === candidate.email}
                                onChange={() => {
                                  setSelectedCandidateEmail(candidate.email);
                                  setSelectedCandidateName(candidate.name);
                                }}
                                className="mt-1"
                              />
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{candidate.name}</p>
                                <p className="text-xs text-slate-500">{candidate.email} • {candidate.major}</p>
                                <p className="text-xs text-teal-700 font-semibold mt-1">Fit score: {candidate.fitScore}%</p>
                              </div>
                            </label>
                          ))}
                          {candidates.length === 0 && <p className="text-sm text-slate-500">No candidates loaded yet.</p>}
                        </div>
                      )}

                      <button
                        onClick={generateTailoredResume}
                        disabled={!selectedJobId || !selectedCandidateEmail || tailoring}
                        className="mt-3 rounded-lg bg-teal-700 text-white px-3 py-2 text-sm font-semibold hover:bg-teal-800 disabled:opacity-70"
                      >
                        {tailoring ? 'Generating...' : 'Generate Tailored Resume Draft'}
                      </button>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-sm font-bold text-slate-900">Tailored Resume Draft</p>
                      {tailoredDraft ? (
                        <>
                          <pre className="mt-2 text-xs text-slate-700 whitespace-pre-wrap font-mono bg-white border border-slate-200 rounded-xl p-3">{tailoredDraft.summary}</pre>
                          <button
                            onClick={downloadResumeDocx}
                            className="mt-3 rounded-lg bg-slate-900 text-white px-3 py-2 text-sm font-semibold hover:bg-black"
                          >
                            Download Professional Resume (.docx)
                          </button>
                        </>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">Generate a draft after selecting a candidate.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="panel-surface rounded-3xl p-5">
              <div className="flex items-center gap-2 text-slate-800">
                <Funnel className="w-4 h-4" />
                <p className="font-bold">Pipeline Snapshot</p>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <span className="text-slate-600">Applied</span>
                  <strong className="text-slate-900">{MOCK_APPLICATIONS.filter((a) => a.status === 'Applied').length}</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <span className="text-slate-600">Screening</span>
                  <strong className="text-slate-900">{MOCK_APPLICATIONS.filter((a) => a.status === 'Screening Call').length}</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <span className="text-slate-600">Interview</span>
                  <strong className="text-slate-900">{MOCK_APPLICATIONS.filter((a) => a.status === 'Interview').length}</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <span className="text-slate-600">Offer</span>
                  <strong className="text-emerald-700">{offerCount}</strong>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs uppercase tracking-wider font-bold text-amber-900">Attention Required</p>
              <p className="mt-2 text-sm text-amber-900 flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {riskStudents} students are not yet in offer stage. Prioritize interview prep and weekly follow-ups.
              </p>
            </div>
          </aside>
        </section>
      </div>

      <AnimatePresence>
        {showAddStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="w-full max-w-xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Add New Student</h2>
                <button onClick={() => setShowAddStudent(false)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="rounded-xl border border-slate-300 px-4 py-2.5" placeholder="Full Name" />
                <input className="rounded-xl border border-slate-300 px-4 py-2.5" placeholder="Email Address" />
                <input className="rounded-xl border border-slate-300 px-4 py-2.5" placeholder="Major" />
                <input className="rounded-xl border border-slate-300 px-4 py-2.5" placeholder="Graduation Year" />
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowAddStudent(false)} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200">Cancel</button>
                <button className="flex-1 rounded-xl bg-teal-700 py-3 font-bold text-white hover:bg-teal-800">Create Account</button>
              </div>
            </motion.div>
          </div>
        )}
        {showAddApplication && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="w-full max-w-xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Add Application</h2>
                <button onClick={() => setShowAddApplication(false)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="mt-5 space-y-4">
                <select className="w-full rounded-xl border border-slate-300 px-4 py-2.5">
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input className="rounded-xl border border-slate-300 px-4 py-2.5" placeholder="Company Name" />
                  <input className="rounded-xl border border-slate-300 px-4 py-2.5" placeholder="Job Role" />
                </div>
                <div className="rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  <FileText className="w-7 h-7 mx-auto mb-2 text-slate-400" />
                  Upload Resume
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowAddApplication(false)} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200">Cancel</button>
                <button className="flex-1 rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-black">Add Application</button>
              </div>
            </motion.div>
          </div>
        )}
        {editingStudentId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="w-full max-w-xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Edit Student</h2>
                <button onClick={() => setEditingStudentId(null)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className="rounded-xl border border-slate-300 px-4 py-2.5"
                  placeholder="Full Name"
                  value={editStudentForm.name}
                  onChange={(e) => setEditStudentForm((previous) => ({ ...previous, name: e.target.value }))}
                />
                <input
                  className="rounded-xl border border-slate-300 px-4 py-2.5"
                  placeholder="Email Address"
                  value={editStudentForm.email}
                  onChange={(e) => setEditStudentForm((previous) => ({ ...previous, email: e.target.value }))}
                />
                <input
                  className="rounded-xl border border-slate-300 px-4 py-2.5"
                  placeholder="Major"
                  value={editStudentForm.major}
                  onChange={(e) => setEditStudentForm((previous) => ({ ...previous, major: e.target.value }))}
                />
                <input
                  className="rounded-xl border border-slate-300 px-4 py-2.5"
                  placeholder="Graduation Year"
                  value={editStudentForm.graduationYear}
                  onChange={(e) => setEditStudentForm((previous) => ({ ...previous, graduationYear: e.target.value }))}
                />
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setEditingStudentId(null)} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200">Cancel</button>
                <button onClick={saveEditedStudent} className="flex-1 rounded-xl bg-teal-700 py-3 font-bold text-white hover:bg-teal-800">Save Changes</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </DashboardLayout>
    </RoleGate>
  );
}

export default function AdminPage() {
  return <AdminDashboardV2 />;
}
