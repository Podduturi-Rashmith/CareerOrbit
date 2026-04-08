'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import RoleGate from '@/components/RoleGate';
import { adminPremiumUi } from '@/lib/admin/admin-theme';
import { cn } from '@/lib/utils';
import { APPLICATION_CATEGORY_MAP, type ApplicationCategory } from '@/lib/admin/applications-store';
import { toDateInputValue } from '@/lib/admin/date-utils';
import { apiFetchJson } from '@/lib/client/api';
import { ChevronDown, ChevronUp, Check, Loader2 } from 'lucide-react';

type ApplicationUiStatus = 'Applied' | 'Screening Call' | 'Interview' | 'Assessment' | 'Rejected' | 'Offer';
type CalendarEventType = 'Screening' | 'Interview' | 'Assessment';

type UpcomingEvent = {
  type: CalendarEventType;
  date: string;
  meetingLink?: string;
  prepNotes?: string;
};

type AppliedRecord = {
  id: string;
  studentName: string;
  studentEmail: string;
  companyName: string;
  jobTitle: string;
  category: string;
  appliedOn: string;
  status?: ApplicationUiStatus;
  upcomingEvent?: UpcomingEvent;
  notes?: string;
};

type JobCategory = ApplicationCategory;

const STATUS_OPTIONS: ApplicationUiStatus[] = [
  'Applied', 'Screening Call', 'Interview', 'Assessment', 'Rejected', 'Offer',
];

const EVENT_TYPE_OPTIONS: CalendarEventType[] = ['Screening', 'Interview', 'Assessment'];

const STATUS_COLORS: Record<ApplicationUiStatus, string> = {
  Applied: 'bg-sky-900/40 text-sky-300 border-sky-700/50',
  'Screening Call': 'bg-cyan-900/40 text-cyan-300 border-cyan-700/50',
  Interview: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
  Assessment: 'bg-violet-900/40 text-violet-300 border-violet-700/50',
  Rejected: 'bg-rose-900/40 text-rose-300 border-rose-700/50',
  Offer: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
};

const DEFAULT_TO_DATE = toDateInputValue(new Date());
const DEFAULT_FROM_DATE = toDateInputValue(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));

function EditPanel({
  record,
  onSaved,
}: {
  record: AppliedRecord;
  onSaved: (updated: AppliedRecord) => void;
}) {
  const [status, setStatus] = React.useState<ApplicationUiStatus>(record.status ?? 'Applied');
  const [notes, setNotes] = React.useState(record.notes ?? '');
  const [hasEvent, setHasEvent] = React.useState(!!record.upcomingEvent);
  const [eventType, setEventType] = React.useState<CalendarEventType>(
    record.upcomingEvent?.type ?? 'Interview'
  );
  const [eventDate, setEventDate] = React.useState(record.upcomingEvent?.date?.slice(0, 16) ?? '');
  const [meetingLink, setMeetingLink] = React.useState(record.upcomingEvent?.meetingLink ?? '');
  const [prepNotes, setPrepNotes] = React.useState(record.upcomingEvent?.prepNotes ?? '');
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const upcomingEvent =
        hasEvent && eventDate
          ? {
              type: eventType,
              date: new Date(eventDate).toISOString(),
              meetingLink: meetingLink || undefined,
              prepNotes: prepNotes || undefined,
            }
          : null;

      const res = await fetch(`/api/admin/applications/${record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, notes, upcomingEvent }),
      });
      const data = await res.json();
      if (res.ok && data.record) {
        onSaved(data.record as AppliedRecord);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-6 pb-6 pt-2 bg-slate-900/60 border-t border-white/10 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className={adminPremiumUi.fieldLabel}>
          Application Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ApplicationUiStatus)}
            className={adminPremiumUi.select}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className={adminPremiumUi.fieldLabel}>
          Internal Notes
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Visible to student on their app detail"
            className={adminPremiumUi.input}
          />
        </label>
      </div>

      <div className="rounded-xl border border-white/10 p-4 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hasEvent}
            onChange={(e) => setHasEvent(e.target.checked)}
            className="rounded border-slate-600 bg-slate-800 accent-lime-400"
          />
          <span className="text-sm font-semibold text-slate-200">Add / Update Upcoming Event</span>
        </label>

        {hasEvent && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <label className={adminPremiumUi.fieldLabel}>
              Event Type
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as CalendarEventType)}
                className={adminPremiumUi.select}
              >
                {EVENT_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className={adminPremiumUi.fieldLabel}>
              Date & Time
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className={adminPremiumUi.input}
              />
            </label>
            <label className={adminPremiumUi.fieldLabel}>
              Meeting Link
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://zoom.us/..."
                className={adminPremiumUi.input}
              />
            </label>
            <label className={adminPremiumUi.fieldLabel}>
              Prep Notes for Student
              <input
                type="text"
                value={prepNotes}
                onChange={(e) => setPrepNotes(e.target.value)}
                placeholder="Review STAR method, research the company..."
                className={adminPremiumUi.input}
              />
            </label>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-lime-400 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-lime-300 disabled:opacity-60 transition-colors"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : null}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

export default function AdminAppliedRecordsPage() {
  const [records, setRecords] = React.useState<AppliedRecord[]>([]);
  const [categoryFilter, setCategoryFilter] = React.useState<JobCategory | 'all'>('all');
  const [studentFilter, setStudentFilter] = React.useState<string>('all');
  const [fromDate, setFromDate] = React.useState<string>(DEFAULT_FROM_DATE);
  const [toDate, setToDate] = React.useState<string>(DEFAULT_TO_DATE);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      const data = await apiFetchJson<{ records: AppliedRecord[] }>('/api/admin/applications');
      setRecords(Array.isArray(data.records) ? data.records : []);
    };
    load().catch(() => setRecords([]));
  }, []);

  const categoryOptions = React.useMemo(
    () => Object.keys(APPLICATION_CATEGORY_MAP) as JobCategory[],
    []
  );

  const studentOptions = React.useMemo(() => {
    const scoped = categoryFilter === 'all'
      ? records
      : records.filter((record) => record.category === categoryFilter);
    const map = new Map<string, string>();
    scoped.forEach((record) => {
      map.set(record.studentEmail, record.studentName);
    });
    return Array.from(map.entries()).map(([email, name]) => ({ email, name }));
  }, [categoryFilter, records]);

  React.useEffect(() => {
    if (studentFilter === 'all') return;
    if (!studentOptions.some((student) => student.email === studentFilter)) {
      setStudentFilter('all');
    }
  }, [studentFilter, studentOptions]);

  const filteredRecords = React.useMemo(() => {
    const fromTime = fromDate ? Date.parse(fromDate) : Number.NEGATIVE_INFINITY;
    const toTime = toDate ? Date.parse(toDate) + 24 * 60 * 60 * 1000 - 1 : Number.POSITIVE_INFINITY;

    return records.filter((record) => {
      if (categoryFilter !== 'all' && record.category !== categoryFilter) return false;
      if (studentFilter !== 'all' && record.studentEmail !== studentFilter) return false;
      const appliedTime = Date.parse(record.appliedOn);
      if (!Number.isNaN(appliedTime) && (appliedTime < fromTime || appliedTime > toTime)) return false;
      return true;
    });
  }, [categoryFilter, fromDate, records, studentFilter, toDate]);

  const handleRecordSaved = (updated: AppliedRecord) => {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
  };

  return (
    <RoleGate expectedRole="admin">
      <DashboardLayout>
        <div className="space-y-6">
          <section className={adminPremiumUi.hero}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-200/80">
              Applications Subpage
            </p>
            <h1 className="mt-2 text-3xl font-display font-black tracking-tight text-white md:text-4xl">
              Applied Jobs Records
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-300 md:text-base">
              Review all recorded applications and update status, calendar events, and notes visible to students.
            </p>
          </section>

          <section className={cn(adminPremiumUi.surface, 'overflow-hidden')}>
            <div className={cn(adminPremiumUi.sectionHeader, 'px-6 py-5')}>
              <h2 className="text-xl font-black text-white">Applied Records</h2>
            </div>
            <div className="p-6">
              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                <label className={adminPremiumUi.fieldLabel}>
                  Category
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as JobCategory | 'all')}
                    className={adminPremiumUi.select}
                  >
                    <option value="all">All Categories</option>
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={adminPremiumUi.fieldLabel}>
                  Student
                  <select
                    value={studentFilter}
                    onChange={(e) => setStudentFilter(e.target.value)}
                    className={adminPremiumUi.select}
                  >
                    <option value="all">All Students</option>
                    {studentOptions.map((student) => (
                      <option key={student.email} value={student.email}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={adminPremiumUi.fieldLabel}>
                  From
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className={adminPremiumUi.input}
                  />
                </label>
                <label className={adminPremiumUi.fieldLabel}>
                  To
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className={adminPremiumUi.input}
                  />
                </label>
              </div>

              <div className={adminPremiumUi.tableWrap}>
                <table className="w-full text-left">
                  <thead>
                    <tr className={adminPremiumUi.tableHeadRow}>
                      <th className={adminPremiumUi.tableHeadCell}>Date</th>
                      <th className={adminPremiumUi.tableHeadCell}>Student</th>
                      <th className={adminPremiumUi.tableHeadCell}>Company</th>
                      <th className={adminPremiumUi.tableHeadCell}>Job</th>
                      <th className={adminPremiumUi.tableHeadCell}>Status</th>
                      <th className={adminPremiumUi.tableHeadCell}>Update</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredRecords.map((record) => {
                      const isExpanded = expandedId === record.id;
                      const statusLabel = record.status ?? 'Applied';
                      return (
                        <React.Fragment key={record.id}>
                          <tr className={adminPremiumUi.tableRow}>
                            <td className={adminPremiumUi.tableCell}>{record.appliedOn}</td>
                            <td className={adminPremiumUi.tableCell}>
                              <p className="font-semibold text-slate-100">{record.studentName}</p>
                              <p className="text-xs text-slate-400">{record.studentEmail}</p>
                            </td>
                            <td className={adminPremiumUi.tableCell}>{record.companyName}</td>
                            <td className={adminPremiumUi.tableCell}>{record.jobTitle}</td>
                            <td className={adminPremiumUi.tableCell}>
                              <span className={cn(
                                'rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                                STATUS_COLORS[statusLabel]
                              )}>
                                {statusLabel}
                              </span>
                            </td>
                            <td className={adminPremiumUi.tableCell}>
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : record.id)}
                                className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/5 transition-colors"
                              >
                                {isExpanded ? (
                                  <><ChevronUp className="w-3.5 h-3.5" /> Close</>
                                ) : (
                                  <><ChevronDown className="w-3.5 h-3.5" /> Edit</>
                                )}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={6} className="p-0">
                                <EditPanel
                                  record={record}
                                  onSaved={(updated) => {
                                    handleRecordSaved(updated);
                                  }}
                                />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {filteredRecords.length === 0 && (
                      <tr>
                        <td colSpan={6} className={adminPremiumUi.emptyState}>
                          No applied records found for selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </DashboardLayout>
    </RoleGate>
  );
}
