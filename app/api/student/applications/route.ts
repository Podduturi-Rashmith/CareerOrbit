import { NextResponse } from 'next/server';
import { Application, connectToDatabase } from '@/lib/server/mongodb';
import { getUserFromSessionCookie } from '@/lib/auth/session';
import { toStudentApplicationDto } from '@/lib/applications/serialize';

export const runtime = 'nodejs';

export async function GET() {
  await connectToDatabase();
  const user = await getUserFromSessionCookie();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const applications = await Application.find(user.role === 'student' ? { studentUserId: user.id } : {})
    .sort({ applicationDate: -1, createdAt: -1 })
    .lean();

  return NextResponse.json({ applications: applications.map(toStudentApplicationDto) });
}
