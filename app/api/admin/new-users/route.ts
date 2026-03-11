import { NextResponse } from 'next/server';
import { StudentOnboarding, User, connectToDatabase } from '@/lib/server/mongodb';
import { requireAdminUser } from '@/lib/auth/require-admin';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  await connectToDatabase();
  const auth = await requireAdminUser();
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const includeCountOnly = url.searchParams.get('countOnly') === '1';

  const onboardingRecords = await StudentOnboarding.find({ status: 'NEW' }).sort({ createdAt: -1 }).lean();
  const userIds = onboardingRecords.map((record) => record.userId);
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = new Map(users.map((user) => [user._id.toString(), user]));

  if (includeCountOnly) {
    return NextResponse.json({ count: onboardingRecords.length });
  }

  const newUsers = onboardingRecords.map((record) => {
    const user = userMap.get(record.userId.toString());
    return {
      id: record._id.toString(),
      userId: record.userId.toString(),
      name: user?.name || record.preferredName,
      email: user?.email || record.resumeEmail,
      preferredName: record.preferredName,
      dateOfBirth: record.dateOfBirth,
      linkedInUrl: record.linkedInUrl,
      resumeEmail: record.resumeEmail,
      resumePhone: record.resumePhone,
      personalPhone: record.personalPhone,
      address: record.address,
      workExperiences: record.workExperiences || [],
      education: record.education || null,
      visaStatus: record.visaStatus,
      arrivalDate: record.arrivalDate,
      certifications: record.certifications,
      preferredRole: record.preferredRole,
      legalName: record.legalName,
      signedDate: record.signedDate,
      createdAt: record.createdAt,
      status: record.status,
    };
  });

  return NextResponse.json({ newUsers });
}
