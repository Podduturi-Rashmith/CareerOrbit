export type StudentAppliedJobRecord = {
  id: string;
  studentId: string;
  studentName: string;
  applicationId: string;
  companyName: string;
  jobTitle: string;
  category: string;
  subcategory: string;
  appliedOn: string; // YYYY-MM-DD
  // Legacy free-text field kept for backward compatibility.
  resumeUsed?: string;
  resumeFileName?: string;
  resumeFileDataUrl?: string;
  resumeMimeType?: string;
  createdAt: number;
};

const STORAGE_KEY = 'careerorbit_student_applied_jobs_v1';

export function loadStudentAppliedJobs(): StudentAppliedJobRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(Boolean) as StudentAppliedJobRecord[];
  } catch {
    return [];
  }
}

export function saveStudentAppliedJobs(data: StudentAppliedJobRecord[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

