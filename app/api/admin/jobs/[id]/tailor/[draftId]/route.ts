import { NextResponse } from 'next/server';
import {
  getTailoredResumeDraftById,
  updateTailoredResumeDraftContent,
} from '@/lib/admin/tailored-resume-store';
import { TailorDraftUpdatePayloadSchema } from '@/lib/admin/schemas';
import { jsonError, parseJsonObject, serverErrorResponse } from '@/lib/server/http';

export const runtime = 'nodejs';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string; draftId: string }> }
) {
  try {
    const { id: jobId, draftId } = await context.params;
    const draft = await getTailoredResumeDraftById(draftId);
    if (!draft || draft.jobId !== jobId) {
      return jsonError('Draft not found for this job.', 404);
    }

    const payload = await parseJsonObject(request);
    if (!payload) return jsonError('Invalid payload', 400);

    const parsed = TailorDraftUpdatePayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || 'Invalid draft update payload.', 400);
    }

    const updated = await updateTailoredResumeDraftContent({
      id: draftId,
      content: parsed.data.content,
    });
    if (!updated) return jsonError('Draft update failed.', 500);

    return NextResponse.json({
      ok: true,
      draft: {
        id: updated.id,
        downloadUrl: `/api/admin/jobs/${jobId}/tailor/${updated.id}/download`,
      },
    });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to update tailored resume draft.');
  }
}
