import { NextResponse } from 'next/server';
import { getUserFromSessionCookie } from '@/lib/auth/session';

export async function requireAdminUser() {
  const user = await getUserFromSessionCookie();

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (user.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { user };
}
