import { NextResponse } from 'next/server';
import { JobListing, Student, User, connectToDatabase } from '@/lib/server/mongodb';
import { requireAdminUser } from '@/lib/auth/require-admin';
import type { JobRoleCategory } from '@/lib/jobs/types';
import { roleLabel } from '@/lib/jobs/role-utils';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const auth = await requireAdminUser();
  if (auth.error) return auth.error;

  const { id } = await context.params;

  const job = await JobListing.findById(id).lean();
  if (!job) {
    return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  }

  const students = await Student.find({}).lean();
  const userMap = new Map(
    (
      await User.find({ _id: { $in: students.map((student) => student.userId) } })
        .select({ name: 1, email: 1 })
        .lean()
    ).map((user) => [user._id.toString(), user])
  );

  const roleHints: Record<JobRoleCategory, string[]> = {
    'software-engineer': ['computer', 'software', 'engineering'],
    'data-analyst': ['data', 'statistics', 'analytics', 'mathematics'],
    'java-developer': ['computer', 'software', 'engineering'],
    aiml: ['computer', 'data', 'ai', 'ml'],
    other: ['computer', 'data'],
  };

  const hints = roleHints[(job.roleCategory as JobRoleCategory) || 'other'] || roleHints.other;

  const candidates = students
    .map((student) => {
      const user = userMap.get(student.userId.toString());
      if (!user) return null;
      const major = student.major.toLowerCase();
      const matched = hints.filter((hint) => major.includes(hint)).length;
      const fitScore = Math.min(95, 45 + matched * 20);
      return {
        name: user.name,
        email: user.email,
        major: student.major,
        graduationYear: String(student.graduationYear),
        fitScore,
        fitReason:
          matched > 0 ? `Major alignment: ${student.major} for ${roleLabel(job.roleCategory as JobRoleCategory)}` : 'General transferable fit',
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate))
    .sort((a, b) => b.fitScore - a.fitScore);
  return NextResponse.json({
    job: { ...job, id: job._id.toString() },
    candidates,
  });
}
