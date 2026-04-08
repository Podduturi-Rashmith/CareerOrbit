import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getAdminAppliedRecordById } from '@/lib/admin/applied-records-store';
import { jsonError, serverErrorResponse } from '@/lib/server/http';
import type { StudentApplicationDto } from '@/lib/applications/serialize';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;
    if (!email) {
      return jsonError('Unauthorized', 401);
    }

    const record = await getAdminAppliedRecordById(id);
    if (!record) {
      return jsonError('Application not found', 404);
    }

    // Students may only view their own applications
    const role = (user.publicMetadata?.role as string | undefined) ?? '';
    const isAdmin = role === 'admin' || role === 'sub-admin';
    if (!isAdmin && record.studentEmail.toLowerCase() !== email.toLowerCase()) {
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
