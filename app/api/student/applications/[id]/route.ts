import { NextResponse } from 'next/server';
import { Application, connectToDatabase } from '@/lib/server/mongodb';
import { getUserFromSessionCookie } from '@/lib/auth/session';
import { toStudentApplicationDto } from '@/lib/applications/serialize';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const user = await getUserFromSessionCookie();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const application = await Application.findById(id).lean();

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  if (user.role === 'student' && application.studentUserId.toString() !== user.id) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  return NextResponse.json({ application: toStudentApplicationDto(application) });
}
