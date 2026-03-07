import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireAdminUser } from '@/lib/auth/require-admin';
import { findCandidatesForRole } from '@/lib/jobs/student-match';
import type { JobRoleCategory } from '@/lib/jobs/types';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminUser();
  if (auth.error) return auth.error;

  const { id } = await context.params;

  const job = await prisma.jobListing.findUnique({ where: { id } });
  if (!job) {
    return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  }

  const candidates = findCandidatesForRole(job.roleCategory as JobRoleCategory);
  return NextResponse.json({ job, candidates });
}
