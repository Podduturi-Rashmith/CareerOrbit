'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

type NewUserSubmission = {
  id: string;
  userId: string;
  name: string;
  email: string;
  preferredName: string;
  dateOfBirth: string | null;
  linkedInUrl: string | null;
  resumeEmail: string;
  resumePhone: string;
  personalPhone: string;
  address: string;
  workExperiences: Array<{
    companyName: string;
    location: string;
    startDate: string;
    endDate?: string | null;
    points: string[];
  }>;
  education: {
    masters?: { university?: string | null; field?: string | null; completed?: string | null } | null;
    bachelors?: { university?: string | null; field?: string | null; completed?: string | null } | null;
  } | null;
  visaStatus: string;
  arrivalDate: string | null;
  certifications: string | null;
  preferredRole: string;
  legalName: string;
  signedDate: string | null;
  createdAt: string;
  status: string;
};

export default function AdminNewUsersPage() {
  const [newUsers, setNewUsers] = useState<NewUserSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNewUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/new-users', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load new users');
      const data = await response.json();
      setNewUsers(data.newUsers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load new users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNewUsers().catch(() => undefined);
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-black text-slate-900">New Users</h1>
              <p className="text-sm text-slate-500">First-time registration forms submitted by students.</p>
            </div>
            <button
              onClick={loadNewUsers}
              className="text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              Refresh
            </button>
          </div>

          {loading && <p className="mt-4 text-sm text-slate-500">Loading new users...</p>}
          {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
          {!loading && !error && newUsers.length === 0 && (
            <p className="mt-4 text-sm text-slate-500">No new user submissions yet.</p>
          )}

          <div className="mt-4 space-y-3">
            {newUsers.map((record) => (
              <details key={record.id} className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                <summary className="cursor-pointer list-none flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{record.preferredName || record.name}</p>
                    <p className="text-xs text-slate-500">{record.email}</p>
                  </div>
                  <div className="text-xs text-slate-500">
                    {record.preferredRole} • {record.visaStatus}
                  </div>
                </summary>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-700">
                  <div>
                    <p className="font-semibold text-slate-900">Resume Email</p>
                    <p>{record.resumeEmail}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Resume Phone</p>
                    <p>{record.resumePhone}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Personal Phone</p>
                    <p>{record.personalPhone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="font-semibold text-slate-900">Address</p>
                    <p>{record.address}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">LinkedIn</p>
                    <p>{record.linkedInUrl || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Arrival Date</p>
                    <p>{record.arrivalDate ? record.arrivalDate.slice(0, 10) : 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Certifications</p>
                    <p>{record.certifications || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Legal Name</p>
                    <p>{record.legalName}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Signed Date</p>
                    <p>{record.signedDate ? record.signedDate.slice(0, 10) : 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="font-semibold text-slate-900">Work Experience</p>
                    {record.workExperiences.length === 0 && <p>No experience added.</p>}
                    {record.workExperiences.map((exp, idx) => (
                      <div key={`${record.id}-${idx}`} className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <p className="font-semibold text-slate-900">
                          {exp.companyName} • {exp.location}
                        </p>
                        <p className="text-xs text-slate-500">
                          {exp.startDate?.slice(0, 10)} - {exp.endDate ? exp.endDate.slice(0, 10) : 'Present'}
                        </p>
                        <ul className="mt-2 list-disc pl-4 text-sm text-slate-700">
                          {exp.points.map((point, pointIdx) => (
                            <li key={`${record.id}-${idx}-${pointIdx}`}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
