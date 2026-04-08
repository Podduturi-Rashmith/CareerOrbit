import { getMongoDb } from '@/lib/db/mongodb';

const COLLECTION = 'student_onboarding';

export type WorkExperienceSubmission = {
  companyName: string;
  location: string;
  startDate: string;
  endDate: string;
  points: string[];
};

export type JobPreferences = {
  locations: string;       // free text e.g. "New York, Remote"
  workMode: string;        // "Remote" | "Hybrid" | "On-site" | ""
  employmentType: string;  // "Full-time" | "Part-time" | "Contract" | ""
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
  jobPreferences?: JobPreferences;
  masterResumeUrl?: string;
  masterResumeFileName?: string;
  consentAccepted: boolean;
  legalName: string;
  signedDate: string;
  workExperiences: WorkExperienceSubmission[];
  // Wizard progress tracking
  currentStep: number;        // 1-7, which step they are on
  completedSteps: number[];   // array of completed step numbers
  wizardCompleted: boolean;   // true only when step 7 (consent) is done
};

export async function listStudentOnboardingSubmissions(): Promise<StudentOnboardingSubmission[]> {
  const db = await getMongoDb();
  const docs = await db
    .collection<StudentOnboardingSubmission>(COLLECTION)
    .find({})
    .sort({ submittedAt: -1 })
    .toArray();
  return docs.map(({ _id, ...rest }) => rest as StudentOnboardingSubmission);
}

export async function getStudentOnboardingByEmail(
  email: string
): Promise<StudentOnboardingSubmission | null> {
  const key = email.trim().toLowerCase();
  if (!key) return null;
  const db = await getMongoDb();
  const doc = await db.collection<StudentOnboardingSubmission>(COLLECTION).findOne({
    $or: [
      { submittedByEmail: { $regex: `^${key}$`, $options: 'i' } },
      { resumeEmail: { $regex: `^${key}$`, $options: 'i' } },
    ],
  });
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest as StudentOnboardingSubmission;
}

export async function upsertStudentOnboardingSubmission(
  submission: StudentOnboardingSubmission
): Promise<StudentOnboardingSubmission> {
  const key = submission.submittedByEmail.trim().toLowerCase();
  const db = await getMongoDb();
  const col = db.collection<StudentOnboardingSubmission>(COLLECTION);
  await col.updateOne(
    {
      $or: [
        { submittedByEmail: { $regex: `^${key}$`, $options: 'i' } },
        { resumeEmail: { $regex: `^${key}$`, $options: 'i' } },
      ],
    },
    { $set: submission },
    { upsert: true }
  );
  return submission;
}

export async function patchStudentOnboardingStep(
  email: string,
  stepData: Partial<StudentOnboardingSubmission>
): Promise<StudentOnboardingSubmission | null> {
  const key = email.trim().toLowerCase();
  const db = await getMongoDb();
  const col = db.collection<StudentOnboardingSubmission>(COLLECTION);

  const existing = await col.findOne({
    $or: [
      { submittedByEmail: { $regex: `^${key}$`, $options: 'i' } },
      { resumeEmail: { $regex: `^${key}$`, $options: 'i' } },
    ],
  });

  const now = Date.now();
  const { createEntityId } = await import('@/lib/shared/id');

  if (!existing) {
    // First save — create the document
    const doc: StudentOnboardingSubmission = {
      id: createEntityId(),
      submittedAt: now,
      submittedByEmail: key,
      preferredName: '',
      dateOfBirth: '',
      linkedInUrl: '',
      resumeEmail: key,
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
      workExperiences: [],
      currentStep: 1,
      completedSteps: [],
      wizardCompleted: false,
      ...stepData,
    };
    await col.insertOne(doc);
    return doc;
  }

  // Merge completed steps
  const newCompleted = stepData.completedSteps
    ? Array.from(new Set([...(existing.completedSteps ?? []), ...stepData.completedSteps]))
    : existing.completedSteps ?? [];

  const merged = {
    ...stepData,
    completedSteps: newCompleted,
  };

  await col.updateOne(
    { _id: existing._id },
    { $set: merged }
  );

  const updated = await col.findOne({ _id: existing._id });
  if (!updated) return null;
  const { _id, ...rest } = updated;
  return rest as StudentOnboardingSubmission;
}

/** Returns true if the student has fully completed the wizard OR has the old consent-based completion */
export function isOnboardingComplete(sub: StudentOnboardingSubmission | null): boolean {
  if (!sub) return false;
  return sub.wizardCompleted === true || sub.consentAccepted === true;
}
