import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAdminAppliedRecordById } from '@/lib/admin/applied-records-store';
import { asTrimmedString, jsonError, serverErrorResponse } from '@/lib/server/http';
import type { StudentApplicationDto } from '@/lib/applications/serialize';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId, sessionClaims } = await auth();
    if (!userId) return jsonError('Unauthorized', 401);

    const url = new URL(request.url);
    const email = asTrimmedString(url.searchParams.get('email') || '');

    const record = await getAdminAppliedRecordById(id);
    if (!record) return jsonError('Application not found', 404);

    // Students may only view their own — admins can view any
    const role = (sessionClaims?.metadata as Record<string, string> | undefined)?.role ?? '';
    const isAdmin = role === 'admin' || role === 'sub-admin';
    if (!isAdmin && email && record.studentEmail.toLowerCase() !== email.toLowerCase()) {
      return jsonError('Application not found', 404);
    }

    const application: StudentApplicationDto = {
      id: record.id,
      companyName: record.companyName,
      jobRole: record.jobTitle,
      status: record.status ?? 'Applied',
      resumeUrl: record.resumeBlobUrl || null,
      applicationDate: record.appliedOn,
      notes: record.notes || null,
      upcomingEvent: record.upcomingEvent
        ? {
            type: record.upcomingEvent.type,
            date: record.upcomingEvent.date,
            meetingLink: record.upcomingEvent.meetingLink,
            prepNotes: record.upcomingEvent.prepNotes,
          }
        : undefined,
    };

    return NextResponse.json({ application });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to load application.');
  }
}
