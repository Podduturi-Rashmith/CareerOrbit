import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import type { AuthUser } from '@/lib/auth/types';
import { prisma } from '@/lib/server/prisma';

function toAuthUser(input: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  admin?: { adminId: string } | null;
}): AuthUser {
  const isAdmin = input.role === UserRole.ADMIN;

  return {
    id: input.id,
    name: input.name,
    email: input.email,
    role: isAdmin ? 'admin' : 'student',
    identifier: isAdmin ? input.admin?.adminId || '' : input.email,
  };
}

export async function authenticateUser(identifier: string, password: string): Promise<AuthUser | null> {
  const normalizedInput = identifier.trim();

  const userByEmail = await prisma.user.findUnique({
    where: { email: normalizedInput.toLowerCase() },
    include: {
      student: true,
      admin: true,
    },
  });

  const adminById = !userByEmail
    ? await prisma.admin.findUnique({
        where: { adminId: normalizedInput.toUpperCase() },
        include: {
          user: {
            include: {
              student: true,
              admin: true,
            },
          },
        },
      })
    : null;

  const linkedUser = userByEmail || adminById?.user;
  if (!linkedUser) {
    return null;
  }

  const validPassword = await bcrypt.compare(password, linkedUser.passwordHash);
  if (!validPassword) {
    return null;
  }

  return toAuthUser(linkedUser);
}
