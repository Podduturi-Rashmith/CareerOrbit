import { NextResponse } from 'next/server';
import {
  createAdminAppliedRecord,
  listAdminAppliedRecords,
} from '@/lib/admin/applied-records-store';
import { jsonError, parseJsonObject, serverErrorResponse } from '@/lib/server/http';
import { AdminAppliedRecordPayloadSchema } from '@/lib/admin/schemas';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const records = await listAdminAppliedRecords();
    return NextResponse.json({ records });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to load applied records.');
  }
}

export async function POST(request: Request) {
  try {
    const payload = await parseJsonObject(request);
    if (!payload) {
      return jsonError('Invalid payload', 400);
    }
    const parsed = AdminAppliedRecordPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Invalid applied record payload.';
      return jsonError(message, 400);
    }
    const {
      jobId,
      jobTitle,
      companyName,
      category,
      studentId,
      studentName,
      studentEmail,
      draftId,
      draftFileName,
      appliedOn,
      notes,
    } = parsed.data;

    const record = await createAdminAppliedRecord({
      jobId,
      jobTitle,
      companyName,
      category,
      studentId,
      studentName,
      studentEmail,
      draftId,
      draftFileName,
      appliedOn,
      notes,
    });

    return NextResponse.json({ ok: true, record });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to save applied record.');
  }
}
