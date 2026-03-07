import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/server/prisma';
import type { AuthUser, AuthRole } from '@/lib/auth/types';
import { UserRole } from '@prisma/client';

const SESSION_COOKIE_NAME = 'careerorbit_session';
const SESSION_TTL_DAYS = 7;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET is required in production.');
  }

  return 'dev-only-session-secret-change-me';
}

function hashToken(token: string) {
  return createHash('sha256').update(`${token}:${getSessionSecret()}`).digest('hex');
}

function toAuthRole(role: UserRole): AuthRole {
  return role === UserRole.ADMIN ? 'admin' : 'student';
}

function toAuthUser(input: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  admin?: { adminId: string } | null;
}): AuthUser {
  const role = toAuthRole(input.role);
  const identifier = role === 'admin' ? input.admin?.adminId : input.email;

  return {
    id: input.id,
    name: input.name,
    email: input.email,
    role,
    identifier: identifier || '',
  };
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function getUserFromSessionCookie(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          student: true,
          admin: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  return toAuthUser(session.user);
}

export async function deleteSessionForCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return;
  }

  const tokenHash = hashToken(token);
  await prisma.session.deleteMany({ where: { tokenHash } });
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionCookieMaxAgeSeconds() {
  return SESSION_TTL_DAYS * 24 * 60 * 60;
}
