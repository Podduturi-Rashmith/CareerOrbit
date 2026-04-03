import { NextResponse } from 'next/server';
import { getAdminJobById, updateAdminJob } from '@/lib/admin/jobs-store';
import { jsonError, parseJsonObject, serverErrorResponse } from '@/lib/server/http';
import { AdminJobUpdatePayloadSchema } from '@/lib/admin/schemas';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const job = await getAdminJobById(id);
    if (!job) return jsonError('Job not found.', 404);
    return NextResponse.json({ job });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to load job.');
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const payload = await parseJsonObject(request);
    if (!payload) {
      return jsonError('Invalid payload.', 400);
    }
    const parsed = AdminJobUpdatePayloadSchema.safeParse(payload);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Invalid job payload.';
      return jsonError(message, 400);
    }
    const { companyName, category, subcategory, jobTitle, jobDescription, jobLink, date } =
      parsed.data;

    const updated = await updateAdminJob(id, {
      companyName,
      category,
      subcategory,
      jobTitle,
      jobDescription,
      jobLink,
      date,
    });

    if (!updated) return jsonError('Job not found.', 404);
    return NextResponse.json({ ok: true, job: updated });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to update job.');
  }
}
