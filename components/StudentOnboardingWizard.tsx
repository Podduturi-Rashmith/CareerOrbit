'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import {
  User, GraduationCap, Briefcase, Globe, Star, FileText, ShieldCheck,
  Plus, Trash2, ChevronRight, ChevronLeft, Check, Loader2, Upload,
} from 'lucide-react';
import type { StudentOnboardingSubmission, WorkExperienceSubmission } from '@/lib/admin/student-onboarding-store';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type WizardData = Partial<StudentOnboardingSubmission>;

const STEPS = [
  { number: 1, label: 'Personal',    icon: User },
  { number: 2, label: 'Education',   icon: GraduationCap },
  { number: 3, label: 'Work',        icon: Briefcase },
  { number: 4, label: 'Visa',        icon: Globe },
  { number: 5, label: 'Preferences', icon: Star },
  { number: 6, label: 'Resume',      icon: FileText },
  { number: 7, label: 'Consent',     icon: ShieldCheck },
];

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */
function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}{required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';

const selectCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';

/* ─────────────────────────────────────────────
   Step forms
───────────────────────────────────────────── */
function Step1Personal({ data, onChange }: { data: WizardData; onChange: (d: WizardData) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Legal Name" required>
        <input className={inputCls} value={data.legalName ?? ''} onChange={e => onChange({ legalName: e.target.value })} placeholder="As on government ID" />
      </Field>
      <Field label="Preferred Name">
        <input className={inputCls} value={data.preferredName ?? ''} onChange={e => onChange({ preferredName: e.target.value })} placeholder="What should we call you?" />
      </Field>
      <Field label="Date of Birth" required>
        <input type="date" className={inputCls} value={data.dateOfBirth ?? ''} onChange={e => onChange({ dateOfBirth: e.target.value })} />
      </Field>
      <Field label="Resume Email" required>
        <input type="email" className={inputCls} value={data.resumeEmail ?? ''} onChange={e => onChange({ resumeEmail: e.target.value })} placeholder="Email shown on resume" />
      </Field>
      <Field label="Resume Phone" required>
        <input type="tel" className={inputCls} value={data.resumePhone ?? ''} onChange={e => onChange({ resumePhone: e.target.value })} placeholder="+1 (555) 000-0000" />
      </Field>
      <Field label="Personal Phone">
        <input type="tel" className={inputCls} value={data.personalPhone ?? ''} onChange={e => onChange({ personalPhone: e.target.value })} placeholder="Private contact number" />
      </Field>
      <Field label="LinkedIn URL">
        <input type="url" className={inputCls} value={data.linkedInUrl ?? ''} onChange={e => onChange({ linkedInUrl: e.target.value })} placeholder="https://linkedin.com/in/..." />
      </Field>
      <Field label="Address">
        <input className={inputCls} value={data.address ?? ''} onChange={e => onChange({ address: e.target.value })} placeholder="City, State, Country" />
      </Field>
    </div>
  );
}

function Step2Education({ data, onChange }: { data: WizardData; onChange: (d: WizardData) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Bachelor's Degree</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="University">
            <input className={inputCls} value={data.bachelorsUniversity ?? ''} onChange={e => onChange({ bachelorsUniversity: e.target.value })} placeholder="University name" />
          </Field>
          <Field label="Field of Study">
            <input className={inputCls} value={data.bachelorsField ?? ''} onChange={e => onChange({ bachelorsField: e.target.value })} placeholder="Computer Science" />
          </Field>
          <Field label="Year Completed">
            <input className={inputCls} value={data.bachelorsCompleted ?? ''} onChange={e => onChange({ bachelorsCompleted: e.target.value })} placeholder="2022" />
          </Field>
        </div>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Master's Degree <span className="font-normal text-slate-400">(if applicable)</span></h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="University">
            <input className={inputCls} value={data.mastersUniversity ?? ''} onChange={e => onChange({ mastersUniversity: e.target.value })} placeholder="University name" />
          </Field>
          <Field label="Field of Study">
            <input className={inputCls} value={data.mastersField ?? ''} onChange={e => onChange({ mastersField: e.target.value })} placeholder="Data Science" />
          </Field>
          <Field label="Year Completed">
            <input className={inputCls} value={data.mastersCompleted ?? ''} onChange={e => onChange({ mastersCompleted: e.target.value })} placeholder="2024" />
          </Field>
        </div>
      </div>
      <Field label="Certifications & Achievements">
        <textarea
          className={`${inputCls} resize-none`}
          rows={3}
          value={data.certifications ?? ''}
          onChange={e => onChange({ certifications: e.target.value })}
          placeholder="AWS Certified, Google Analytics, Dean's List..."
        />
      </Field>
    </div>
  );
}

function Step3Work({ data, onChange }: { data: WizardData; onChange: (d: WizardData) => void }) {
  const experiences: WorkExperienceSubmission[] = data.workExperiences ?? [];

  const addExp = () => onChange({
    workExperiences: [...experiences, { companyName: '', location: '', startDate: '', endDate: '', points: [''] }],
  });

  const removeExp = (i: number) => onChange({
    workExperiences: experiences.filter((_, idx) => idx !== i),
  });

  const updateExp = (i: number, field: keyof WorkExperienceSubmission, value: string | string[]) => {
    const updated = experiences.map((exp, idx) => idx === i ? { ...exp, [field]: value } : exp);
    onChange({ workExperiences: updated });
  };

  const addPoint = (i: number) => updateExp(i, 'points', [...(experiences[i].points ?? []), '']);

  const updatePoint = (expIdx: number, pointIdx: number, value: string) => {
    const points = [...(experiences[expIdx].points ?? [])];
    points[pointIdx] = value;
    updateExp(expIdx, 'points', points);
  };

  const removePoint = (expIdx: number, pointIdx: number) => {
    const points = experiences[expIdx].points.filter((_, i) => i !== pointIdx);
    updateExp(expIdx, 'points', points);
  };

  return (
    <div className="space-y-6">
      {experiences.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-4">No work experience added yet. Click below to add your first role.</p>
      )}
      {experiences.map((exp, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-700">Experience {i + 1}</h4>
            <button onClick={() => removeExp(i)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Company Name">
              <input className={inputCls} value={exp.companyName} onChange={e => updateExp(i, 'companyName', e.target.value)} placeholder="Google" />
            </Field>
            <Field label="Location">
              <input className={inputCls} value={exp.location} onChange={e => updateExp(i, 'location', e.target.value)} placeholder="New York, NY" />
            </Field>
            <Field label="Start Date">
              <input className={inputCls} value={exp.startDate} onChange={e => updateExp(i, 'startDate', e.target.value)} placeholder="Jan 2022" />
            </Field>
            <Field label="End Date">
              <input className={inputCls} value={exp.endDate} onChange={e => updateExp(i, 'endDate', e.target.value)} placeholder="Present" />
            </Field>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bullet Points</span>
            {exp.points.map((point, pi) => (
              <div key={pi} className="flex gap-2">
                <input
                  className={`${inputCls} flex-1`}
                  value={point}
                  onChange={e => updatePoint(i, pi, e.target.value)}
                  placeholder="Developed X which improved Y by Z%..."
                />
                <button onClick={() => removePoint(i, pi)} className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button onClick={() => addPoint(i)} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add bullet
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={addExp}
        className="flex items-center gap-2 w-full justify-center rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
      >
        <Plus className="w-4 h-4" /> Add Work Experience
      </button>
    </div>
  );
}

function Step4Visa({ data, onChange }: { data: WizardData; onChange: (d: WizardData) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Visa / Work Authorization Status" required>
        <select className={selectCls} value={data.visaStatus ?? ''} onChange={e => onChange({ visaStatus: e.target.value })}>
          <option value="">Select status...</option>
          <option>US Citizen</option>
          <option>Green Card / Permanent Resident</option>
          <option>H-1B</option>
          <option>OPT (F-1)</option>
          <option>STEM OPT</option>
          <option>CPT</option>
          <option>TN Visa</option>
          <option>L-1</option>
          <option>O-1</option>
          <option>EAD</option>
          <option>Requires Sponsorship</option>
          <option>Other</option>
        </select>
      </Field>
      <Field label="US Arrival Date">
        <input type="date" className={inputCls} value={data.arrivalDate ?? ''} onChange={e => onChange({ arrivalDate: e.target.value })} />
      </Field>
    </div>
  );
}

function Step5Preferences({ data, onChange }: { data: WizardData; onChange: (d: WizardData) => void }) {
  const prefs = data.jobPreferences ?? { locations: '', workMode: '', employmentType: '' };
  const update = (p: Partial<typeof prefs>) => onChange({ jobPreferences: { ...prefs, ...p } });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Preferred Job Role / Title" required>
        <input className={inputCls} value={data.preferredRole ?? ''} onChange={e => onChange({ preferredRole: e.target.value })} placeholder="Software Engineer, Data Analyst..." />
      </Field>
      <Field label="Preferred Locations">
        <input className={inputCls} value={prefs.locations} onChange={e => update({ locations: e.target.value })} placeholder="New York, Remote, San Francisco..." />
      </Field>
      <Field label="Work Mode">
        <select className={selectCls} value={prefs.workMode} onChange={e => update({ workMode: e.target.value })}>
          <option value="">No preference</option>
          <option>Remote</option>
          <option>Hybrid</option>
          <option>On-site</option>
        </select>
      </Field>
      <Field label="Employment Type">
        <select className={selectCls} value={prefs.employmentType} onChange={e => update({ employmentType: e.target.value })}>
          <option value="">No preference</option>
          <option>Full-time</option>
          <option>Part-time</option>
          <option>Contract</option>
          <option>Internship</option>
        </select>
      </Field>
    </div>
  );
}

function Step6Resume({
  data,
  onUpload,
  uploading,
}: {
  data: WizardData;
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700">Upload your base resume</p>
        <p className="mt-1 text-xs text-slate-500">
          This will be used as the starting point for all tailored resumes. <strong>.docx only.</strong>
        </p>
        {data.masterResumeFileName && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700">
            <Check className="w-4 h-4" />
            {data.masterResumeFileName}
          </div>
        )}
        <div className="mt-4">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading...' : data.masterResumeFileName ? 'Replace File' : 'Select .docx File'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".docx"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); }}
          />
        </div>
      </div>
      <p className="text-xs text-slate-400 text-center">
        Don't have a resume yet? You can skip this step and upload it later from your profile.
      </p>
    </div>
  );
}

function Step7Consent({ data, onChange }: { data: WizardData; onChange: (d: WizardData) => void }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 text-sm text-indigo-900 leading-relaxed space-y-3">
        <p className="font-bold text-base">Authorization to Apply on Your Behalf</p>
        <p>
          By signing below, you authorize <strong>CareerOrbit</strong> to submit job applications
          on your behalf using the information you have provided in this profile.
        </p>
        <p>
          You understand that:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>You remain the applicant at all times.</li>
          <li>CareerOrbit acts as your representative, not the applicant.</li>
          <li>You will review all materials before they are submitted where possible.</li>
          <li>You may withdraw this authorization at any time by contacting us.</li>
        </ul>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Legal Full Name" required>
          <input
            className={inputCls}
            value={data.legalName ?? ''}
            onChange={e => onChange({ legalName: e.target.value })}
            placeholder="Type your full legal name to sign"
          />
        </Field>
        <Field label="Date">
          <input
            className={`${inputCls} bg-slate-50`}
            value={new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            readOnly
          />
        </Field>
      </div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={data.consentAccepted ?? false}
          onChange={e => onChange({ consentAccepted: e.target.checked })}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-indigo-600"
        />
        <span className="text-sm text-slate-700">
          I have read and agree to the authorization above. I consent to CareerOrbit applying to jobs on my behalf.
        </span>
      </label>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Wizard
───────────────────────────────────────────── */
export default function StudentOnboardingWizard({
  initialSubmission,
  onComplete,
  studentEmail = '',
}: {
  initialSubmission: StudentOnboardingSubmission | null;
  onComplete: () => void;
  studentEmail?: string;
}) {
  const { user, isLoaded } = useUser();
  const clerkEmail = user?.primaryEmailAddress?.emailAddress ?? studentEmail;
  const initialStep = initialSubmission?.currentStep ?? 1;
  const [currentStep, setCurrentStep] = React.useState(Math.min(initialStep, 7));
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(
    new Set(initialSubmission?.completedSteps ?? [])
  );
  const [data, setData] = React.useState<WizardData>({
    legalName: '',
    preferredName: '',
    dateOfBirth: '',
    resumeEmail: studentEmail || user?.primaryEmailAddress?.emailAddress || '',
    resumePhone: '',
    personalPhone: '',
    linkedInUrl: '',
    address: '',
    bachelorsUniversity: '',
    bachelorsField: '',
    bachelorsCompleted: '',
    mastersUniversity: '',
    mastersField: '',
    mastersCompleted: '',
    certifications: '',
    workExperiences: [],
    visaStatus: '',
    arrivalDate: '',
    preferredRole: '',
    jobPreferences: { locations: '', workMode: '', employmentType: '' },
    masterResumeUrl: '',
    masterResumeFileName: '',
    consentAccepted: false,
    ...initialSubmission,
  });
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState('');

  const merge = (patch: WizardData) => setData(prev => ({ ...prev, ...patch }));

  const saveStep = async (step: number, extra?: WizardData): Promise<boolean> => {
    setSaving(true);
    setError('');
    try {
      const email = clerkEmail;
      if (!email) {
        setError('Could not detect your email. Please refresh the page and try again.');
        return false;
      }
      const res = await fetch('/api/student/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ step, email, data: { ...data, ...extra } }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Failed to save. Please try again.');
        return false;
      }
      setCompletedSteps(prev => new Set([...prev, step]));
      return true;
    } catch {
      setError('Network error. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    const ok = await saveStep(currentStep);
    if (ok) setCurrentStep(s => Math.min(s + 1, 7));
  };

  const handleBack = () => setCurrentStep(s => Math.max(s - 1, 1));

  const handleFinish = async () => {
    if (!data.consentAccepted) {
      setError('You must accept the consent to continue.');
      return;
    }
    if (!data.legalName?.trim()) {
      setError('Please type your legal name to sign.');
      return;
    }
    const ok = await saveStep(7, { signedDate: new Date().toISOString() });
    if (ok) onComplete();
  };

  const handleResumeUpload = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('email', clerkEmail);
      const res = await fetch('/api/student/onboarding/resume', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const d = await res.json();
      if (res.ok) {
        merge({ masterResumeUrl: d.url, masterResumeFileName: d.fileName });
        setCompletedSteps(prev => new Set([...prev, 6]));
      } else {
        setError(d.error ?? 'Upload failed.');
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const stepTitles: Record<number, string> = {
    1: "Let's start with your personal details",
    2: 'Tell us about your education',
    3: 'Add your work experience',
    4: 'Visa & work eligibility',
    5: 'Job preferences',
    6: 'Upload your base resume',
    7: 'Review & sign consent',
  };

  const isLastStep = currentStep === 7;
  const progressPct = (completedSteps.size / 7) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100 px-4 py-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider mb-4">
            Account Setup
          </div>
          <h1 className="text-2xl font-display font-black text-slate-900">Complete Your Profile</h1>
          <p className="mt-2 text-sm text-slate-500">
            {completedSteps.size} of 7 steps completed
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between">
          {STEPS.map((step) => {
            const done = completedSteps.has(step.number);
            const active = currentStep === step.number;
            return (
              <button
                key={step.number}
                onClick={() => done || active ? setCurrentStep(step.number) : undefined}
                className="flex flex-col items-center gap-1"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  done
                    ? 'bg-indigo-600 text-white'
                    : active
                      ? 'bg-indigo-100 border-2 border-indigo-600 text-indigo-700'
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}>
                  {done ? <Check className="w-4 h-4" /> : <step.icon className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-[10px] font-semibold hidden sm:block ${
                  active ? 'text-indigo-700' : done ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Step {currentStep} of 7
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">{stepTitles[currentStep]}</h2>
          </div>

          <div className="p-6">
            {currentStep === 1 && <Step1Personal data={data} onChange={merge} />}
            {currentStep === 2 && <Step2Education data={data} onChange={merge} />}
            {currentStep === 3 && <Step3Work data={data} onChange={merge} />}
            {currentStep === 4 && <Step4Visa data={data} onChange={merge} />}
            {currentStep === 5 && <Step5Preferences data={data} onChange={merge} />}
            {currentStep === 6 && <Step6Resume data={data} onUpload={handleResumeUpload} uploading={uploading} />}
            {currentStep === 7 && <Step7Consent data={data} onChange={merge} />}
          </div>

          {error && (
            <div className="mx-6 mb-4 rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Footer nav */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <div className="flex items-center gap-3">
              {/* Save & exit */}
              <button
                onClick={() => saveStep(currentStep)}
                disabled={saving || !isLoaded}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Save & Exit'}
              </button>

              {isLastStep ? (
                <button
                  onClick={handleFinish}
                  disabled={saving || !data.consentAccepted || !data.legalName?.trim()}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Complete Setup
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={saving || !isLoaded}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Save & Continue <ChevronRight className="w-4 h-4" /></>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
