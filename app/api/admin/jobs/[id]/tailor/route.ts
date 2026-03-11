import { NextResponse } from 'next/server';
import { z } from 'zod';
import { JobListing, TailoredResume, connectToDatabase } from '@/lib/server/mongodb';
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
  await connectToDatabase();
  const auth = await requireAdminUser();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = tailorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const { id } = await context.params;
  const job = await JobListing.findById(id).lean();

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

  const draft = await TailoredResume.create({
    jobId: job._id,
    studentEmail: parsed.data.studentEmail,
    studentName: parsed.data.studentName,
    roleCategory: job.roleCategory,
    summary,
    generatedById: auth.user.id,
  });

  return NextResponse.json({
    draft: {
      ...draft.toObject(),
      id: draft._id.toString(),
      jobId: draft.jobId.toString(),
      generatedById: draft.generatedById ? draft.generatedById.toString() : null,
    },
    job: { ...job, id: job._id.toString() },
  });
}
