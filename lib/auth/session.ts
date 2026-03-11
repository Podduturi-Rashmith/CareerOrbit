import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { Admin, Session, User, connectToDatabase } from '@/lib/server/mongodb';
import type { AuthUser, AuthRole } from '@/lib/auth/types';
import { Types } from 'mongoose';

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

function toAuthRole(role: 'ADMIN' | 'STUDENT'): AuthRole {
  return role === 'ADMIN' ? 'admin' : 'student';
}

function toAuthUser(input: {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'STUDENT';
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
  await connectToDatabase();
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await Session.create({
    tokenHash,
    userId: new Types.ObjectId(userId),
    expiresAt,
    lastSeenAt: new Date(),
  });

  return { token, expiresAt };
}

export async function getUserFromSessionCookie(): Promise<AuthUser | null> {
  await connectToDatabase();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const session = await Session.findOne({ tokenHash }).lean();

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await Session.deleteOne({ _id: session._id });
    return null;
  }

  await Session.updateOne({ _id: session._id }, { $set: { lastSeenAt: new Date() } });

  const user = await User.findById(session.userId).lean();
  if (!user) return null;
  const admin = user.role === 'ADMIN' ? await Admin.findOne({ userId: user._id }).lean() : null;

  return toAuthUser({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    admin: admin ? { adminId: admin.adminId } : null,
  });
}

export async function deleteSessionForCookie() {
  await connectToDatabase();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return;
  }

  const tokenHash = hashToken(token);
  await Session.deleteMany({ tokenHash });
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionCookieMaxAgeSeconds() {
  return SESSION_TTL_DAYS * 24 * 60 * 60;
}
