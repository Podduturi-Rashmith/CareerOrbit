import { NextResponse } from 'next/server';
import { createAdminJob, listAdminJobs } from '@/lib/admin/jobs-store';
import { jsonError, parseJsonObject, serverErrorResponse } from '@/lib/server/http';
import { AdminJobPayloadSchema } from '@/lib/admin/schemas';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const jobs = await listAdminJobs();
    return NextResponse.json({ jobs });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to load jobs.');
  }
}

export async function POST(request: Request) {
  try {
    const payload = await parseJsonObject(request);
    if (!payload) {
      return jsonError('Invalid payload.', 400);
    }
    const parsed = AdminJobPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Invalid job payload.';
      return jsonError(message, 400);
    }
    const {
      companyName,
      category,
      subcategory,
      jobTitle,
      jobDescription,
      jobLink,
      date,
      studentId,
      studentName,
    } = parsed.data;

    const saved = await createAdminJob({
      companyName,
      category,
      subcategory,
      jobTitle,
      jobDescription,
      jobLink,
      date,
      studentId,
      studentName,
    });

    return NextResponse.json({ ok: true, job: saved });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to create job.');
  }
}
