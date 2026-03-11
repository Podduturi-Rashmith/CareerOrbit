import { NextResponse } from 'next/server';
import { connectToDatabase, StudentOnboarding } from '@/lib/server/mongodb';
import { getUserFromSessionCookie } from '@/lib/auth/session';

export const runtime = 'nodejs';

function toDateOrNull(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET() {
  await connectToDatabase();
  const authUser = await getUserFromSessionCookie();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (authUser.role !== 'student') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const onboarding = await StudentOnboarding.findOne({ userId: authUser.id }).lean();
  if (!onboarding) {
    return NextResponse.json({ completed: false });
  }

  return NextResponse.json({
    completed: true,
    onboarding: {
      preferredName: onboarding.preferredName,
      dateOfBirth: onboarding.dateOfBirth,
      linkedInUrl: onboarding.linkedInUrl,
      resumeEmail: onboarding.resumeEmail,
      resumePhone: onboarding.resumePhone,
      personalPhone: onboarding.personalPhone,
      address: onboarding.address,
      workExperiences: onboarding.workExperiences || [],
      education: onboarding.education || null,
      visaStatus: onboarding.visaStatus,
      arrivalDate: onboarding.arrivalDate,
      certifications: onboarding.certifications,
      preferredRole: onboarding.preferredRole,
      consentAccepted: onboarding.consentAccepted,
      legalName: onboarding.legalName,
      signedDate: onboarding.signedDate,
      status: onboarding.status,
      createdAt: onboarding.createdAt,
    },
  });
}

export async function POST(request: Request) {
  await connectToDatabase();
  const authUser = await getUserFromSessionCookie();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (authUser.role !== 'student') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const requiredFields = [
    'preferredName',
    'resumeEmail',
    'resumePhone',
    'personalPhone',
    'address',
    'visaStatus',
    'preferredRole',
    'legalName',
    'signedDate',
  ];

  for (const field of requiredFields) {
    if (!body[field] || String(body[field]).trim().length === 0) {
      return NextResponse.json({ error: `Missing ${field}.` }, { status: 400 });
    }
  }

  if (!body.consentAccepted) {
    return NextResponse.json({ error: 'Consent is required.' }, { status: 400 });
  }

  const workExperiences = Array.isArray(body.workExperiences)
    ? body.workExperiences
        .map((item) => ({
          companyName: String(item.companyName || '').trim(),
          location: String(item.location || '').trim(),
          startDate: toDateOrNull(item.startDate),
          endDate: toDateOrNull(item.endDate),
          points: Array.isArray(item.points)
            ? item.points.map((p: string) => String(p).trim()).filter(Boolean)
            : [],
        }))
        .filter((item) => item.companyName && item.location && item.startDate && item.points.length)
    : [];

  const onboardingPayload = {
    userId: authUser.id,
    preferredName: String(body.preferredName).trim(),
    dateOfBirth: toDateOrNull(body.dateOfBirth),
    linkedInUrl: body.linkedInUrl ? String(body.linkedInUrl).trim() : null,
    resumeEmail: String(body.resumeEmail).trim(),
    resumePhone: String(body.resumePhone).trim(),
    personalPhone: String(body.personalPhone).trim(),
    address: String(body.address).trim(),
    workExperiences,
    education: {
      masters: {
        university: body.mastersUniversity ? String(body.mastersUniversity).trim() : null,
        field: body.mastersField ? String(body.mastersField).trim() : null,
        completed: body.mastersCompleted ? String(body.mastersCompleted).trim() : null,
      },
      bachelors: {
        university: body.bachelorsUniversity ? String(body.bachelorsUniversity).trim() : null,
        field: body.bachelorsField ? String(body.bachelorsField).trim() : null,
        completed: body.bachelorsCompleted ? String(body.bachelorsCompleted).trim() : null,
      },
    },
    visaStatus: String(body.visaStatus).trim(),
    arrivalDate: toDateOrNull(body.arrivalDate),
    certifications: body.certifications ? String(body.certifications).trim() : null,
    preferredRole: String(body.preferredRole).trim(),
    consentAccepted: Boolean(body.consentAccepted),
    legalName: String(body.legalName).trim(),
    signedDate: toDateOrNull(body.signedDate),
    status: 'NEW',
  };

  await StudentOnboarding.findOneAndUpdate(
    { userId: authUser.id },
    { $set: onboardingPayload },
    { upsert: true, new: true }
  );

  return NextResponse.json({ ok: true });
}
