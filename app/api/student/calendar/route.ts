import { NextResponse } from 'next/server';
import { Application, User, connectToDatabase } from '@/lib/server/mongodb';
import { getUserFromSessionCookie } from '@/lib/auth/session';
import { toStudentApplicationDto } from '@/lib/applications/serialize';

export const runtime = 'nodejs';

export async function GET() {
  await connectToDatabase();
  const user = await getUserFromSessionCookie();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const applications = await Application.find({
    ...(user.role === 'student' ? { studentUserId: user.id } : {}),
    upcomingEventType: { $ne: null },
    upcomingEventDate: { $ne: null },
  })
    .sort({ upcomingEventDate: 1, createdAt: -1 })
    .lean();

  const studentUserIds = Array.from(new Set(applications.map((application) => application.studentUserId.toString())));
  const students = await User.find({ _id: { $in: studentUserIds } }).select({ name: 1, email: 1 }).lean();
  const studentById = new Map(students.map((student) => [student._id.toString(), student]));

  const events = applications
    .map((application) => {
      const dto = toStudentApplicationDto(application);
      return dto.upcomingEvent
        ? {
            id: application._id.toString(),
            company: application.companyName,
            type: dto.upcomingEvent.type,
            date: dto.upcomingEvent.date,
            link: dto.upcomingEvent.meetingLink,
            prep: dto.upcomingEvent.prepNotes,
            studentName: studentById.get(application.studentUserId.toString())?.name || '',
            studentEmail: studentById.get(application.studentUserId.toString())?.email || '',
          }
        : null;
    })
    .filter((event): event is NonNullable<typeof event> => Boolean(event));

  return NextResponse.json({ events, viewerRole: user.role });
}
