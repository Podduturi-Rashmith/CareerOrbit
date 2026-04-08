import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateAdminAppliedRecord } from '@/lib/admin/applied-records-store';
import { jsonError, parseJsonObject, serverErrorResponse } from '@/lib/server/http';

export const runtime = 'nodejs';

const PatchSchema = z.object({
  status: z
    .enum(['Applied', 'Screening Call', 'Interview', 'Assessment', 'Rejected', 'Offer'])
    .optional(),
  notes: z.string().trim().optional(),
  upcomingEvent: z
    .object({
      type: z.enum(['Screening', 'Interview', 'Assessment']),
      date: z.string().min(1),
      meetingLink: z.string().optional(),
      prepNotes: z.string().optional(),
    })
    .nullable()
    .optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await parseJsonObject(request);
    if (!body) {
      return jsonError('Invalid payload', 400);
    }
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Invalid payload.';
      return jsonError(message, 400);
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
    if (parsed.data.upcomingEvent !== undefined) {
      updates.upcomingEvent = parsed.data.upcomingEvent ?? undefined;
    }

    const updated = await updateAdminAppliedRecord(
      id,
      updates as Parameters<typeof updateAdminAppliedRecord>[1]
    );

    if (!updated) {
      return jsonError('Record not found', 404);
    }

    return NextResponse.json({ ok: true, record: updated });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to update application record.');
  }
}
