import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { getUserFromSessionCookie } from '@/lib/auth/session';
import { toStudentApplicationDto } from '@/lib/applications/serialize';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromSessionCookie();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const application = await prisma.application.findUnique({ where: { id } });

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  if (user.role === 'student' && application.studentUserId !== user.id) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  return NextResponse.json({ application: toStudentApplicationDto(application) });
}
