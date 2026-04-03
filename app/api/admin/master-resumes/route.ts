import { NextResponse } from 'next/server';
import {
  getStudentMasterResumeByEmail,
  upsertStudentMasterResume,
} from '@/lib/admin/master-resume-store';
import { asTrimmedString, jsonError, parseJsonObject, serverErrorResponse } from '@/lib/server/http';
import { MasterResumePayloadSchema } from '@/lib/admin/schemas';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const studentEmail = asTrimmedString(url.searchParams.get('studentEmail') || '');
    if (!studentEmail) {
      return jsonError('studentEmail is required', 400);
    }
    const resume = await getStudentMasterResumeByEmail(studentEmail);
    return NextResponse.json({ resume });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to load master resume.');
  }
}

export async function POST(request: Request) {
  try {
    const payload = await parseJsonObject(request);
    if (!payload) {
      return jsonError('Invalid payload', 400);
    }
    const parsed = MasterResumePayloadSchema.safeParse(payload);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Invalid master resume payload.';
      return jsonError(message, 400);
    }
    const { studentId, studentName, studentEmail, fileName, mimeType, fileDataUrl, extractedText } =
      parsed.data;

    const saved = await upsertStudentMasterResume({
      studentId,
      studentName,
      studentEmail,
      fileName,
      mimeType,
      fileDataUrl,
      extractedText,
    });

    return NextResponse.json({ ok: true, resume: saved });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to save master resume.');
  }
}
