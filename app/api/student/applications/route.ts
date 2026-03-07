import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { getUserFromSessionCookie } from '@/lib/auth/session';
import { toStudentApplicationDto } from '@/lib/applications/serialize';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getUserFromSessionCookie();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const applications = await prisma.application.findMany({
    where: user.role === 'student' ? { studentUserId: user.id } : undefined,
    orderBy: [{ applicationDate: 'desc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({ applications: applications.map(toStudentApplicationDto) });
}
