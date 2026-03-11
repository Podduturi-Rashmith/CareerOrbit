import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase, User } from '@/lib/server/mongodb';
import { createEmailVerificationToken } from '@/lib/auth/verification';
import { sendVerificationEmail } from '@/lib/auth/mailer';

export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  await connectToDatabase();
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).lean();
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  if (user.emailVerifiedAt) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  const { token } = await createEmailVerificationToken(user._id.toString());
  const origin = new URL(request.url).origin;
  const verifyLink = `${origin}/api/auth/verify-email?token=${token}`;
  await sendVerificationEmail(user.email, verifyLink);

  return NextResponse.json({
    ok: true,
    verificationLink: process.env.NODE_ENV !== 'production' ? verifyLink : undefined,
  });
}
