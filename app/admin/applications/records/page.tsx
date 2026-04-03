'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import RoleGate from '@/components/RoleGate';
import { adminPremiumUi } from '@/lib/admin/admin-theme';
import { cn } from '@/lib/utils';
import { APPLICATION_CATEGORY_MAP, type ApplicationCategory } from '@/lib/admin/applications-store';
import { toDateInputValue } from '@/lib/admin/date-utils';
import { apiFetchJson } from '@/lib/client/api';

type AppliedRecord = {
  id: string;
  studentName: string;
  studentEmail: string;
  companyName: string;
  jobTitle: string;
  category: string;
  appliedOn: string;
};

type JobCategory = ApplicationCategory;

const DEFAULT_TO_DATE = toDateInputValue(new Date());
const DEFAULT_FROM_DATE = toDateInputValue(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));

export default function AdminAppliedRecordsPage() {
  const [records, setRecords] = React.useState<AppliedRecord[]>([]);
  const [categoryFilter, setCategoryFilter] = React.useState<JobCategory | 'all'>('all');
  const [studentFilter, setStudentFilter] = React.useState<string>('all');
  const [fromDate, setFromDate] = React.useState<string>(DEFAULT_FROM_DATE);
  const [toDate, setToDate] = React.useState<string>(DEFAULT_TO_DATE);

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
              Review all recorded applications by student and job after the external apply step.
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
                      <th className={adminPremiumUi.tableHeadCell}>Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className={adminPremiumUi.tableRow}>
                        <td className={adminPremiumUi.tableCell}>{record.appliedOn}</td>
                        <td className={adminPremiumUi.tableCell}>
                          <p className="font-semibold text-slate-100">{record.studentName}</p>
                          <p className="text-xs text-slate-400">{record.studentEmail}</p>
                        </td>
                        <td className={adminPremiumUi.tableCell}>{record.companyName}</td>
                        <td className={adminPremiumUi.tableCell}>{record.jobTitle}</td>
                        <td className={adminPremiumUi.tableCell}>{record.category}</td>
                      </tr>
                    ))}
                    {filteredRecords.length === 0 && (
                      <tr>
                        <td colSpan={5} className={adminPremiumUi.emptyState}>
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
