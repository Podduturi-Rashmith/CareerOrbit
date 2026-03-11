import { createHash, randomBytes } from 'crypto';
import { VerificationToken } from '@/lib/server/mongodb';

const TOKEN_TTL_HOURS = 24;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createEmailVerificationToken(userId: string) {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await VerificationToken.create({
    userId,
    tokenHash,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function consumeEmailVerificationToken(token: string) {
  const tokenHash = hashToken(token);
  const record = await VerificationToken.findOne({ tokenHash }).lean();
  if (!record) return null;
  if (record.expiresAt.getTime() <= Date.now()) {
    await VerificationToken.deleteOne({ _id: record._id });
    return null;
  }
  await VerificationToken.deleteOne({ _id: record._id });
  return { userId: record.userId.toString() };
}
