import { NextResponse } from 'next/server';
import { connectToDatabase, User } from '@/lib/server/mongodb';
import { consumeEmailVerificationToken } from '@/lib/auth/verification';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const origin = new URL(request.url).origin;

  if (!token) {
    return NextResponse.redirect(`${origin}/login?verified=0`);
  }

  const record = await consumeEmailVerificationToken(token);
  if (!record) {
    return NextResponse.redirect(`${origin}/login?verified=0`);
  }

  await User.updateOne({ _id: record.userId }, { $set: { emailVerifiedAt: new Date() } });
  return NextResponse.redirect(`${origin}/login?verified=1`);
}
