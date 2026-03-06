import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateUser } from '@/lib/auth/login';
import { createSession, getSessionCookieMaxAgeSeconds, getSessionCookieName } from '@/lib/auth/session';

export const runtime = 'nodejs';

const loginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid login payload.' }, { status: 400 });
    }

    const { identifier, password } = parsed.data;
    const user = await authenticateUser(identifier, password);

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const { token } = await createSession(user.id);

    const response = NextResponse.json({ user });
    response.cookies.set({
      name: getSessionCookieName(),
      value: token,
      maxAge: getSessionCookieMaxAgeSeconds(),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Unable to login right now.' }, { status: 500 });
  }
}
