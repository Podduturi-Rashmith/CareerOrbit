import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { getUserFromSessionCookie } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function GET() {
  const authUser = await getUserFromSessionCookie();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: { student: true, admin: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role === 'ADMIN' ? 'admin' : 'student',
      major: user.student?.major || null,
      graduationYear: user.student?.graduationYear || null,
      adminId: user.admin?.adminId || null,
    },
  });
}
