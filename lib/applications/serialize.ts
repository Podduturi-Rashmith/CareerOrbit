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
