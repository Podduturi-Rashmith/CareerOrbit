import { NextResponse } from 'next/server';
import { JobListing, TailoredResume, connectToDatabase } from '@/lib/server/mongodb';
import { requireAdminUser } from '@/lib/auth/require-admin';
import type { JobRoleCategory } from '@/lib/jobs/types';
import { generateResumeDocxBuffer, makeResumeFilename } from '@/lib/jobs/resume-docx';
import { MOCK_STUDENTS } from '@/lib/mock-data';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ id: string; draftId: string }> }) {
  await connectToDatabase();
  const auth = await requireAdminUser();
  if (auth.error) return auth.error;

  const { id, draftId } = await context.params;

  const draft = await TailoredResume.findById(draftId).lean();

  if (!draft || draft.jobId.toString() !== id) {
    return NextResponse.json({ error: 'Resume draft not found.' }, { status: 404 });
  }

  const job = await JobListing.findById(id).lean();
  if (!job) {
    return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  }

  const studentProfile = MOCK_STUDENTS.find((student) => student.email.toLowerCase() === draft.studentEmail.toLowerCase());

  const buffer = await generateResumeDocxBuffer({
    studentName: draft.studentName,
    studentEmail: draft.studentEmail,
    roleCategory: draft.roleCategory as JobRoleCategory,
    targetRoleTitle: job.title,
    companyName: job.company,
    major: studentProfile?.major,
    graduationYear: studentProfile?.graduationYear,
    jobDescription: job.description,
    baseResume: studentProfile?.baseResume,
  });

  const filename = makeResumeFilename(draft.studentName, draft.roleCategory as JobRoleCategory, job.company);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
