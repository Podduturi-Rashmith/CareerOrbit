import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

declare global {
  var __mongooseConn: Promise<typeof mongoose> | undefined;
}

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required.');
  }
  if (!global.__mongooseConn) {
    global.__mongooseConn = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME || undefined,
    });
  }
  return global.__mongooseConn;
}

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ['ADMIN', 'STUDENT'], required: true },
    passwordHash: { type: String, required: true },
    emailVerifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const studentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    major: { type: String, required: true },
    graduationYear: { type: Number, required: true },
  },
  { timestamps: true }
);

const adminSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    adminId: { type: String, required: true, unique: true, uppercase: true, trim: true },
  },
  { timestamps: true }
);

const studentOnboardingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    preferredName: { type: String, required: true },
    dateOfBirth: { type: Date, default: null },
    linkedInUrl: { type: String, default: null },
    resumeEmail: { type: String, required: true },
    resumePhone: { type: String, required: true },
    personalPhone: { type: String, required: true },
    address: { type: String, required: true },
    workExperiences: [
      {
        companyName: { type: String, required: true },
        location: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, default: null },
        points: [{ type: String, required: true }],
      },
    ],
    education: {
      masters: {
        university: { type: String, default: null },
        field: { type: String, default: null },
        completed: { type: String, default: null },
      },
      bachelors: {
        university: { type: String, default: null },
        field: { type: String, default: null },
        completed: { type: String, default: null },
      },
    },
    visaStatus: { type: String, required: true },
    arrivalDate: { type: Date, default: null },
    certifications: { type: String, default: null },
    preferredRole: { type: String, required: true },
    consentAccepted: { type: Boolean, required: true },
    legalName: { type: String, required: true },
    signedDate: { type: Date, required: true },
    status: { type: String, enum: ['NEW', 'REVIEWED'], default: 'NEW', required: true },
  },
  { timestamps: true }
);

const sessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    lastSeenAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const verificationTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const applicationSchema = new Schema(
  {
    studentUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    companyName: { type: String, required: true },
    jobRole: { type: String, required: true },
    status: {
      type: String,
      enum: ['APPLIED', 'SCREENING_CALL', 'INTERVIEW', 'ASSESSMENT', 'REJECTED', 'OFFER'],
      required: true,
    },
    resumeUrl: { type: String, default: null },
    upcomingEventType: { type: String, enum: ['SCREENING', 'INTERVIEW', 'ASSESSMENT'], default: null },
    upcomingEventDate: { type: Date, default: null },
    meetingLink: { type: String, default: null },
    prepNotes: { type: String, default: null },
    applicationDate: { type: Date, required: true, index: true },
    notes: { type: String, default: null },
  },
  { timestamps: true }
);
applicationSchema.index({ studentUserId: 1, companyName: 1, jobRole: 1 }, { unique: true });

const jobListingSchema = new Schema(
  {
    source: { type: String, required: true },
    externalId: { type: String, required: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, default: null },
    roleCategory: { type: String, required: true, index: true },
    workMode: { type: String, default: null },
    description: { type: String, required: true },
    applyUrl: { type: String, required: true },
    postedAt: { type: Date, required: true, index: true },
    fetchedAt: { type: Date, required: true, default: Date.now },
    isFresh: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);
jobListingSchema.index({ source: 1, externalId: 1 }, { unique: true });

const jobFetchRunSchema = new Schema(
  {
    provider: { type: String, required: true },
    status: { type: String, required: true },
    fetchedCount: { type: Number, required: true },
    newCount: { type: Number, required: true },
    startedAt: { type: Date, required: true, default: Date.now },
    finishedAt: { type: Date, default: null },
    error: { type: String, default: null },
  },
  { timestamps: false }
);

const tailoredResumeSchema = new Schema(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'JobListing', required: true, index: true },
    studentEmail: { type: String, required: true, index: true, lowercase: true, trim: true },
    studentName: { type: String, required: true },
    roleCategory: { type: String, required: true },
    summary: { type: String, required: true },
    generatedById: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };
export type StudentDoc = InferSchemaType<typeof studentSchema> & { _id: mongoose.Types.ObjectId };
export type AdminDoc = InferSchemaType<typeof adminSchema> & { _id: mongoose.Types.ObjectId };
export type StudentOnboardingDoc = InferSchemaType<typeof studentOnboardingSchema> & { _id: mongoose.Types.ObjectId };
export type SessionDoc = InferSchemaType<typeof sessionSchema> & { _id: mongoose.Types.ObjectId };
export type VerificationTokenDoc = InferSchemaType<typeof verificationTokenSchema> & { _id: mongoose.Types.ObjectId };
export type ApplicationDoc = InferSchemaType<typeof applicationSchema> & { _id: mongoose.Types.ObjectId };
export type JobListingDoc = InferSchemaType<typeof jobListingSchema> & { _id: mongoose.Types.ObjectId };
export type TailoredResumeDoc = InferSchemaType<typeof tailoredResumeSchema> & { _id: mongoose.Types.ObjectId };

export const User: Model<UserDoc> = mongoose.models.User || mongoose.model<UserDoc>('User', userSchema);
export const Student: Model<StudentDoc> =
  mongoose.models.Student || mongoose.model<StudentDoc>('Student', studentSchema);
export const Admin: Model<AdminDoc> = mongoose.models.Admin || mongoose.model<AdminDoc>('Admin', adminSchema);
export const StudentOnboarding: Model<StudentOnboardingDoc> =
  mongoose.models.StudentOnboarding || mongoose.model<StudentOnboardingDoc>('StudentOnboarding', studentOnboardingSchema);
export const Session: Model<SessionDoc> =
  mongoose.models.Session || mongoose.model<SessionDoc>('Session', sessionSchema);
export const VerificationToken: Model<VerificationTokenDoc> =
  mongoose.models.VerificationToken || mongoose.model<VerificationTokenDoc>('VerificationToken', verificationTokenSchema);
export const Application: Model<ApplicationDoc> =
  mongoose.models.Application || mongoose.model<ApplicationDoc>('Application', applicationSchema);
export const JobListing: Model<JobListingDoc> =
  mongoose.models.JobListing || mongoose.model<JobListingDoc>('JobListing', jobListingSchema);
export const JobFetchRun = mongoose.models.JobFetchRun || mongoose.model('JobFetchRun', jobFetchRunSchema);
export const TailoredResume: Model<TailoredResumeDoc> =
  mongoose.models.TailoredResume || mongoose.model<TailoredResumeDoc>('TailoredResume', tailoredResumeSchema);
