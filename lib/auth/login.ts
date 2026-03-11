import bcrypt from 'bcryptjs';
import type { AuthUser } from '@/lib/auth/types';
import { Admin, User, connectToDatabase } from '@/lib/server/mongodb';

function toAuthUser(input: {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  admin?: { adminId: string } | null;
}): AuthUser {
  const isAdmin = input.role === 'ADMIN';

  return {
    id: input.id,
    name: input.name,
    email: input.email,
    role: isAdmin ? 'admin' : 'student',
    identifier: isAdmin ? input.admin?.adminId || '' : input.email,
  };
}

export async function authenticateUser(
  identifier: string,
  password: string
): Promise<{ user: AuthUser; emailVerified: boolean } | null> {
  const normalizedInput = identifier.trim();
  await connectToDatabase();

  const userByEmail = await User.findOne({ email: normalizedInput.toLowerCase() }).lean();

  const adminById = !userByEmail ? await Admin.findOne({ adminId: normalizedInput.toUpperCase() }).lean() : null;
  const adminUser = adminById ? await User.findById(adminById.userId).lean() : null;

  const linkedUser = userByEmail || adminUser;
  if (!linkedUser) {
    return null;
  }

  const validPassword = await bcrypt.compare(password, linkedUser.passwordHash);
  if (!validPassword) {
    return null;
  }

  const admin = linkedUser.role === 'ADMIN' ? await Admin.findOne({ userId: linkedUser._id }).lean() : null;
  return {
    user: toAuthUser({
      id: linkedUser._id.toString(),
      name: linkedUser.name,
      email: linkedUser.email,
      role: linkedUser.role,
      admin: admin ? { adminId: admin.adminId } : null,
    }),
    emailVerified: Boolean(linkedUser.emailVerifiedAt),
  };
}
