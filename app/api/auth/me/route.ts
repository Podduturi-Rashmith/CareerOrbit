import { NextResponse } from 'next/server';
import { getUserFromSessionCookie } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getUserFromSessionCookie();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Unable to fetch current user.' }, { status: 500 });
  }
}
