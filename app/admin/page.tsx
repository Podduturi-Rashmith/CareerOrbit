'use client';

import React, { useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { MOCK_APPLICATIONS, MOCK_STUDENTS } from '@/lib/mock-data';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, BriefcaseBusiness, CheckCircle2, Clock3, Edit2, FileText, Funnel, Plus, Search, ShieldCheck, Users, XCircle } from 'lucide-react';

type ActiveTab = 'students' | 'applications';

const statusTone: Record<string, string> = {
  Applied: 'bg-sky-100 text-sky-800 border-sky-200',
  'Screening Call': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  Interview: 'bg-amber-100 text-amber-900 border-amber-200',
  Assessment: 'bg-violet-100 text-violet-800 border-violet-200',
  Rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  Offer: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddApplication, setShowAddApplication] = useState(false);

  const interviewCount = MOCK_APPLICATIONS.filter((a) => a.status === 'Interview').length;
  const offerCount = MOCK_APPLICATIONS.filter((a) => a.status === 'Offer').length;
  const rejectedCount = MOCK_APPLICATIONS.filter((a) => a.status === 'Rejected').length;
  const riskStudents = Math.max(0, MOCK_STUDENTS.length - offerCount);

  const conversion = MOCK_APPLICATIONS.length ? Math.round((offerCount / MOCK_APPLICATIONS.length) * 100) : 0;

  const filteredStudents = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return MOCK_STUDENTS;
    return MOCK_STUDENTS.filter((s) => `${s.name} ${s.email} ${s.major}`.toLowerCase().includes(q));
  }, [searchTerm]);

  const filteredApps = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return MOCK_APPLICATIONS;
    return MOCK_APPLICATIONS.filter((a) => `${a.companyName} ${a.jobRole} ${a.status}`.toLowerCase().includes(q));
  }, [searchTerm]);

  const cards = [
    { label: 'Active Students', value: MOCK_STUDENTS.length, icon: Users, accent: 'from-sky-600 to-sky-500' },
    { label: 'Open Applications', value: MOCK_APPLICATIONS.length, icon: BriefcaseBusiness, accent: 'from-teal-700 to-teal-600' },
    { label: 'Interview Pipeline', value: interviewCount, icon: Clock3, accent: 'from-amber-600 to-amber-500' },
    { label: 'Offer Conversion', value: `${conversion}%`, icon: CheckCircle2, accent: 'from-emerald-700 to-emerald-600' },
  ];

  return (
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
            <div className="px-5 py-4 border-b border-slate-200 bg-white/70 flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('students')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'students' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Students
                </button>
                <button
                  onClick={() => setActiveTab('applications')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'applications' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Applications
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={`Search ${activeTab}...`}
                    className="w-72 max-w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-teal-600/25"
                  />
                </div>
                <button onClick={() => setShowAddStudent(true)} className="px-3 py-2 rounded-lg bg-teal-700 text-white text-sm font-bold hover:bg-teal-800 inline-flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Student
                </button>
                <button onClick={() => setShowAddApplication(true)} className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-black inline-flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Application
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {activeTab === 'students' ? (
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
                          <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800">
                            <Edit2 className="w-4 h-4" /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
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
                      const student = MOCK_STUDENTS.find((s) => s.studentId === app.studentId);
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
                  {MOCK_STUDENTS.map((s) => (
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
      </AnimatePresence>
    </DashboardLayout>
  );
}
