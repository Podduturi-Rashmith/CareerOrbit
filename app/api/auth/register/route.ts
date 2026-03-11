import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { Student, User, connectToDatabase } from '@/lib/server/mongodb';
import { createEmailVerificationToken } from '@/lib/auth/verification';
import { sendVerificationEmail } from '@/lib/auth/mailer';

export const runtime = 'nodejs';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  email: z.email().toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(128, 'Password is too long.'),
  major: z.string().trim().max(100).optional(),
  graduationYear: z.number().int().min(2000).max(2100).optional(),
});

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid registration payload.' },
        { status: 400 }
      );
    }

    const { name, email, password, major, graduationYear } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json({ error: 'Email already exists. Try signing in instead.' }, { status: 409 });
    }

    const user = await User.create({
      name,
      email,
      role: 'STUDENT',
      passwordHash,
    });

    await Student.create({
      userId: user._id,
      major: major || 'Undeclared',
      graduationYear: graduationYear || new Date().getFullYear() + 4,
    });

    const { token } = await createEmailVerificationToken(user._id.toString());
    const origin = new URL(request.url).origin;
    const verifyLink = `${origin}/api/auth/verify-email?token=${token}`;
    await sendVerificationEmail(user.email, verifyLink);

    const response = NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: 'student',
        identifier: user.email,
      },
      requiresVerification: true,
      verificationLink: process.env.NODE_ENV !== 'production' ? verifyLink : undefined,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Unable to create account right now.' }, { status: 500 });
  }
}
