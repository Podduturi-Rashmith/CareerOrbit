const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

function loadEnvFile(filename) {
  const filePath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(filePath)) return;
  const contents = fs.readFileSync(filePath, 'utf8');
  for (const line of contents.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is required for seeding.');
}

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ['ADMIN', 'STUDENT'] },
    passwordHash: String,
    emailVerifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const studentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
    major: String,
    graduationYear: Number,
  },
  { timestamps: true }
);

const adminSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
    adminId: { type: String, unique: true, uppercase: true, trim: true },
  },
  { timestamps: true }
);

const applicationSchema = new mongoose.Schema(
  {
    studentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    companyName: String,
    jobRole: String,
    status: { type: String, enum: ['APPLIED', 'SCREENING_CALL', 'INTERVIEW', 'ASSESSMENT', 'REJECTED', 'OFFER'] },
    resumeUrl: String,
    upcomingEventType: { type: String, enum: ['SCREENING', 'INTERVIEW', 'ASSESSMENT'], default: null },
    upcomingEventDate: Date,
    meetingLink: String,
    prepNotes: String,
    applicationDate: Date,
    notes: String,
  },
  { timestamps: true }
);
applicationSchema.index({ studentUserId: 1, companyName: 1, jobRole: 1 }, { unique: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);

async function upsertStudent(data) {
  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await User.findOneAndUpdate(
    { email: data.email.toLowerCase() },
    {
      $set: {
        name: data.name,
        role: 'STUDENT',
        passwordHash,
        email: data.email.toLowerCase(),
        emailVerifiedAt: new Date(),
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  await Student.findOneAndUpdate(
    { userId: user._id },
    { $set: { major: data.major, graduationYear: data.graduationYear, userId: user._id } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  return user;
}

async function upsertAdmin(data) {
  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await User.findOneAndUpdate(
    { email: data.email.toLowerCase() },
    {
      $set: {
        name: data.name,
        role: 'ADMIN',
        passwordHash,
        email: data.email.toLowerCase(),
        emailVerifiedAt: new Date(),
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  await Admin.findOneAndUpdate(
    { adminId: data.adminId.toUpperCase() },
    { $set: { userId: user._id, adminId: data.adminId.toUpperCase() } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
}

async function seedApplications(studentUserId) {
  const items = [
    {
      companyName: 'TechCorp',
      jobRole: 'Frontend Developer',
      status: 'INTERVIEW',
      applicationDate: new Date('2024-03-01'),
      notes: 'Strong focus on React and Tailwind.',
      upcomingEventType: 'INTERVIEW',
      upcomingEventDate: new Date('2024-03-10T14:00:00Z'),
      meetingLink: 'https://zoom.us/j/123456789',
      prepNotes: 'Review system design and React hooks.',
    },
    {
      companyName: 'DataFlow',
      jobRole: 'Software Engineer',
      status: 'APPLIED',
      applicationDate: new Date('2024-03-05'),
      notes: 'Applied via internal referral.',
    },
    {
      companyName: 'CloudScale',
      jobRole: 'Fullstack Engineer',
      status: 'SCREENING_CALL',
      applicationDate: new Date('2024-02-28'),
      upcomingEventType: 'SCREENING',
      upcomingEventDate: new Date('2024-03-08T10:00:00Z'),
      meetingLink: 'https://meet.google.com/abc-defg-hij',
    },
    {
      companyName: 'InnovateAI',
      jobRole: 'AI Research Intern',
      status: 'REJECTED',
      applicationDate: new Date('2024-02-15'),
    },
    {
      companyName: 'FinTech Solutions',
      jobRole: 'Backend Developer',
      status: 'OFFER',
      applicationDate: new Date('2024-02-10'),
    },
  ];

  for (const item of items) {
    await Application.findOneAndUpdate(
      { studentUserId, companyName: item.companyName, jobRole: item.jobRole },
      {
        $set: {
          studentUserId,
          companyName: item.companyName,
          jobRole: item.jobRole,
          status: item.status,
          applicationDate: item.applicationDate,
          notes: item.notes || null,
          upcomingEventType: item.upcomingEventType || null,
          upcomingEventDate: item.upcomingEventDate || null,
          meetingLink: item.meetingLink || null,
          prepNotes: item.prepNotes || null,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
  }
}

async function main() {
  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME || undefined });

  const primaryStudent = await upsertStudent({
    name: 'Alex Johnson',
    email: 'alex.j@example.com',
    major: 'Computer Science',
    graduationYear: 2025,
    password: 'password',
  });

  await upsertStudent({
    name: 'Sarah Smith',
    email: 'sarah.s@example.com',
    major: 'Data Science',
    graduationYear: 2024,
    password: 'password',
  });

  await upsertAdmin({
    name: 'Rashmith Reddy Podduturi',
    email: 'rashmith.admin@example.com',
    adminId: 'ADM001',
    password: 'admin',
  });

  await upsertAdmin({
    name: 'Robert Brown',
    email: 'robert.admin@example.com',
    adminId: 'ADM002',
    password: 'admin',
  });

  await seedApplications(primaryStudent._id);
}

main()
  .then(async () => {
    await mongoose.disconnect();
    console.log('MongoDB seeding complete.');
  })
  .catch(async (error) => {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  });
