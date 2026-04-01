'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { motion } from 'motion/react';
import { ArrowUpRight, BriefcaseBusiness, CalendarClock, CircleDotDashed, ExternalLink, Trophy } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StudentOnboardingForm from '@/components/StudentOnboardingForm';
import type { StudentApplicationDto } from '@/lib/applications/serialize';

const statusStyles: Record<string, string> = {
  Applied: 'bg-sky-100 text-sky-800 border-sky-200',
  'Screening Call': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  Interview: 'bg-amber-100 text-amber-800 border-amber-200',
  Assessment: 'bg-violet-100 text-violet-800 border-violet-200',
  Rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  Offer: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

function StatusPill({ status }: { status: string }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${statusStyles[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>{status}</span>;
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Suspense>
        <DashboardContent />
      </Suspense>
    </DashboardLayout>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [applications, setApplications] = React.useState<StudentApplicationDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const isFirstWelcome = searchParams.get('welcome') === '1';
  const [onboardingStatus, setOnboardingStatus] = React.useState<'loading' | 'required' | 'complete'>('loading');

  const role = isLoaded ? (user?.publicMetadata?.role as string | undefined) : undefined;
  const roles = isLoaded ? ((user?.publicMetadata as any)?.roles as unknown) : undefined;
  const normalizedRoles = Array.isArray(roles) ? roles.map((r) => (typeof r === 'string' ? r.toLowerCase() : '')).filter(Boolean) : [];
  const isAdmin = (role === 'admin' || role === 'sub-admin') || normalizedRoles.includes('admin') || normalizedRoles.includes('sub-admin');
  const isStudent = role === 'student' || normalizedRoles.includes('student') || (!isAdmin && normalizedRoles.length === 0 && !role);

  // Redirect admins — must know the role first
  React.useEffect(() => {
    if (!isLoaded) return;
    // If the user is dual-role (admin + student), keep them in student dashboard when they choose it.
    if (isAdmin && !isStudent) router.replace('/admin/jobs');
  }, [isLoaded, isAdmin, isStudent, router]);

  // Only fetch applications once we know the user is a student
  React.useEffect(() => {
    if (!isLoaded || isAdmin) return;
    const loadApplications = async () => {
      try {
        const response = await fetch('/api/student/applications', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to load applications');
        const data = await response.json();
        setApplications(data.applications || []);
      } catch {
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    loadApplications().catch(() => { setApplications([]); setLoading(false); });
  }, [isLoaded, isAdmin]);

  // Only check onboarding once we know the user is a student
  React.useEffect(() => {
    if (!isLoaded || isAdmin) return;
    const loadOnboarding = async () => {
      try {
        const studentEmail = user?.primaryEmailAddress?.emailAddress;
        const query = studentEmail ? `?studentEmail=${encodeURIComponent(studentEmail)}` : '';
        const response = await fetch(`/api/student/onboarding${query}`, { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to load onboarding');
        const data = await response.json();
        setOnboardingStatus(data.completed ? 'complete' : 'required');
      } catch {
        setOnboardingStatus('required');
      }
    };
    loadOnboarding().catch(() => setOnboardingStatus('required'));
  }, [isLoaded, isAdmin, user]);

  // Still figuring out who the user is — show nothing yet
  if (!isLoaded || (isAdmin && !isStudent)) {
    return null;
  }

  if (onboardingStatus === 'loading') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-slate-600">
        Loading...
      </div>
    );
  }

  if (onboardingStatus === 'required') {
    return <StudentOnboardingForm onComplete={() => setOnboardingStatus('complete')} />;
  }

  const stats = [
    { label: 'Total Applications', value: applications.length, icon: BriefcaseBusiness, tone: 'from-sky-600 to-sky-500' },
    { label: 'Screening + Interviews', value: applications.filter((a) => a.status === 'Screening Call' || a.status === 'Interview').length, icon: CalendarClock, tone: 'from-teal-700 to-teal-600' },
    { label: 'Assessments', value: applications.filter((a) => a.status === 'Assessment').length, icon: CircleDotDashed, tone: 'from-violet-700 to-violet-600' },
    { label: 'Offers', value: applications.filter((a) => a.status === 'Offer').length, icon: Trophy, tone: 'from-emerald-700 to-emerald-600' },
  ];

  const upcoming = applications.find((a) => a.upcomingEvent);
  const recentApplications = applications.slice(0, 6);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 text-white p-8 md:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.22),transparent_40%),radial-gradient(circle_at_85%_30%,rgba(245,158,11,0.18),transparent_35%)]" />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300 font-semibold">Student Workspace</p>
            <h1 className="mt-3 text-3xl md:text-4xl font-display font-black tracking-tight">
              {isFirstWelcome ? 'Welcome to CareerOrbit' : 'Welcome back'}
              {`, Student`}
            </h1>
            <p className="mt-3 text-slate-300 max-w-2xl">
              Stay consistent. Keep interviews prepared, follow up on screenings, and move each application to the next stage.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/20 px-5 py-4">
            <p className="text-xs uppercase tracking-widest text-slate-300 font-semibold">Next Priority</p>
            <p className="mt-2 font-bold text-white">{upcoming ? `${upcoming.companyName} ${upcoming.upcomingEvent?.type}` : 'No event scheduled'}</p>
            <p className="text-sm text-slate-300 mt-1">{upcoming?.upcomingEvent?.date?.replace('T', ' ').replace('Z', ' UTC') || 'Add a new calendar event to stay on track.'}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((item, index) => (
          <motion.article
            key={item.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="panel-surface rounded-2xl p-5"
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.tone} text-white flex items-center justify-center`}>
              <item.icon className="w-5 h-5" />
            </div>
            <p className="mt-4 text-3xl font-black text-slate-900">{item.value}</p>
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mt-1">{item.label}</p>
          </motion.article>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 panel-surface rounded-3xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Applications</h2>
              <p className="text-sm text-slate-500">Your latest progress across companies.</p>
            </div>
            <Link href="/applications" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800">
              View all <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/70">
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Company</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Role</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Status</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Applied On</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-bold text-right">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">{app.companyName.charAt(0)}</div>
                        <span className="font-semibold text-slate-900">{app.companyName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{app.jobRole}</td>
                    <td className="px-6 py-4">
                      <StatusPill status={app.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{app.applicationDate}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/applications/${app.id}`} className="inline-flex p-2 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {!loading && recentApplications.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                      No applications found for this account yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="panel-surface rounded-3xl p-6">
            <h3 className="font-bold text-slate-900">This Week Plan</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li className="rounded-xl border border-slate-200 bg-white p-3">Prepare STAR stories for behavioral rounds.</li>
              <li className="rounded-xl border border-slate-200 bg-white p-3">Follow up on applications older than 10 days.</li>
              <li className="rounded-xl border border-slate-200 bg-white p-3">Practice one timed assessment before Friday.</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-teal-200 bg-teal-50 p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-800">Focus Signal</p>
            <p className="mt-2 text-sm text-teal-900">You have strong momentum. Keep screening and interview pipelines active to maintain conversion.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
