import { getMongoDb } from '@/lib/db/mongodb';

const COLLECTION = 'student_onboarding';

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
