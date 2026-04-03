export type WorkExperienceSubmission = {
  companyName: string;
  location: string;
  startDate: string;
  endDate: string;
  points: string[];
};

export type StudentOnboardingSubmission = {
  id: string;
  submittedAt: number;
  submittedByEmail: string;
  preferredName: string;
  dateOfBirth: string;
  linkedInUrl: string;
  resumeEmail: string;
  resumePhone: string;
  personalPhone: string;
  address: string;
  mastersUniversity: string;
  mastersField: string;
  mastersCompleted: string;
  bachelorsUniversity: string;
  bachelorsField: string;
  bachelorsCompleted: string;
  visaStatus: string;
  arrivalDate: string;
  certifications: string;
  preferredRole: string;
  consentAccepted: boolean;
  legalName: string;
  signedDate: string;
  workExperiences: WorkExperienceSubmission[];
};

const GLOBAL_STORE_KEY = '__careerorbit_student_onboarding_submissions__';

type GlobalWithStore = typeof globalThis & {
  [GLOBAL_STORE_KEY]?: StudentOnboardingSubmission[];
};

function getStore(): StudentOnboardingSubmission[] {
  const g = globalThis as GlobalWithStore;
  if (!g[GLOBAL_STORE_KEY]) g[GLOBAL_STORE_KEY] = [];
  return g[GLOBAL_STORE_KEY]!;
}

export function listStudentOnboardingSubmissions(): StudentOnboardingSubmission[] {
  return [...getStore()].sort((a, b) => b.submittedAt - a.submittedAt);
}

export function getStudentOnboardingByEmail(email: string): StudentOnboardingSubmission | null {
  const key = email.trim().toLowerCase();
  if (!key) return null;
  const all = getStore();
  const found = all.find(
    (item) =>
      item.submittedByEmail.toLowerCase() === key ||
      item.resumeEmail.toLowerCase() === key
  );
  return found || null;
}

export function upsertStudentOnboardingSubmission(
  submission: StudentOnboardingSubmission
): StudentOnboardingSubmission {
  const store = getStore();
  const key = submission.submittedByEmail.trim().toLowerCase();
  const existingIndex = store.findIndex(
    (item) =>
      item.submittedByEmail.toLowerCase() === key ||
      item.resumeEmail.toLowerCase() === key
  );
  if (existingIndex >= 0) {
    store[existingIndex] = submission;
  } else {
    store.unshift(submission);
  }
  return submission;
}

