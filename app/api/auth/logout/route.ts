import { NextResponse } from 'next/server';
import { deleteSessionForCookie, getSessionCookieName } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function POST() {
  try {
    await deleteSessionForCookie();
    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: getSessionCookieName(),
      value: '',
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Unable to logout right now.' }, { status: 500 });
  }
}
