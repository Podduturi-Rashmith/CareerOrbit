import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  listAdminAppliedRecords,
  listAdminAppliedRecordsByEmail,
} from '@/lib/admin/applied-records-store';
import { asTrimmedString, serverErrorResponse } from '@/lib/server/http';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ events: [], viewerRole: 'student' });

    const role = (sessionClaims?.metadata as Record<string, string> | undefined)?.role ?? '';
    const isAdmin = role === 'admin' || role === 'sub-admin';

    const url = new URL(request.url);
    const email = asTrimmedString(url.searchParams.get('email') || '');

    const records = isAdmin
      ? await listAdminAppliedRecords()
      : await listAdminAppliedRecordsByEmail(email);

    const events = records
      .filter((r) => r.upcomingEvent)
      .map((r) => ({
        id: r.id,
        company: r.companyName,
        type: r.upcomingEvent!.type,
        date: r.upcomingEvent!.date,
        link: r.upcomingEvent!.meetingLink,
        prep: r.upcomingEvent!.prepNotes,
        studentName: isAdmin ? r.studentName : undefined,
        studentEmail: isAdmin ? r.studentEmail : undefined,
      }));

    return NextResponse.json({ events, viewerRole: isAdmin ? 'admin' : 'student' });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to load calendar events.');
  }
}
