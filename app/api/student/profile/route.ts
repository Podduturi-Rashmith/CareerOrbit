import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getStudentOnboardingByEmail } from '@/lib/admin/student-onboarding-store';
import { asTrimmedString, serverErrorResponse } from '@/lib/server/http';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ profile: null });
    }

    const url = new URL(request.url);
    const email = asTrimmedString(url.searchParams.get('email') || '');
    const name = asTrimmedString(url.searchParams.get('name') || '');
    const role = (sessionClaims?.metadata as Record<string, string> | undefined)?.role ?? '';
    const isAdmin = role === 'admin' || role === 'sub-admin';

    if (isAdmin) {
      return NextResponse.json({
        profile: {
          id: userId,
          name,
          email,
          role: 'admin',
          major: null,
          graduationYear: null,
          adminId: userId,
        },
      });
    }

    const onboarding = email ? await getStudentOnboardingByEmail(email) : null;

    return NextResponse.json({
      profile: {
        id: userId,
        name: onboarding?.preferredName || name,
        email,
        role: 'student',
        major: onboarding?.mastersField || onboarding?.bachelorsField || null,
        graduationYear: onboarding?.mastersCompleted
          ? Number.parseInt(onboarding.mastersCompleted, 10) || null
          : onboarding?.bachelorsCompleted
            ? Number.parseInt(onboarding.bachelorsCompleted, 10) || null
            : null,
        adminId: null,
        masterResumeUrl: onboarding?.masterResumeUrl || null,
        masterResumeFileName: onboarding?.masterResumeFileName || null,
      },
    });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to load profile.');
  }
}
