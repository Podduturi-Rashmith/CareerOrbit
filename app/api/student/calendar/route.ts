import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import {
  listAdminAppliedRecords,
  listAdminAppliedRecordsByEmail,
} from '@/lib/admin/applied-records-store';
import { serverErrorResponse } from '@/lib/server/http';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ events: [], viewerRole: 'student' });
    }

    const role = (user.publicMetadata?.role as string | undefined) ?? '';
    const isAdmin = role === 'admin' || role === 'sub-admin';
    const email = user.emailAddresses[0]?.emailAddress ?? '';

    const records = isAdmin
      ? await listAdminAppliedRecords()
      : await listAdminAppliedRecordsByEmail(email);

    // Only return records that have an upcoming event
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
