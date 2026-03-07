import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';
import { requireAdminUser } from '@/lib/auth/require-admin';
import { buildTailoredResumeSummary } from '@/lib/jobs/student-match';
import type { JobRoleCategory } from '@/lib/jobs/types';
import { MOCK_STUDENTS } from '@/lib/mock-data';

export const runtime = 'nodejs';

const tailorSchema = z.object({
  studentEmail: z.string().email(),
  studentName: z.string().min(1),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminUser();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = tailorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const { id } = await context.params;
  const job = await prisma.jobListing.findUnique({ where: { id } });

  if (!job) {
    return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  }

  const summary = buildTailoredResumeSummary({
    studentName: parsed.data.studentName,
    roleCategory: job.roleCategory as JobRoleCategory,
    jobTitle: job.title,
    company: job.company,
    jobDescription: job.description,
    baseResume: MOCK_STUDENTS.find((student) => student.email.toLowerCase() === parsed.data.studentEmail.toLowerCase())?.baseResume,
  });

  const draft = await prisma.tailoredResume.create({
    data: {
      jobId: job.id,
      studentEmail: parsed.data.studentEmail,
      studentName: parsed.data.studentName,
      roleCategory: job.roleCategory,
      summary,
      generatedById: auth.user.id,
    },
  });

  return NextResponse.json({ draft, job });
}
