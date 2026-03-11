import type { ApplicationDoc } from '@/lib/server/mongodb';

export type ApplicationUiStatus = 'Applied' | 'Screening Call' | 'Interview' | 'Assessment' | 'Rejected' | 'Offer';
export type CalendarEventType = 'Screening' | 'Interview' | 'Assessment';

export interface StudentApplicationDto {
  id: string;
  companyName: string;
  jobRole: string;
  status: ApplicationUiStatus;
  resumeUrl: string | null;
  applicationDate: string;
  notes: string | null;
  upcomingEvent?: {
    type: CalendarEventType;
    date: string;
    meetingLink?: string;
    prepNotes?: string;
  };
}

type DbApplicationStatus = 'APPLIED' | 'SCREENING_CALL' | 'INTERVIEW' | 'ASSESSMENT' | 'REJECTED' | 'OFFER';
type DbUpcomingEventType = 'SCREENING' | 'INTERVIEW' | 'ASSESSMENT';

const STATUS_LABELS: Record<DbApplicationStatus, ApplicationUiStatus> = {
  APPLIED: 'Applied',
  SCREENING_CALL: 'Screening Call',
  INTERVIEW: 'Interview',
  ASSESSMENT: 'Assessment',
  REJECTED: 'Rejected',
  OFFER: 'Offer',
};

const EVENT_TYPE_LABELS: Record<DbUpcomingEventType, CalendarEventType> = {
  SCREENING: 'Screening',
  INTERVIEW: 'Interview',
  ASSESSMENT: 'Assessment',
};

export function toStudentApplicationDto(app: ApplicationDoc): StudentApplicationDto {
  const upcomingEvent =
    app.upcomingEventType && app.upcomingEventDate
      ? {
          type: EVENT_TYPE_LABELS[app.upcomingEventType],
          date: app.upcomingEventDate.toISOString(),
          meetingLink: app.meetingLink || undefined,
          prepNotes: app.prepNotes || undefined,
        }
      : undefined;

  return {
    id: app._id.toString(),
    companyName: app.companyName,
    jobRole: app.jobRole,
    status: STATUS_LABELS[app.status],
    resumeUrl: app.resumeUrl ?? null,
    applicationDate: app.applicationDate.toISOString().slice(0, 10),
    notes: app.notes ?? null,
    upcomingEvent,
  };
}
