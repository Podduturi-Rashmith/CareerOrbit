/**
 * Live MongoDB test for student onboarding store.
 * Inserts a random student, reads it back, then cleans up.
 */

import { describe, it, expect, afterAll } from 'vitest';
import {
  upsertStudentOnboardingSubmission,
  getStudentOnboardingByEmail,
  listStudentOnboardingSubmissions,
  type StudentOnboardingSubmission,
} from '../lib/admin/student-onboarding-store';
import { getMongoDb } from '../lib/db/mongodb';

// Random test student
const testEmail = `test.student.${Date.now()}@careerorbit.test`;

const testStudent: StudentOnboardingSubmission = {
  id: `test-${Date.now()}`,
  submittedAt: Date.now(),
  submittedByEmail: testEmail,
  preferredName: 'Jamie Rivera',
  dateOfBirth: '2000-06-15',
  linkedInUrl: 'https://linkedin.com/in/jamie-rivera-test',
  resumeEmail: testEmail,
  resumePhone: '+1 555-123-4567',
  personalPhone: '+1 555-987-6543',
  address: '123 Test Street, Austin, TX 78701',
  mastersUniversity: 'University of Texas at Austin',
  mastersField: 'Computer Science',
  mastersCompleted: '2025-05',
  bachelorsUniversity: 'Texas A&M University',
  bachelorsField: 'Software Engineering',
  bachelorsCompleted: '2023-05',
  visaStatus: 'OPT',
  arrivalDate: '2023-08-01',
  certifications: 'AWS Certified Developer, Google Cloud Associate',
  preferredRole: 'Software Engineering',
  consentAccepted: true,
  legalName: 'Jamie Alex Rivera',
  signedDate: '2026-04-03',
  currentStep: 7,
  completedSteps: [1, 2, 3, 4, 5, 6, 7],
  wizardCompleted: true,
  workExperiences: [
    {
      companyName: 'TechStartup Inc',
      location: 'Austin, TX',
      startDate: '2023-09',
      endDate: '2024-06',
      points: [
        'Built REST APIs with Node.js and Express serving 10k daily users',
        'Reduced API response time by 40% through Redis caching',
        'Collaborated with a team of 5 engineers in an Agile environment',
      ],
    },
    {
      companyName: 'DataCo Analytics',
      location: 'Remote',
      startDate: '2024-07',
      endDate: 'Present',
      points: [
        'Developed React dashboards for real-time data visualization',
        'Integrated third-party APIs for payment processing and notifications',
      ],
    },
  ],
};

// Cleanup after tests
afterAll(async () => {
  const db = await getMongoDb();
  await db.collection('student_onboarding').deleteOne({ submittedByEmail: testEmail });
  console.log('  Cleaned up test record from MongoDB');
});

describe('Student Onboarding — MongoDB', () => {
  it('saves a new student submission to MongoDB', async () => {
    const saved = await upsertStudentOnboardingSubmission(testStudent);
    expect(saved.preferredName).toBe('Jamie Rivera');
    expect(saved.submittedByEmail).toBe(testEmail);
    console.log('  Saved:', saved.preferredName, '→', saved.submittedByEmail);
  });

  it('retrieves the student by email', async () => {
    const found = await getStudentOnboardingByEmail(testEmail);
    expect(found).not.toBeNull();
    expect(found!.preferredName).toBe('Jamie Rivera');
    expect(found!.visaStatus).toBe('OPT');
    expect(found!.workExperiences).toHaveLength(2);
    expect(found!.workExperiences[0].companyName).toBe('TechStartup Inc');
    expect(found!.workExperiences[0].points).toHaveLength(3);
    console.log('  Found:', found!.preferredName, '— work experiences:', found!.workExperiences.length);
  });

  it('lists all submissions and includes the test student', async () => {
    const all = await listStudentOnboardingSubmissions();
    expect(Array.isArray(all)).toBe(true);
    const found = all.find((s) => s.submittedByEmail === testEmail);
    expect(found).toBeDefined();
    console.log(`  Total submissions in DB: ${all.length}`);
  });

  it('upserts — updating existing student does not create a duplicate', async () => {
    const updated = { ...testStudent, preferredName: 'Jamie Rivera Updated' };
    await upsertStudentOnboardingSubmission(updated);

    const all = await listStudentOnboardingSubmissions();
    const matches = all.filter((s) => s.submittedByEmail === testEmail);
    expect(matches).toHaveLength(1);
    expect(matches[0].preferredName).toBe('Jamie Rivera Updated');
    console.log('  Upsert confirmed — no duplicates, name updated to:', matches[0].preferredName);
  });

  it('returns null for an email that does not exist', async () => {
    const notFound = await getStudentOnboardingByEmail('nobody@doesnotexist.com');
    expect(notFound).toBeNull();
    console.log('  Correctly returned null for unknown email');
  });
});
