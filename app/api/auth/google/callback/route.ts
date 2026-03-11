import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sendWelcomeEmail } from '@/lib/auth/mailer';
import { connectToDatabase, Student, User } from '@/lib/server/mongodb';
import { createSession, getSessionCookieMaxAgeSeconds, getSessionCookieName } from '@/lib/auth/session';

export const runtime = 'nodejs';

type GoogleTokenResponse = {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
};

type GoogleUserInfo = {
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  sub: string;
};

export async function GET(request: Request) {
  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const cookieState = cookies().get('google_oauth_state')?.value;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!code || !state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(new URL('/login?oauth=failed', request.url));
  }

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL('/login?oauth=failed', request.url));
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/login?oauth=failed', request.url));
  }

  const tokenData = (await tokenRes.json()) as GoogleTokenResponse;
  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userRes.ok) {
    return NextResponse.redirect(new URL('/login?oauth=failed', request.url));
  }

  const profile = (await userRes.json()) as GoogleUserInfo;
  const email = profile.email?.toLowerCase();
  if (!email) {
    return NextResponse.redirect(new URL('/login?oauth=failed', request.url));
  }

  let user = await User.findOne({ email }).lean();
  let createdNow = false;
  if (user && user.role !== 'STUDENT') {
    return NextResponse.redirect(new URL('/login?oauth=blocked', request.url));
  }
  if (!user) {
    user = await User.create({
      name: profile.name || profile.given_name || 'Student',
      email,
      role: 'STUDENT',
      passwordHash: 'oauth',
      emailVerifiedAt: profile.email_verified ? new Date() : null,
    });
    createdNow = true;
    await Student.create({
      userId: user._id,
      major: 'Undeclared',
      graduationYear: new Date().getFullYear() + 4,
    });
  } else if (user.role === 'STUDENT') {
    await Student.updateOne(
      { userId: user._id },
      { $setOnInsert: { userId: user._id, major: 'Undeclared', graduationYear: new Date().getFullYear() + 4 } },
      { upsert: true }
    );
    if (!user.emailVerifiedAt && profile.email_verified) {
      await User.updateOne({ _id: user._id }, { $set: { emailVerifiedAt: new Date() } });
    }
  }

  if (createdNow) {
    await sendWelcomeEmail(email, profile.given_name || profile.name);
  }

  const { token } = await createSession(user._id.toString());
  const response = NextResponse.redirect(
    new URL(createdNow ? '/dashboard?welcome=1' : '/dashboard', request.url)
  );
  response.cookies.set({
    name: getSessionCookieName(),
    value: token,
    maxAge: getSessionCookieMaxAgeSeconds(),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  response.cookies.set({
    name: 'google_oauth_state',
    value: '',
    maxAge: 0,
    path: '/',
  });

  return response;
}
