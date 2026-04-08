import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getStudentOnboardingByEmail } from '@/lib/admin/student-onboarding-store';
import { serverErrorResponse } from '@/lib/server/http';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ profile: null });
    }

    const email = user.emailAddresses[0]?.emailAddress ?? '';
    const role = (user.publicMetadata?.role as string | undefined) ?? '';
    const isAdmin = role === 'admin' || role === 'sub-admin';
    const fullName =
      [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || email;

    if (isAdmin) {
      return NextResponse.json({
        profile: {
          id: user.id,
          name: fullName,
          email,
          role: 'admin',
          major: null,
          graduationYear: null,
          adminId: user.id,
        },
      });
    }

    const onboarding = await getStudentOnboardingByEmail(email);

    return NextResponse.json({
      profile: {
        id: user.id,
        name: onboarding?.preferredName || fullName,
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
