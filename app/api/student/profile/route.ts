import { NextResponse } from 'next/server';
import { Admin, Student, User, connectToDatabase } from '@/lib/server/mongodb';
import { getUserFromSessionCookie } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function GET() {
  await connectToDatabase();
  const authUser = await getUserFromSessionCookie();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findById(authUser.id).lean();
  const student = user ? await Student.findOne({ userId: user._id }).lean() : null;
  const admin = user ? await Admin.findOne({ userId: user._id }).lean() : null;

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    profile: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role === 'ADMIN' ? 'admin' : 'student',
      major: student?.major || null,
      graduationYear: student?.graduationYear || null,
      adminId: admin?.adminId || null,
    },
  });
}
