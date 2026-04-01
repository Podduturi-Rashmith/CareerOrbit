import { z } from 'zod';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DATA_URL_REGEX = /^data:[^;]+;base64,/;
const URL_OR_EMPTY_SCHEMA = z.union([z.literal(''), z.string().url()]);

const APPLICATION_CATEGORIES = [
  'Software Engineering',
  'Data Roles',
  'AI/Machine Learning',
  'Cloud/DevOps',
  'QA/Testing',
  'Business/Product',
  'Cybersecurity',
  'Design',
] as const;

const ApplicationCategorySchema = z.enum(APPLICATION_CATEGORIES);

export const AdminJobPayloadSchema = z.object({
  companyName: z.string().trim().min(1),
  category: ApplicationCategorySchema,
  subcategory: z.string().trim().default(''),
  jobTitle: z.string().trim().min(1),
  jobDescription: z.string().trim().min(1),
  jobLink: URL_OR_EMPTY_SCHEMA.default(''),
  date: z.string().trim().regex(DATE_ONLY_REGEX, 'Date must be in YYYY-MM-DD format.'),
  studentId: z.string().trim().default('unassigned'),
  studentName: z.string().trim().default('Unassigned'),
});

export const AdminJobUpdatePayloadSchema = AdminJobPayloadSchema.pick({
  companyName: true,
  category: true,
  subcategory: true,
  jobTitle: true,
  jobDescription: true,
  jobLink: true,
  date: true,
});

export const AdminAppliedRecordPayloadSchema = z.object({
  jobId: z.string().trim().min(1),
  jobTitle: z.string().trim().default(''),
  companyName: z.string().trim().default(''),
  category: z.string().trim().default(''),
  studentId: z.string().trim().default(''),
  studentName: z.string().trim().default(''),
  studentEmail: z.string().trim().email(),
  draftId: z.string().trim().min(1),
  draftFileName: z.string().trim().default(''),
  appliedOn: z.string().trim().regex(DATE_ONLY_REGEX, 'Applied date must be in YYYY-MM-DD format.'),
  notes: z.string().trim().default(''),
});

export const MasterResumePayloadSchema = z.object({
  studentId: z.string().trim().default(''),
  studentName: z.string().trim().default(''),
  studentEmail: z.string().trim().email(),
  fileName: z.string().trim().min(1),
  mimeType: z.string().trim().default('application/octet-stream'),
  fileDataUrl: z
    .string()
    .trim()
    .min(1)
    .regex(DATA_URL_REGEX, 'fileDataUrl must be a valid base64 data URL.'),
  extractedText: z.string().trim().default(''),
});

export const TailorRequestPayloadSchema = z.object({
  studentId: z.string().trim().default(''),
  studentName: z.string().trim().default(''),
  studentEmail: z.string().trim().email(),
  companyName: z.string().trim().default(''),
  jobTitle: z.string().trim().default(''),
  jobDescription: z.string().trim().default(''),
  category: z.string().trim().default(''),
});

const WorkExperienceSchema = z.object({
  companyName: z.string().trim().default(''),
  location: z.string().trim().default(''),
  startDate: z.string().trim().default(''),
  endDate: z.string().trim().default(''),
  points: z.array(z.string().trim()).default([]),
});

export const StudentOnboardingPayloadSchema = z.object({
  submittedByEmail: z.string().trim().optional(),
  preferredName: z.string().trim().default(''),
  dateOfBirth: z.string().trim().default(''),
  linkedInUrl: URL_OR_EMPTY_SCHEMA.default(''),
  resumeEmail: z.string().trim().email(),
  resumePhone: z.string().trim().default(''),
  personalPhone: z.string().trim().default(''),
  address: z.string().trim().default(''),
  mastersUniversity: z.string().trim().default(''),
  mastersField: z.string().trim().default(''),
  mastersCompleted: z.string().trim().default(''),
  bachelorsUniversity: z.string().trim().default(''),
  bachelorsField: z.string().trim().default(''),
  bachelorsCompleted: z.string().trim().default(''),
  visaStatus: z.string().trim().default(''),
  arrivalDate: z.string().trim().default(''),
  certifications: z.string().trim().default(''),
  preferredRole: z.string().trim().default(''),
  consentAccepted: z.boolean().default(false),
  legalName: z.string().trim().default(''),
  signedDate: z.string().trim().default(''),
  workExperiences: z.array(WorkExperienceSchema).default([]),
});
