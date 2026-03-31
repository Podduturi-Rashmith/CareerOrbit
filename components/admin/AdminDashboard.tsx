'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import RoleGate from '@/components/RoleGate';
import { MOCK_APPLICATIONS, MOCK_STUDENTS, type JobApplication, type Student } from '@/lib/mock-data';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { Bell, CalendarDays, TrendingDown, TrendingUp, Users, BriefcaseBusiness, Search, Zap } from 'lucide-react';

type RoleBucketId =
  | 'software-engineering'
  | 'data-roles'
  | 'ai-ml'
  | 'cloud-devops'
  | 'qa-testing'
  | 'business-product'
  | 'cybersecurity'
  | 'design';

type UiEventType = 'Interview' | 'Screening' | 'Phone Call' | 'Assessment' | 'Rejection';

type CalendarEvent = {
  id: string;
  type: UiEventType;
  dateTime: Date;
  studentId?: string;
  studentName?: string;
  companyName?: string;
  meetingLink?: string;
  prepNotes?: string;
  notes?: string;
};

type NotificationTone = 'positive' | 'negative' | 'info';
type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  createdAt: Date;
  tone: NotificationTone;
  action?: { type: 'calendar'; eventId: string };
};

const ROLE_BUCKETS: Array<{
  id: RoleBucketId;
  label: string;
  accentBg: string;
  accentFg: string;
  accentBorder: string;
}> = [
  { id: 'software-engineering', label: 'Software Engineering', accentBg: 'bg-sky-50', accentFg: 'text-sky-700', accentBorder: 'border-sky-100' },
  { id: 'data-roles', label: 'Data Roles', accentBg: 'bg-teal-50', accentFg: 'text-teal-700', accentBorder: 'border-teal-100' },
  { id: 'ai-ml', label: 'AI / Machine Learning', accentBg: 'bg-violet-50', accentFg: 'text-violet-700', accentBorder: 'border-violet-100' },
  { id: 'cloud-devops', label: 'Cloud / DevOps', accentBg: 'bg-amber-50', accentFg: 'text-amber-800', accentBorder: 'border-amber-100' },
  { id: 'qa-testing', label: 'QA / Testing', accentBg: 'bg-fuchsia-50', accentFg: 'text-fuchsia-700', accentBorder: 'border-fuchsia-100' },
  { id: 'business-product', label: 'Business / Product', accentBg: 'bg-indigo-50', accentFg: 'text-indigo-700', accentBorder: 'border-indigo-100' },
  { id: 'cybersecurity', label: 'Cybersecurity', accentBg: 'bg-emerald-50', accentFg: 'text-emerald-700', accentBorder: 'border-emerald-100' },
  { id: 'design', label: 'Design', accentBg: 'bg-rose-50', accentFg: 'text-rose-700', accentBorder: 'border-rose-100' },
];

function roleLabel(id: RoleBucketId): string {
  return ROLE_BUCKETS.find((r) => r.id === id)?.label ?? id;
}

function parseDateOnly(dateStr: string): Date {
  // Treat as YYYY-MM-DD in UTC to avoid timezone day-shifts.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(`${dateStr}T00:00:00.000Z`);
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function utcDayKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function isSameUtcDay(a: Date, b: Date): boolean {
  return utcDayKey(a) === utcDayKey(b);
}

function classifyJobRoleToBucket(jobRole: string): RoleBucketId {
  const s = (jobRole || '').toLowerCase();
  const hasAny = (re: RegExp) => re.test(s);

  if (hasAny(/\b(cyber|security|cybersecurity|soc|siem|pentest|pentesting|vulnerability)\b/)) return 'cybersecurity';
  if (hasAny(/\b(design|ux|ui|figma|prototype|interaction design)\b/)) return 'design';
  if (hasAny(/\b(qa|quality assurance|testing|test automation|sdet)\b/)) return 'qa-testing';
  if (hasAny(/\b(devops|cloud|aws|gcp|azure|kubernetes|docker|terraform|eks|ecs|ci\/cd)\b/)) return 'cloud-devops';
  if (hasAny(/\b(product|pm|product manager|business analyst|growth|strategy)\b/)) return 'business-product';
  if (hasAny(/\b(ai|ml|machine learning|deep learning|llm|nlp|computer vision)\b/)) return 'ai-ml';
  if (hasAny(/\b(data analyst|data|analytics|analyst|tableau|power bi|bi\b|sql)\b/)) return 'data-roles';
  if (hasAny(/\b(software engineer|software|engineer|backend|frontend|fullstack|react|node\.js|typescript|postgres|api)\b/)) return 'software-engineering';

  return 'software-engineering';
}

function classifyStudentToBucket(student: Student): RoleBucketId {
  const skillText = Object.entries(student.baseResume?.technicalSkills || {})
    .map(([k, v]) => `${k} ${(v || []).join(' ')}`)
    .join(' ');

  const corpus = `${student.major} ${student.baseResume?.headline ?? ''} ${skillText}`.toLowerCase();

  // Reuse the same heuristics against a blended corpus.
  const hasAny = (re: RegExp) => re.test(corpus);

  if (hasAny(/\b(cyber|security|cybersecurity|soc|siem|pentest|vulnerability)\b/)) return 'cybersecurity';
  if (hasAny(/\b(design|ux|ui|figma|prototype|interaction design)\b/)) return 'design';
  if (hasAny(/\b(qa|quality assurance|testing|test automation|sdet)\b/)) return 'qa-testing';
  if (hasAny(/\b(devops|cloud|aws|gcp|azure|kubernetes|docker|terraform|eks|ecs|ci\/cd)\b/)) return 'cloud-devops';
  if (hasAny(/\b(product|pm|product manager|business analyst|growth|strategy)\b/)) return 'business-product';
  if (hasAny(/\b(ai|ml|machine learning|deep learning|llm|nlp|computer vision)\b/)) return 'ai-ml';
  if (hasAny(/\b(data analyst|data|analytics|analyst|tableau|power bi|bi\b|sql)\b/)) return 'data-roles';
  return 'software-engineering';
}

function getDeltaPct(current: number, previous: number): number {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }
  return ((current - previous) / previous) * 100;
}

function deltaToneClass(deltaPct: number) {
  if (deltaPct > 0.01) return 'text-emerald-700 bg-emerald-50 border-emerald-100';
  if (deltaPct < -0.01) return 'text-rose-700 bg-rose-50 border-rose-100';
  return 'text-slate-700 bg-slate-50 border-slate-200';
}

function deltaIcon(deltaPct: number) {
  if (deltaPct > 0.01) return <TrendingUp className="w-3.5 h-3.5" />;
  if (deltaPct < -0.01) return <TrendingDown className="w-3.5 h-3.5" />;
  return null;
}

function statusToNotificationTone(status: JobApplication['status']): NotificationTone {
  if (status === 'Offer') return 'positive';
  if (status === 'Rejected') return 'negative';
  return 'info';
}

function statusToStageLine(status: JobApplication['status']): string {
  // Keep labels short for dashboards/funnel mini charts.
  if (status === 'Applied') return 'Applied';
  if (status === 'Screening Call') return 'Phone';
  if (status === 'Interview') return 'Interview';
  if (status === 'Assessment') return 'Assessment';
  if (status === 'Offer') return 'Offer';
  if (status === 'Rejected') return 'Rejected';
  return status;
}

function SparkBars({ series, positiveColor, negativeColor }: { series: number[]; positiveColor: string; negativeColor: string }) {
  const max = Math.max(1, ...series.map((n) => Math.abs(n)));
  const hasNeg = series.some((n) => n < 0);

  return (
    <div className="flex items-end gap-1.5 h-10">
      {series.map((v, idx) => {
        const height = Math.round((Math.abs(v) / max) * 40) + 6; // 6..46px
        const isPos = v >= 0;
        const bg = hasNeg ? (isPos ? positiveColor : negativeColor) : positiveColor;
        return <div key={idx} className={`w-2 rounded-sm ${bg}`} style={{ height }} />;
      })}
    </div>
  );
}

function EventChip({ type }: { type: UiEventType }) {
  const colors: Record<UiEventType, { bg: string; fg: string; border: string }> = {
    Interview: { bg: 'bg-amber-50', fg: 'text-amber-800', border: 'border-amber-100' },
    Screening: { bg: 'bg-purple-50', fg: 'text-purple-800', border: 'border-purple-100' },
    'Phone Call': { bg: 'bg-indigo-50', fg: 'text-indigo-800', border: 'border-indigo-100' },
    Assessment: { bg: 'bg-violet-50', fg: 'text-violet-800', border: 'border-violet-100' },
    Rejection: { bg: 'bg-rose-50', fg: 'text-rose-800', border: 'border-rose-100' },
  };
  const c = colors[type];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${c.bg} ${c.fg} ${c.border}`}>{type}</span>;
}

function formatRelativeTime(d: Date, now: Date) {
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin <= 0) return 'just now';
  if (diffMin === 1) return '1m ago';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr === 1) return '1h ago';
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return '1d ago';
  return `${diffDay}d ago`;
}

export default function AdminDashboard() {
  const [activeKpiTab, setActiveKpiTab] = React.useState<'active-students' | 'jobs-added-today' | 'interview-pipeline' | 'avg-applied-per-student'>('active-students');
  const [bottomTab, setBottomTab] = React.useState<'students' | 'applications'>('students');
  const [kpiRoleFilter, setKpiRoleFilter] = React.useState<RoleBucketId | 'all'>('all');
  const [bottomRoleFilter, setBottomRoleFilter] = React.useState<RoleBucketId | 'all'>('all');

  const [studentSearch, setStudentSearch] = React.useState('');
  const [appSearch, setAppSearch] = React.useState('');

  const [selectedDate, setSelectedDate] = React.useState<Date>(() => new Date());
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => new Date());
  const [calendarRoleFilter, setCalendarRoleFilter] = React.useState<RoleBucketId | 'all'>('all');
  const [calendarTypeFilter, setCalendarTypeFilter] = React.useState<UiEventType | 'all'>('all');

  const [unreadNotificationIds, setUnreadNotificationIds] = React.useState<Set<string>>(() => new Set());
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(() => {
    // Seed with derived mock updates.
    const now = new Date();
    const refDate = (() => {
      const dates = MOCK_APPLICATIONS.map((a) => parseDateOnly(a.applicationDate));
      return dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : new Date();
    })();

    const byDate = [...MOCK_APPLICATIONS].sort((a, b) => parseDateOnly(b.applicationDate).getTime() - parseDateOnly(a.applicationDate).getTime());
    const items: NotificationItem[] = [];
    for (const app of byDate) {
      const student = MOCK_STUDENTS.find((s) => s.studentId === app.studentId);
      if (!student) continue;
      const tone = statusToNotificationTone(app.status);
      if (app.upcomingEvent?.date) {
        const dt = new Date(app.upcomingEvent.date);
        const type: UiEventType = app.upcomingEvent.type === 'Interview' ? 'Interview' : app.upcomingEvent.type === 'Screening' ? 'Screening' : 'Assessment';
        items.push({
          id: `n-${app.id}-${type}`,
          title: `${type} scheduled`,
          detail: `${student.name} • ${app.companyName}`,
          createdAt: new Date(dt.getTime() - 1000 * 60 * 35), // make it feel "live"
          tone,
        });
      } else if (app.status === 'Rejected') {
        const dt = parseDateOnly(app.applicationDate);
        items.push({
          id: `n-${app.id}-rejected`,
          title: 'Rejection logged',
          detail: `${student.name} • ${app.companyName}`,
          createdAt: new Date(dt.getTime() + 1000 * 60 * 10),
          tone,
        });
      } else if (app.status === 'Offer') {
        const dt = parseDateOnly(app.applicationDate);
        items.push({
          id: `n-${app.id}-offer`,
          title: 'Offer secured',
          detail: `${student.name} • ${app.companyName}`,
          createdAt: new Date(dt.getTime() + 1000 * 60 * 5),
          tone,
        });
      }
    }

    // Mark all seed notifications unread.
    return items
      .slice(0, 8)
      .map((it) => ({ ...it, createdAt: new Date(refDate.getTime() - (Math.random() * 1000 * 60 * 240 + 1000 * 60 * 5)) }));
  });

  // Initialize unread after first render.
  React.useEffect(() => {
    setUnreadNotificationIds(new Set(notifications.map((n) => n.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refDate = React.useMemo(() => {
    const dates = MOCK_APPLICATIONS.map((a) => parseDateOnly(a.applicationDate));
    return dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : new Date();
  }, []);

  // Simulated real-time notifications: periodically "arrive" a new item derived from mock data.
  React.useEffect(() => {
    const allCandidates: NotificationItem[] = MOCK_APPLICATIONS
      .map((app) => {
        const student = MOCK_STUDENTS.find((s) => s.studentId === app.studentId);
        if (!student) return null;
        if (app.status === 'Rejected') {
          const dt = parseDateOnly(app.applicationDate);
          return {
            id: `rt-${app.id}-rejected-${dt.getTime()}`,
            title: 'Rejection logged',
            detail: `${student.name} • ${app.companyName}`,
            createdAt: dt,
            tone: 'negative' as const,
          };
        }
        if (app.status === 'Offer') {
          const dt = parseDateOnly(app.applicationDate);
          return {
            id: `rt-${app.id}-offer-${dt.getTime()}`,
            title: 'Offer secured',
            detail: `${student.name} • ${app.companyName}`,
            createdAt: dt,
            tone: 'positive' as const,
          };
        }
        return null;
      })
      .filter(Boolean) as NotificationItem[];

    if (allCandidates.length === 0) return;

    const interval = window.setInterval(() => {
      const pick = allCandidates[Math.floor(Math.random() * allCandidates.length)];
      if (!pick) return;
      // Avoid duplicates.
      setNotifications((current) => {
        if (current.some((n) => n.id === pick.id)) return current;
        const withNow = { ...pick, createdAt: new Date() };
        return [withNow, ...current].slice(0, 10);
      });
      setUnreadNotificationIds((current) => new Set([...Array.from(current), pick.id]));
    }, 22000);

    return () => window.clearInterval(interval);
  }, []);

  const studentByStudentId = React.useMemo(() => {
    const m = new Map<string, Student>();
    for (const s of MOCK_STUDENTS) m.set(s.studentId, s);
    return m;
  }, []);

  const eventsAll = React.useMemo<CalendarEvent[]>(() => {
    const toEventType = (t: JobApplication['upcomingEvent'] extends { type: infer U } ? U : any) => t;
    const items: CalendarEvent[] = [];

    for (const app of MOCK_APPLICATIONS) {
      const student = studentByStudentId.get(app.studentId);

      if (app.upcomingEvent?.date) {
        const dt = new Date(app.upcomingEvent.date);
        const type: UiEventType =
          app.upcomingEvent.type === 'Interview' ? 'Interview' : app.upcomingEvent.type === 'Screening' ? 'Screening' : 'Assessment';
        items.push({
          id: `e-${app.id}-${type}`,
          type,
          dateTime: dt,
          studentId: app.studentId,
          studentName: student?.name,
          companyName: app.companyName,
          meetingLink: app.upcomingEvent.meetingLink,
          prepNotes: app.upcomingEvent.prepNotes ?? app.notes ?? undefined,
          notes: app.notes ?? undefined,
        });
      }

      // Fallback event types for the calendar.
      const appDate = parseDateOnly(app.applicationDate);
      if (app.status === 'Rejected') {
        items.push({
          id: `e-${app.id}-rejection`,
          type: 'Rejection',
          dateTime: appDate,
          studentId: app.studentId,
          studentName: student?.name,
          companyName: app.companyName,
          notes: app.notes ?? undefined,
        });
      } else if (app.status === 'Screening Call') {
        items.push({
          id: `e-${app.id}-phone`,
          type: 'Phone Call',
          dateTime: appDate,
          studentId: app.studentId,
          studentName: student?.name,
          companyName: app.companyName,
          notes: app.notes ?? undefined,
        });
      }
    }

    return items.sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
  }, [studentByStudentId]);

  const eventsFiltered = React.useMemo(() => {
    return eventsAll.filter((e) => {
      if (calendarTypeFilter !== 'all' && e.type !== calendarTypeFilter) return false;
      if (calendarRoleFilter !== 'all') {
        // Role for calendar events is derived from student bucket (for events tied to students).
        if (!e.studentId) return false;
        const student = studentByStudentId.get(e.studentId);
        const bucket = student ? classifyStudentToBucket(student) : 'software-engineering';
        if (bucket !== calendarRoleFilter) return false;
      }
      return true;
    });
  }, [calendarRoleFilter, calendarTypeFilter, eventsAll, studentByStudentId]);

  const eventsByDayKey = React.useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of eventsFiltered) {
      const key = utcDayKey(e.dateTime);
      const list = m.get(key) || [];
      list.push(e);
      m.set(key, list);
    }
    // Sort each day newest first.
    for (const [key, list] of m.entries()) {
      list.sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
      m.set(key, list);
    }
    return m;
  }, [eventsFiltered]);

  const eventsForSelectedDay = React.useMemo(() => {
    const key = utcDayKey(selectedDate);
    return (eventsByDayKey.get(key) || []).sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  }, [eventsByDayKey, selectedDate]);

  const appsByDay = React.useMemo(() => {
    const map = new Map<string, JobApplication[]>();
    for (const app of MOCK_APPLICATIONS) {
      const key = utcDayKey(parseDateOnly(app.applicationDate));
      const list = map.get(key) || [];
      list.push(app);
      map.set(key, list);
    }
    return map;
  }, []);

  const activeWindowStart = React.useMemo(() => addDays(refDate, -6), [refDate]);
  const prevWindowStart = React.useMemo(() => addDays(refDate, -13), [refDate]);
  const prevWindowEnd = React.useMemo(() => addDays(refDate, -7), [refDate]);

  const applicationsForWindow = React.useMemo(() => {
    return MOCK_APPLICATIONS.filter((app) => {
      const d = parseDateOnly(app.applicationDate);
      return d >= activeWindowStart && d <= refDate;
    });
  }, [activeWindowStart, refDate]);

  const applicationsForPrevWindow = React.useMemo(() => {
    return MOCK_APPLICATIONS.filter((app) => {
      const d = parseDateOnly(app.applicationDate);
      return d >= prevWindowStart && d <= prevWindowEnd;
    });
  }, [prevWindowEnd, prevWindowStart]);

  const jobsAddedTodayByBucket = React.useMemo(() => {
    const m = new Map<RoleBucketId, number>();
    for (const bucket of ROLE_BUCKETS) m.set(bucket.id, 0);

    for (const app of MOCK_APPLICATIONS) {
      const d = parseDateOnly(app.applicationDate);
      if (!isSameUtcDay(d, refDate)) continue;
      const bucket = classifyJobRoleToBucket(app.jobRole);
      m.set(bucket, (m.get(bucket) || 0) + 1);
    }
    return m;
  }, [refDate]);

  const jobsAddedPrevDayByBucket = React.useMemo(() => {
    const prevDay = addDays(refDate, -1);
    const m = new Map<RoleBucketId, number>();
    for (const bucket of ROLE_BUCKETS) m.set(bucket.id, 0);

    for (const app of MOCK_APPLICATIONS) {
      const d = parseDateOnly(app.applicationDate);
      if (!isSameUtcDay(d, prevDay)) continue;
      const bucket = classifyJobRoleToBucket(app.jobRole);
      m.set(bucket, (m.get(bucket) || 0) + 1);
    }
    return m;
  }, [refDate]);

  const activeStudentsByBucket = React.useMemo(() => {
    const m = new Map<RoleBucketId, number>();
    for (const bucket of ROLE_BUCKETS) m.set(bucket.id, 0);

    for (const student of MOCK_STUDENTS) {
      const bucket = classifyStudentToBucket(student);
      const studentApps = MOCK_APPLICATIONS.filter((a) => a.studentId === student.studentId);
      const activeInWindow = studentApps.some((a) => {
        if (a.status === 'Rejected') return false;
        const d = parseDateOnly(a.applicationDate);
        return d >= activeWindowStart && d <= refDate;
      });
      if (activeInWindow) m.set(bucket, (m.get(bucket) || 0) + 1);
    }

    return m;
  }, [activeWindowStart, refDate]);

  const activeStudentsPrevByBucket = React.useMemo(() => {
    const m = new Map<RoleBucketId, number>();
    for (const bucket of ROLE_BUCKETS) m.set(bucket.id, 0);

    for (const student of MOCK_STUDENTS) {
      const bucket = classifyStudentToBucket(student);
      const studentApps = MOCK_APPLICATIONS.filter((a) => a.studentId === student.studentId);
      const activeInPrevWindow = studentApps.some((a) => {
        if (a.status === 'Rejected') return false;
        const d = parseDateOnly(a.applicationDate);
        return d >= prevWindowStart && d <= prevWindowEnd;
      });
      if (activeInPrevWindow) m.set(bucket, (m.get(bucket) || 0) + 1);
    }

    return m;
  }, [prevWindowEnd, prevWindowStart]);

  const pipelineTotalByBucket = React.useMemo(() => {
    // Pipeline = Applied/Phone/Interview/Assessment within last 7 days.
    const m = new Map<RoleBucketId, number>();
    for (const bucket of ROLE_BUCKETS) m.set(bucket.id, 0);

    const isInPipeline = (s: JobApplication['status']) => s === 'Applied' || s === 'Screening Call' || s === 'Interview' || s === 'Assessment';

    for (const app of applicationsForWindow) {
      if (!isInPipeline(app.status)) continue;
      const bucket = classifyJobRoleToBucket(app.jobRole);
      m.set(bucket, (m.get(bucket) || 0) + 1);
    }
    return m;
  }, [applicationsForWindow]);

  const pipelinePrevByBucket = React.useMemo(() => {
    const m = new Map<RoleBucketId, number>();
    for (const bucket of ROLE_BUCKETS) m.set(bucket.id, 0);
    const isInPipeline = (s: JobApplication['status']) => s === 'Applied' || s === 'Screening Call' || s === 'Interview' || s === 'Assessment';
    for (const app of applicationsForPrevWindow) {
      if (!isInPipeline(app.status)) continue;
      const bucket = classifyJobRoleToBucket(app.jobRole);
      m.set(bucket, (m.get(bucket) || 0) + 1);
    }
    return m;
  }, [applicationsForPrevWindow]);

  const avgAppliedTodayByBucket = React.useMemo(() => {
    // Average = applications added "today" / active students in bucket (both derived from mock and reference date).
    const m = new Map<RoleBucketId, { avg: number; denom: number; today: number; prevAvg: number }>();
    for (const bucket of ROLE_BUCKETS) m.set(bucket.id, { avg: 0, denom: 0, today: 0, prevAvg: 0 });

    for (const bucket of ROLE_BUCKETS) {
      const todayApps = jobsAddedTodayByBucket.get(bucket.id) || 0;
      const denom = activeStudentsByBucket.get(bucket.id) || 0;
      const prevDenom = activeStudentsPrevByBucket.get(bucket.id) || 0;
      const prevApps = jobsAddedPrevDayByBucket.get(bucket.id) || 0;
      const avg = denom > 0 ? todayApps / denom : 0;
      const prevAvg = prevDenom > 0 ? prevApps / prevDenom : 0;
      m.set(bucket.id, { avg, denom, today: todayApps, prevAvg });
    }

    return m;
  }, [activeStudentsByBucket, activeStudentsPrevByBucket, jobsAddedPrevDayByBucket, jobsAddedTodayByBucket]);

  function getSparkSeriesForBucket(bucket: RoleBucketId): number[] {
    // Last 7 days series for applications added for that role bucket.
    const series: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = addDays(refDate, -i);
      let count = 0;
      for (const app of MOCK_APPLICATIONS) {
        if (!isSameUtcDay(parseDateOnly(app.applicationDate), day)) continue;
        if (classifyJobRoleToBucket(app.jobRole) !== bucket) continue;
        count += 1;
      }
      series.push(count);
    }
    // Convert into signed deltas against previous day count for +/- visuals.
    const signed: number[] = [];
    for (let i = 0; i < series.length; i++) {
      const current = series[i];
      const prev = i === 0 ? series[i] : series[i - 1];
      signed.push(current - prev);
    }
    return signed;
  }

  function getSparkSeriesForRoleFilter(role: RoleBucketId | 'all'): number[] {
    if (role !== 'all') return getSparkSeriesForBucket(role);

    const series: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = addDays(refDate, -i);
      let count = 0;
      for (const app of MOCK_APPLICATIONS) {
        if (!isSameUtcDay(parseDateOnly(app.applicationDate), day)) continue;
        count += 1;
      }
      series.push(count);
    }

    const signed: number[] = [];
    for (let i = 0; i < series.length; i++) {
      const current = series[i];
      const prev = i === 0 ? series[i] : series[i - 1];
      signed.push(current - prev);
    }
    return signed;
  }

  const now = new Date();

  // Bottom module lists
  const studentList = React.useMemo(() => {
    const q = studentSearch.toLowerCase().trim();
    const list = MOCK_STUDENTS.map((s) => ({
      student: s,
      bucket: classifyStudentToBucket(s),
      appsToday: MOCK_APPLICATIONS.filter((a) => a.studentId === s.studentId && isSameUtcDay(parseDateOnly(a.applicationDate), refDate)).length,
    }));

    if (!q) return list;
    return list.filter((r) => `${r.student.name} ${r.student.email}`.toLowerCase().includes(q));
  }, [refDate, studentSearch]);

  const appListToday = React.useMemo(() => {
    const q = appSearch.toLowerCase().trim();
    const list = MOCK_APPLICATIONS
      .filter((a) => isSameUtcDay(parseDateOnly(a.applicationDate), refDate))
      .map((a) => {
        const student = studentByStudentId.get(a.studentId);
        return {
          app: a,
          studentName: student?.name || 'Unknown',
          bucket: classifyJobRoleToBucket(a.jobRole),
          studentId: a.studentId,
        };
      });

    if (!q) return list;
    return list.filter((r) => `${r.studentName} ${r.app.companyName} ${r.app.jobRole} ${r.app.status}`.toLowerCase().includes(q));
  }, [appSearch, refDate, studentByStudentId]);

  const selectedTabCopy: Record<typeof activeKpiTab, { title: string; subtitle: string }> = {
    'active-students': {
      title: 'Active Students',
      subtitle: 'Students with recent pipeline activity (excluding Rejected), grouped by role bucket.',
    },
    'jobs-added-today': {
      title: 'Jobs Added Today',
      subtitle: 'New applications created today, grouped by the role inferred from the job posting.',
    },
    'interview-pipeline': {
      title: 'Interview Pipeline',
      subtitle: 'Pipeline volume over the last 7 days (Applied/Phone/Interview/Assessment), with momentum deltas.',
    },
    'avg-applied-per-student': {
      title: 'Avg Jobs Applied per Student',
      subtitle: 'Applications added today divided by active students in each role bucket.',
    },
  };

  const header = selectedTabCopy[activeKpiTab];

  return (
    <RoleGate expectedRole="admin">
      <DashboardLayout>
        <div className="space-y-8">
          {/* Hero */}
          <section className="rounded-3xl border border-slate-200 bg-slate-900 text-white p-8 md:p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(20,184,166,0.2),transparent_38%),radial-gradient(circle_at_85%_30%,rgba(14,165,233,0.2),transparent_30%)]" />
            <div className="relative flex flex-col lg:flex-row justify-between gap-8">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300 font-semibold">Admin Dashboard</p>
                <h1 className="mt-2 text-3xl md:text-4xl font-display font-black tracking-tight">CareerOrbit Command Center</h1>
                <p className="mt-3 text-slate-300 max-w-2xl">
                  Data-driven overview of operations: track momentum by role, see upcoming events on the calendar, and respond to live notifications.
                </p>
              </div>
            </div>
          </section>

          {/* KPI Tabs */}
          <section className="panel-surface rounded-3xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 bg-white/70">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Operations Overview</p>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">{header.title}</h2>
                  <p className="text-sm text-slate-500 mt-1">{header.subtitle}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <div className="inline-flex w-fit rounded-xl bg-slate-100 border border-slate-200 p-1">
                    <button
                      onClick={() => setActiveKpiTab('active-students')}
                      className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                        activeKpiTab === 'active-students' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      Active Students
                    </button>
                    <button
                      onClick={() => setActiveKpiTab('jobs-added-today')}
                      className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                        activeKpiTab === 'jobs-added-today' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <BriefcaseBusiness className="w-4 h-4" />
                      Jobs Added Today
                    </button>
                    <button
                      onClick={() => setActiveKpiTab('interview-pipeline')}
                      className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                        activeKpiTab === 'interview-pipeline' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-amber-200 inline-block" />
                      Interview Pipeline
                    </button>
                    <button
                      onClick={() => setActiveKpiTab('avg-applied-per-student')}
                      className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                        activeKpiTab === 'avg-applied-per-student' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-teal-200 inline-block" />
                      Avg Applied / Student
                    </button>
                  </div>

                  <label className="text-xs font-semibold text-slate-600">
                    Role
                    <select
                      value={kpiRoleFilter}
                      onChange={(e) => setKpiRoleFilter(e.target.value as RoleBucketId | 'all')}
                      className="ml-2 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700"
                    >
                      <option value="all">All roles</option>
                      {ROLE_BUCKETS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </div>

            {/* Focused Role Panel */}
            <div className="p-6">
              {(() => {
                const label = kpiRoleFilter === 'all' ? 'All roles' : roleLabel(kpiRoleFilter);
                const series = getSparkSeriesForRoleFilter(kpiRoleFilter);

                const sumMap = (m: Map<RoleBucketId, number>) => ROLE_BUCKETS.reduce((acc, b) => acc + (m.get(b.id) || 0), 0);

                const currentActive =
                  kpiRoleFilter === 'all' ? sumMap(activeStudentsByBucket) : (activeStudentsByBucket.get(kpiRoleFilter) || 0);
                const prevActive =
                  kpiRoleFilter === 'all' ? sumMap(activeStudentsPrevByBucket) : (activeStudentsPrevByBucket.get(kpiRoleFilter) || 0);

                const currentJobsToday =
                  kpiRoleFilter === 'all' ? sumMap(jobsAddedTodayByBucket) : (jobsAddedTodayByBucket.get(kpiRoleFilter) || 0);
                const prevJobsYesterday =
                  kpiRoleFilter === 'all' ? sumMap(jobsAddedPrevDayByBucket) : (jobsAddedPrevDayByBucket.get(kpiRoleFilter) || 0);

                const currentPipeline =
                  kpiRoleFilter === 'all' ? sumMap(pipelineTotalByBucket) : (pipelineTotalByBucket.get(kpiRoleFilter) || 0);
                const prevPipeline =
                  kpiRoleFilter === 'all' ? sumMap(pipelinePrevByBucket) : (pipelinePrevByBucket.get(kpiRoleFilter) || 0);

                // Avg applied per student (today / active students)
                const allTodayApps = sumMap(jobsAddedTodayByBucket);
                const allPrevApps = sumMap(jobsAddedPrevDayByBucket);
                const allDenom = sumMap(activeStudentsByBucket);
                const allPrevDenom = sumMap(activeStudentsPrevByBucket);

                const avgStats =
                  kpiRoleFilter === 'all'
                    ? {
                        today: allTodayApps,
                        denom: allDenom,
                        avg: allDenom > 0 ? allTodayApps / allDenom : 0,
                        prevAvg: allPrevDenom > 0 ? allPrevApps / allPrevDenom : 0,
                      }
                    : (avgAppliedTodayByBucket.get(kpiRoleFilter) || { avg: 0, denom: 0, today: 0, prevAvg: 0 });

                let headlineValue = '';
                let subLeft = '';
                let subRight = '';
                let deltaPct = 0;

                if (activeKpiTab === 'active-students') {
                  headlineValue = String(currentActive);
                  deltaPct = getDeltaPct(currentActive, prevActive);
                  subLeft = 'Active in last 7d';
                  subRight = `${prevActive} prev`;
                } else if (activeKpiTab === 'jobs-added-today') {
                  headlineValue = String(currentJobsToday);
                  deltaPct = getDeltaPct(currentJobsToday, prevJobsYesterday);
                  subLeft = `Added on ${format(refDate, 'MMM d')}`;
                  subRight = `${prevJobsYesterday} yesterday`;
                } else if (activeKpiTab === 'interview-pipeline') {
                  headlineValue = String(currentPipeline);
                  deltaPct = getDeltaPct(currentPipeline, prevPipeline);
                  subLeft = 'Applied → Assessment';
                  subRight = `${prevPipeline} prev`;
                } else {
                  headlineValue = avgStats.avg.toFixed(1);
                  deltaPct = avgStats.prevAvg === 0 ? (avgStats.avg > 0 ? 100 : 0) : ((avgStats.avg - avgStats.prevAvg) / avgStats.prevAvg) * 100;
                  subLeft = 'Apps today / active students';
                  subRight = `${avgStats.today} / ${avgStats.denom}`;
                }

                // Pipeline distribution for the selected filter
                const statusCounts: Record<JobApplication['status'], number> = {
                  Applied: 0,
                  'Screening Call': 0,
                  Interview: 0,
                  Assessment: 0,
                  Rejected: 0,
                  Offer: 0,
                };

                if (activeKpiTab === 'interview-pipeline') {
                  for (const app of applicationsForWindow) {
                    if (kpiRoleFilter !== 'all' && classifyJobRoleToBucket(app.jobRole) !== kpiRoleFilter) continue;
                    statusCounts[app.status] += 1;
                  }
                }

                const pipelineMax = Math.max(1, statusCounts.Applied + statusCounts['Screening Call'] + statusCounts.Interview + statusCounts.Assessment);

                return (
                  <div className="rounded-3xl border border-slate-200 bg-white p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wider font-bold text-slate-500">{label}</p>
                        <div className="mt-2 flex items-end gap-3 flex-wrap">
                          <p className="text-4xl font-black text-slate-900">{headlineValue}</p>
                          <div className={`inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-bold ${deltaToneClass(deltaPct)}`}>
                            {deltaIcon(deltaPct)}
                            {deltaPct >= 0 ? '+' : '–'}
                            {Math.abs(deltaPct).toFixed(0)}%
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-4 text-xs text-slate-500 max-w-md">
                          <span>{subLeft}</span>
                          <span className="font-semibold text-slate-700">{subRight}</span>
                        </div>
                      </div>

                      <div className="min-w-[240px]">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Trend (last 7 days)</p>
                        <div className="mt-3">
                          <SparkBars series={series} positiveColor="bg-emerald-500/70" negativeColor="bg-rose-500/70" />
                        </div>
                      </div>
                    </div>

                    {activeKpiTab === 'interview-pipeline' && (
                      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Stage Breakdown</p>
                        <div className="mt-3">
                          <div className="flex items-end gap-2 h-10">
                            <div className="flex-1">
                              <div className="bg-slate-200 rounded-md h-2.5" style={{ width: `${(statusCounts.Applied / pipelineMax) * 100}%` }} />
                            </div>
                            <div className="flex-1">
                              <div className="bg-indigo-200 rounded-md h-2.5" style={{ width: `${(statusCounts['Screening Call'] / pipelineMax) * 100}%` }} />
                            </div>
                            <div className="flex-1">
                              <div className="bg-amber-200 rounded-md h-2.5" style={{ width: `${(statusCounts.Interview / pipelineMax) * 100}%` }} />
                            </div>
                            <div className="flex-1">
                              <div className="bg-violet-200 rounded-md h-2.5" style={{ width: `${(statusCounts.Assessment / pipelineMax) * 100}%` }} />
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(['Applied', 'Screening Call', 'Interview', 'Assessment'] as const).map((s) => {
                              const c = statusCounts[s];
                              if (c === 0) return null;
                              return (
                                <span key={s} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                                  {statusToStageLine(s)}
                                  <span className="text-slate-900">{c}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeKpiTab === 'avg-applied-per-student' && (
                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Today Apps</p>
                          <p className="mt-2 text-2xl font-black text-slate-900">{avgStats.today}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Students</p>
                          <p className="mt-2 text-2xl font-black text-slate-900">{avgStats.denom}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </section>

          {/* Calendar + Notifications */}
          <section className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Calendar */}
            <div className="xl:col-span-3 rounded-3xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-slate-700" />
                    <h3 className="text-lg font-bold text-slate-900">Student Events Calendar</h3>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">Interviews, screenings, phone calls, assessments, and rejections.</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Role
                    <select
                      value={calendarRoleFilter}
                      onChange={(e) => setCalendarRoleFilter(e.target.value as RoleBucketId | 'all')}
                      className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                    >
                      <option value="all">All</option>
                      {ROLE_BUCKETS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-xs font-semibold text-slate-600">
                    Type
                    <select
                      value={calendarTypeFilter}
                      onChange={(e) => setCalendarTypeFilter(e.target.value as UiEventType | 'all')}
                      className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                    >
                      <option value="all">All</option>
                      {(['Interview', 'Screening', 'Phone Call', 'Assessment', 'Rejection'] as UiEventType[]).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCurrentMonth((m) => subMonths(m, 1));
                      }}
                      className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                      aria-label="Previous month"
                    >
                      <span className="text-slate-600 font-black">‹</span>
                    </button>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{format(currentMonth, 'MMMM yyyy')}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Click a day to see events</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCurrentMonth(new Date());
                        setSelectedDate(new Date());
                      }}
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700"
                    >
                      Today
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                  <div className="lg:col-span-3">
                    {(() => {
                      const monthStart = startOfMonth(currentMonth);
                      const monthEnd = endOfMonth(monthStart);
                      const start = startOfWeek(monthStart);
                      const end = endOfWeek(monthEnd);
                      const days = eachDayOfInterval({ start, end });

                      return (
                        <>
                          <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                              <div key={d} className="py-2 text-center text-[11px] font-bold uppercase tracking-widest bg-white">
                                {d}
                              </div>
                            ))}
                            {days.map((day) => {
                              const dateKey = utcDayKey(day);
                              const list = eventsByDayKey.get(dateKey) || [];
                              const isSelected = isSameDay(day, selectedDate);
                              const isCurrentMonth = isSameMonth(day, monthStart);
                              return (
                                <button
                                  key={day.toISOString()}
                                  onClick={() => setSelectedDate(day)}
                                  className={`min-h-[90px] p-2 bg-white hover:bg-slate-50 text-left transition-colors ${
                                    !isCurrentMonth ? 'bg-slate-50/50' : ''
                                  } ${isSelected ? 'ring-2 ring-inset ring-indigo-600 z-10 relative' : ''}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span
                                      className={`text-sm font-bold ${
                                        !isCurrentMonth ? 'text-slate-300' : isSameDay(day, new Date()) ? 'bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-slate-700'
                                      }`}
                                    >
                                      {format(day, 'd')}
                                    </span>
                                    {list.length > 0 && (
                                      <span className="text-[10px] font-extrabold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                        {list.length}
                                      </span>
                                    )}
                                  </div>

                                  <div className="mt-2 space-y-1">
                                    {list.slice(0, 2).map((ev) => (
                                      <div key={ev.id} className="truncate">
                                        <EventChip type={ev.type} />
                                      </div>
                                    ))}
                                    {list.length > 2 && (
                                      <div className="text-[10px] font-bold text-slate-500">+{list.length - 2} more</div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="lg:col-span-2">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Events on {format(selectedDate, 'MMM d, yyyy')}</h4>
                          <p className="text-xs text-slate-500 mt-1">{eventsForSelectedDay.length} total</p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3 max-h-[360px] overflow-y-auto pr-1">
                        {eventsForSelectedDay.length === 0 ? (
                          <div className="text-center py-10">
                            <p className="text-sm font-semibold text-slate-500">No events scheduled for this day.</p>
                            <p className="text-xs text-slate-400 mt-1">Try changing filters.</p>
                          </div>
                        ) : (
                          eventsForSelectedDay.map((ev) => (
                            <div key={ev.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <EventChip type={ev.type} />
                                <p className="text-[11px] font-bold text-slate-500">{format(ev.dateTime, 'h:mm a')}</p>
                              </div>
                              <div className="mt-2">
                                <p className="text-sm font-bold text-slate-900">{ev.companyName || '—'}</p>
                                <p className="text-xs text-slate-500 mt-1">{ev.studentName ? `Student: ${ev.studentName}` : 'System event'}</p>
                              </div>
                              {(ev.prepNotes || ev.notes) && (
                                <div className="mt-2 pt-2 border-t border-slate-200">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notes</p>
                                  <p className="text-xs text-slate-600 mt-1">{(ev.prepNotes ?? ev.notes)!.slice(0, 140)}{(ev.prepNotes ?? ev.notes)!.length > 140 ? '…' : ''}</p>
                                </div>
                              )}
                              {ev.meetingLink && (
                                <a
                                  href={ev.meetingLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold py-2 hover:bg-indigo-700"
                                >
                                  Join / Open
                                </a>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <aside className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-slate-700" />
                    <h3 className="text-lg font-bold text-slate-900">Real-Time Notifications</h3>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">Important updates for admin decision-making.</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                  <span className="inline-flex items-center justify-center rounded-full bg-red-50 border border-red-100 text-red-700 text-xs font-extrabold w-9 h-9">
                    {unreadNotificationIds.size}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {/* Action row */}
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-slate-500">Grouped by urgency</p>
                  <button
                    onClick={() => setUnreadNotificationIds(new Set())}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="max-h-[480px] overflow-y-auto pr-1 space-y-3">
                  {notifications.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-sm font-semibold text-slate-500">No notifications yet.</p>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const isUnread = unreadNotificationIds.has(n.id);
                      const toneClasses =
                        n.tone === 'positive'
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-900'
                          : n.tone === 'negative'
                            ? 'bg-rose-50 border-rose-100 text-rose-900'
                            : 'bg-slate-50 border-slate-200 text-slate-900';

                      return (
                        <button
                          key={n.id}
                          onClick={() => {
                            setUnreadNotificationIds((current) => {
                              const next = new Set(current);
                              next.delete(n.id);
                              return next;
                            });
                          }}
                          className={`w-full text-left rounded-2xl border p-4 hover:bg-slate-50 transition-colors ${toneClasses}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-extrabold text-slate-900">
                                {n.title}
                                {isUnread && (
                                  <span className="ml-2 inline-flex align-middle rounded-full bg-red-500 text-white text-[10px] font-bold px-2 py-0.5">
                                    NEW
                                  </span>
                                )}
                              </p>
                              <p className="text-xs font-semibold text-slate-700 mt-1">{n.detail}</p>
                            </div>
                            <p className="text-[11px] font-bold text-slate-600 whitespace-nowrap">{formatRelativeTime(n.createdAt, now)}</p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </aside>
          </section>

          {/* Bottom Modules */}
          <section className="panel-surface rounded-3xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 bg-white/70 flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Workflow Modules</p>
                <h2 className="text-xl font-bold text-slate-900 mt-1">Students & Applications</h2>
                <p className="text-sm text-slate-500 mt-1">Jump into the list view you need for quick follow-ups.</p>
              </div>

              <div className="inline-flex w-fit rounded-xl bg-slate-100 border border-slate-200 p-1">
                <button
                  onClick={() => setBottomTab('students')}
                  className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    bottomTab === 'students' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4" /> Students
                </button>
                <button
                  onClick={() => setBottomTab('applications')}
                  className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    bottomTab === 'applications' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BriefcaseBusiness className="w-4 h-4" /> Applications
                </button>
              </div>
            </div>

            <div className="p-6">
              {bottomTab === 'students' ? (
                <>
                  <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">Students</p>
                      <span className="text-xs text-slate-500">filtered by role</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="text-xs font-semibold text-slate-600">
                        Role
                        <select
                          value={bottomRoleFilter}
                          onChange={(e) => setBottomRoleFilter(e.target.value as RoleBucketId | 'all')}
                          className="ml-2 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700"
                        >
                          <option value="all">All roles</option>
                          {ROLE_BUCKETS.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          placeholder="Search students..."
                          className="w-full sm:w-72 pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-teal-600/25"
                        />
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const filtered =
                      bottomRoleFilter === 'all' ? studentList : studentList.filter((r) => r.bucket === bottomRoleFilter);

                    const title =
                      bottomRoleFilter === 'all'
                        ? 'All roles'
                        : roleLabel(bottomRoleFilter);

                    return (
                      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/70">
                          <div>
                            <p className="text-sm font-extrabold text-slate-900">{title}</p>
                            <p className="text-xs font-semibold text-slate-500 mt-1">{filtered.length} students</p>
                          </div>
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-700">
                            {filtered.reduce((acc, r) => acc + r.appsToday, 0)} apps today
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-white">
                                <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Name</th>
                                <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Role</th>
                                <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Graduation</th>
                                <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-bold text-right">Apps Today</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {filtered.map((r) => (
                                <tr key={r.student.id} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="min-w-0">
                                      <p className="text-sm font-extrabold text-slate-900 truncate">{r.student.name}</p>
                                      <p className="text-xs font-semibold text-slate-500 truncate">{r.student.email}</p>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-slate-700">
                                    {roleLabel(r.bucket)}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-slate-700">{r.student.graduationYear}</td>
                                  <td className="px-6 py-4 text-right">
                                    <span className="inline-flex rounded-md bg-slate-100 text-slate-700 px-2.5 py-1 text-xs font-semibold">
                                      {r.appsToday}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                              {filtered.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                                    No students found for this filter.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">Applications Added Today</p>
                      <span className="text-xs text-slate-500">filtered by role</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="text-xs font-semibold text-slate-600">
                        Role
                        <select
                          value={bottomRoleFilter}
                          onChange={(e) => setBottomRoleFilter(e.target.value as RoleBucketId | 'all')}
                          className="ml-2 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700"
                        >
                          <option value="all">All roles</option>
                          {ROLE_BUCKETS.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          value={appSearch}
                          onChange={(e) => setAppSearch(e.target.value)}
                          placeholder="Search applications..."
                          className="w-full sm:w-72 pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-teal-600/25"
                        />
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const filtered =
                      bottomRoleFilter === 'all' ? appListToday : appListToday.filter((r) => r.bucket === bottomRoleFilter);

                    const title =
                      bottomRoleFilter === 'all'
                        ? 'All roles'
                        : roleLabel(bottomRoleFilter);

                    return (
                      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/70">
                          <div>
                            <p className="text-sm font-extrabold text-slate-900">{title}</p>
                            <p className="text-xs font-semibold text-slate-500 mt-1">{filtered.length} applications • {format(refDate, 'MMM d')}</p>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-white">
                                <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Student</th>
                                <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Company</th>
                                <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Job Role</th>
                                <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Stage</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {filtered.map((r) => (
                                <tr key={r.app.id} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">{r.studentName}</td>
                                  <td className="px-6 py-4 text-sm text-slate-700">{r.app.companyName}</td>
                                  <td className="px-6 py-4 text-sm text-slate-700">{r.app.jobRole}</td>
                                  <td className="px-6 py-4">
                                    <span
                                      className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                                        r.app.status === 'Offer'
                                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                          : r.app.status === 'Rejected'
                                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                                            : r.app.status === 'Interview'
                                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                                              : r.app.status === 'Screening Call'
                                                ? 'bg-cyan-100 text-cyan-800 border-cyan-200'
                                                : r.app.status === 'Assessment'
                                                  ? 'bg-violet-100 text-violet-800 border-violet-200'
                                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                                      }`}
                                    >
                                      {r.app.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                              {filtered.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                                    No applications found for this filter.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </section>
        </div>
      </DashboardLayout>
    </RoleGate>
  );
}

