import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { listAdminAppliedRecordsByEmail } from '@/lib/admin/applied-records-store';
import { asTrimmedString, serverErrorResponse } from '@/lib/server/http';
import type { StudentApplicationDto } from '@/lib/applications/serialize';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ applications: [] });

    const url = new URL(request.url);
    const email = asTrimmedString(url.searchParams.get('email') || '');
    if (!email) return NextResponse.json({ applications: [] });

    const records = await listAdminAppliedRecordsByEmail(email);
    const applications: StudentApplicationDto[] = records.map((r) => ({
      id: r.id,
      companyName: r.companyName,
      jobRole: r.jobTitle,
      status: r.status ?? 'Applied',
      resumeUrl: r.resumeBlobUrl || null,
      applicationDate: r.appliedOn,
      notes: r.notes || null,
      upcomingEvent: r.upcomingEvent
        ? {
            type: r.upcomingEvent.type,
            date: r.upcomingEvent.date,
            meetingLink: r.upcomingEvent.meetingLink,
            prepNotes: r.upcomingEvent.prepNotes,
          }
        : undefined,
    }));

    return NextResponse.json({ applications });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to load applications.');
  }
}
