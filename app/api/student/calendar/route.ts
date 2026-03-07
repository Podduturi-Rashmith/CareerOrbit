import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { getUserFromSessionCookie } from '@/lib/auth/session';
import { toStudentApplicationDto } from '@/lib/applications/serialize';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getUserFromSessionCookie();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const applications = await prisma.application.findMany({
    where: {
      ...(user.role === 'student' ? { studentUserId: user.id } : {}),
      upcomingEventType: { not: null },
      upcomingEventDate: { not: null },
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [{ upcomingEventDate: 'asc' }, { createdAt: 'desc' }],
  });

  const events = applications
    .map((application) => {
      const dto = toStudentApplicationDto(application);
      return dto.upcomingEvent
        ? {
            id: application.id,
            company: application.companyName,
            type: dto.upcomingEvent.type,
            date: dto.upcomingEvent.date,
            link: dto.upcomingEvent.meetingLink,
            prep: dto.upcomingEvent.prepNotes,
            studentName: application.student.name,
            studentEmail: application.student.email,
          }
        : null;
    })
    .filter((event): event is NonNullable<typeof event> => Boolean(event));

  return NextResponse.json({ events, viewerRole: user.role });
}
