import { NextResponse } from 'next/server';
import {
  getStudentOnboardingByEmail,
  listStudentOnboardingSubmissions,
  upsertStudentOnboardingSubmission,
  type StudentOnboardingSubmission,
} from '@/lib/admin/student-onboarding-store';
import { StudentOnboardingPayloadSchema } from '@/lib/admin/schemas';
import { createEntityId } from '@/lib/shared/id';
import { asTrimmedString, jsonError, parseJsonObject, serverErrorResponse } from '@/lib/server/http';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const scope = url.searchParams.get('scope');
    if (scope === 'all') {
      const submissions = await listStudentOnboardingSubmissions();
      return NextResponse.json({ submissions });
    }

    const studentEmail = asTrimmedString(url.searchParams.get('studentEmail') || '');
    if (!studentEmail) {
      return NextResponse.json({ completed: false });
    }

    const found = await getStudentOnboardingByEmail(studentEmail);
    return NextResponse.json({
      completed: !!found,
      submission: found || null,
    });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to load onboarding data.');
  }
}

export async function POST(request: Request) {
  try {
  const payload = await parseJsonObject(request);
  if (!payload) {
    return jsonError('Invalid onboarding payload.', 400);
  }
  const parsed = StudentOnboardingPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || 'Invalid onboarding payload.';
    return jsonError(message, 400);
  }
  const normalized = parsed.data;
  const submittedByEmail = normalized.submittedByEmail || normalized.resumeEmail;

  const submission: StudentOnboardingSubmission = {
    id: createEntityId(),
    submittedAt: Date.now(),
    submittedByEmail,
    preferredName: normalized.preferredName,
    dateOfBirth: normalized.dateOfBirth,
    linkedInUrl: normalized.linkedInUrl,
    resumeEmail: normalized.resumeEmail,
    resumePhone: normalized.resumePhone,
    personalPhone: normalized.personalPhone,
    address: normalized.address,
    mastersUniversity: normalized.mastersUniversity,
    mastersField: normalized.mastersField,
    mastersCompleted: normalized.mastersCompleted,
    bachelorsUniversity: normalized.bachelorsUniversity,
    bachelorsField: normalized.bachelorsField,
    bachelorsCompleted: normalized.bachelorsCompleted,
    visaStatus: normalized.visaStatus,
    arrivalDate: normalized.arrivalDate,
    certifications: normalized.certifications,
    preferredRole: normalized.preferredRole,
    consentAccepted: normalized.consentAccepted,
    legalName: normalized.legalName,
    signedDate: normalized.signedDate,
    workExperiences: normalized.workExperiences.map((work) => ({
      companyName: work.companyName,
      location: work.location,
      startDate: work.startDate,
      endDate: work.endDate,
      points: work.points.filter(Boolean),
    })),
  };

    await upsertStudentOnboardingSubmission(submission);
    return NextResponse.json({ ok: true, id: submission.id });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to save onboarding submission.');
  }
}
