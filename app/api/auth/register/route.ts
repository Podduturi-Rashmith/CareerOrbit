import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { Prisma, UserRole } from '@prisma/client';
import { prisma } from '@/lib/server/prisma';
import { createSession, getSessionCookieMaxAgeSeconds, getSessionCookieName } from '@/lib/auth/session';

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

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: UserRole.STUDENT,
        passwordHash,
        student: {
          create: {
            major: major || 'Undeclared',
            graduationYear: graduationYear || new Date().getFullYear() + 4,
          },
        },
      },
      include: {
        student: true,
      },
    });

    const { token } = await createSession(user.id);
    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'student',
        identifier: user.email,
      },
    });

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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already exists. Try signing in instead.' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Unable to create account right now.' }, { status: 500 });
  }
}
