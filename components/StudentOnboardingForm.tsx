'use client';

import React, { useState } from 'react';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';

type WorkExperienceForm = {
  companyName: string;
  location: string;
  startDate: string;
  endDate: string;
  points: string;
};

type OnboardingFormProps = {
  onComplete: () => void;
};

const visaOptions = ['F1', 'OPT', 'H1B', 'Other'];
const preferredRoles = [
  'Software Engineer',
  'Data Analyst',
  'Machine Learning Engineer',
  'Fullstack Developer',
  'Python Developer',
  'Java Developer',
  'Other',
];

export default function StudentOnboardingForm({ onComplete }: OnboardingFormProps) {
  const [form, setForm] = useState({
    preferredName: '',
    dateOfBirth: '',
    linkedInUrl: '',
    resumeEmail: '',
    resumePhone: '',
    personalPhone: '',
    address: '',
    mastersUniversity: '',
    mastersField: '',
    mastersCompleted: '',
    bachelorsUniversity: '',
    bachelorsField: '',
    bachelorsCompleted: '',
    visaStatus: '',
    arrivalDate: '',
    certifications: '',
    preferredRole: '',
    consentAccepted: false,
    legalName: '',
    signedDate: '',
  });

  const [workExperiences, setWorkExperiences] = useState<WorkExperienceForm[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const updateForm = (field: string, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const addExperience = () => {
    setWorkExperiences((current) => [
      ...current,
      { companyName: '', location: '', startDate: '', endDate: '', points: '' },
    ]);
  };

  const updateExperience = (index: number, field: keyof WorkExperienceForm, value: string) => {
    setWorkExperiences((current) =>
      current.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const removeExperience = (index: number) => {
    setWorkExperiences((current) => current.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      for (const [index, experience] of workExperiences.entries()) {
        if (experience.startDate && experience.endDate) {
          const start = new Date(experience.startDate);
          const end = new Date(experience.endDate);
          if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start) {
            throw new Error(`Work experience ${index + 1}: end date cannot be before start date.`);
          }
        }
      }

      const payload = {
        ...form,
        workExperiences: workExperiences.map((item) => ({
          ...item,
          points: item.points
            .split('\n')
            .map((point) => point.trim())
            .filter(Boolean),
        })),
      };

      const response = await fetch('/api/student/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Failed to submit form.' }));
        throw new Error(body.error || 'Failed to submit form.');
      }

      setSuccess('Thanks! Your details were submitted to the admin team.');
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit form.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-display font-black text-slate-900">Student Registration Form</h1>
        <p className="text-sm text-slate-500 mt-2">Complete this once so the admin team can activate your job search workflow.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Preferred Name on Resume</label>
                <input
                  required
                  value={form.preferredName}
                  onChange={(e) => updateForm('preferredName', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Date of Birth</label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => updateForm('dateOfBirth', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">LinkedIn Profile</label>
                <input
                  type="url"
                  value={form.linkedInUrl}
                  onChange={(e) => updateForm('linkedInUrl', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Email Address for Resume</label>
                <input
                  required
                  type="email"
                  value={form.resumeEmail}
                  onChange={(e) => updateForm('resumeEmail', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Phone Number for Resume</label>
                <input
                  required
                  value={form.resumePhone}
                  onChange={(e) => updateForm('resumePhone', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Personal Phone Number</label>
                <input
                  required
                  value={form.personalPhone}
                  onChange={(e) => updateForm('personalPhone', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Full Current Address</label>
                <textarea
                  required
                  value={form.address}
                  onChange={(e) => updateForm('address', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
                  rows={3}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900">Work Experience (if any)</h2>
              <button
                type="button"
                onClick={addExperience}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Plus className="w-4 h-4" />
                Add Experience
              </button>
            </div>
            {workExperiences.length === 0 && (
              <p className="text-sm text-slate-500">Add past internships or roles if you have any.</p>
            )}
            <div className="space-y-4">
              {workExperiences.map((experience, index) => (
                <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Experience {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeExperience(index)}
                      className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      value={experience.companyName}
                      onChange={(e) => updateExperience(index, 'companyName', e.target.value)}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                      placeholder="Company Name"
                    />
                    <input
                      value={experience.location}
                      onChange={(e) => updateExperience(index, 'location', e.target.value)}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                      placeholder="Place / Location"
                    />
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Start Date</label>
                      <input
                        type="date"
                        value={experience.startDate}
                        onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600">End Date</label>
                      <input
                        type="date"
                        value={experience.endDate}
                        onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <textarea
                      value={experience.points}
                      onChange={(e) => updateExperience(index, 'points', e.target.value)}
                      className="md:col-span-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                      rows={3}
                      placeholder="Points (one per line)"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Education Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Masters University & Field of Study</label>
                <input
                  value={form.mastersUniversity}
                  onChange={(e) => updateForm('mastersUniversity', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
                  placeholder="University"
                />
                <input
                  value={form.mastersField}
                  onChange={(e) => updateForm('mastersField', e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
                  placeholder="Field of Study"
                />
                <input
                  value={form.mastersCompleted}
                  onChange={(e) => updateForm('mastersCompleted', e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
                  placeholder="Graduated/Completed"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Bachelors University & Field of Study</label>
                <input
                  value={form.bachelorsUniversity}
                  onChange={(e) => updateForm('bachelorsUniversity', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
                  placeholder="University"
                />
                <input
                  value={form.bachelorsField}
                  onChange={(e) => updateForm('bachelorsField', e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
                  placeholder="Field of Study"
                />
                <input
                  value={form.bachelorsCompleted}
                  onChange={(e) => updateForm('bachelorsCompleted', e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
                  placeholder="Graduated/Completed"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Visa Details & Availability</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Current Visa Status</label>
                <select
                  required
                  value={form.visaStatus}
                  onChange={(e) => updateForm('visaStatus', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
                >
                  <option value="">Select status</option>
                  {visaOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Date of Arrival in the USA</label>
                <input
                  type="date"
                  value={form.arrivalDate}
                  onChange={(e) => updateForm('arrivalDate', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Certifications & Achievements</h2>
            <textarea
              value={form.certifications}
              onChange={(e) => updateForm('certifications', e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
              rows={3}
              placeholder="List relevant certifications"
            />
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Preferred Role for Marketing</h2>
            <select
              required
              value={form.preferredRole}
              onChange={(e) => updateForm('preferredRole', e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
            >
              <option value="">Select role</option>
              {preferredRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Consent & Signature</h2>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
              I confirm that all the information I have provided is true and accurate to the best of my knowledge. I
              authorize CareerOrbit to apply for jobs on my behalf and access the resume email account I provided for
              job applications and communications.
            </div>
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.consentAccepted}
                onChange={(e) => updateForm('consentAccepted', e.target.checked)}
                className="mt-1"
                required
              />
              I agree and provide full consent.
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Your Legal Name</label>
                <input
                  required
                  value={form.legalName}
                  onChange={(e) => updateForm('legalName', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Signed Date</label>
                <input
                  required
                  type="date"
                  value={form.signedDate}
                  onChange={(e) => updateForm('signedDate', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
                />
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-teal-700 text-white py-3 font-bold hover:bg-teal-800 transition-colors disabled:opacity-70"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}
