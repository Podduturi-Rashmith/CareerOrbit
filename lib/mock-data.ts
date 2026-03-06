export type ApplicationStatus = 
  | 'Applied' 
  | 'Screening Call' 
  | 'Interview' 
  | 'Assessment' 
  | 'Rejected' 
  | 'Offer';

export interface JobApplication {
  id: string;
  studentId: string;
  companyName: string;
  jobRole: string;
  status: ApplicationStatus;
  resumeUrl: string;
  applicationDate: string;
  notes?: string;
  upcomingEvent?: {
    type: 'Screening' | 'Interview' | 'Assessment';
    date: string;
    meetingLink?: string;
    prepNotes?: string;
  };
}

export interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
  major: string;
  graduationYear: string;
}

export const MOCK_STUDENTS: Student[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex.j@example.com',
    studentId: 'STU001',
    major: 'Computer Science',
    graduationYear: '2025',
  },
  {
    id: '2',
    name: 'Sarah Smith',
    email: 'sarah.s@example.com',
    studentId: 'STU002',
    major: 'Data Science',
    graduationYear: '2024',
  },
];

export interface Admin {
  id: string;
  name: string;
  email: string;
  adminId: string;
}

export const MOCK_ADMINS: Admin[] = [
  {
    id: 'admin1',
    name: 'Jane Smith',
    email: 'jane.admin@example.com',
    adminId: 'ADM001',
  },
  {
    id: 'admin2',
    name: 'Robert Brown',
    email: 'robert.admin@example.com',
    adminId: 'ADM002',
  },
];

export interface Placement {
  id: string;
  studentName: string;
  companyName: string;
  role: string;
  year: string;
  testimonial: string;
}

export const MOCK_PLACEMENTS: Placement[] = [
  {
    id: 'p1',
    studentName: 'Michael Chen',
    companyName: 'Google',
    role: 'Software Engineer',
    year: '2023',
    testimonial: 'The portal helped me stay organized and finally land my dream job!',
  },
  {
    id: 'p2',
    studentName: 'Emily Davis',
    companyName: 'Amazon',
    role: 'Product Manager',
    year: '2023',
    testimonial: 'Incredible support from the team. The tracking was seamless.',
  },
];

export const MOCK_APPLICATIONS: JobApplication[] = [
  {
    id: 'app1',
    studentId: 'STU001',
    companyName: 'TechCorp',
    jobRole: 'Frontend Developer',
    status: 'Interview',
    resumeUrl: '#',
    applicationDate: '2024-03-01',
    notes: 'Strong focus on React and Tailwind.',
    upcomingEvent: {
      type: 'Interview',
      date: '2024-03-10T14:00:00Z',
      meetingLink: 'https://zoom.us/j/123456789',
      prepNotes: 'Review system design and React hooks.',
    },
  },
  {
    id: 'app2',
    studentId: 'STU001',
    companyName: 'DataFlow',
    jobRole: 'Software Engineer',
    status: 'Applied',
    resumeUrl: '#',
    applicationDate: '2024-03-05',
    notes: 'Applied via internal referral.',
  },
  {
    id: 'app3',
    studentId: 'STU001',
    companyName: 'CloudScale',
    jobRole: 'Fullstack Engineer',
    status: 'Screening Call',
    resumeUrl: '#',
    applicationDate: '2024-02-28',
    upcomingEvent: {
      type: 'Screening',
      date: '2024-03-08T10:00:00Z',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
    },
  },
  {
    id: 'app4',
    studentId: 'STU001',
    companyName: 'InnovateAI',
    jobRole: 'AI Research Intern',
    status: 'Rejected',
    resumeUrl: '#',
    applicationDate: '2024-02-15',
  },
  {
    id: 'app5',
    studentId: 'STU001',
    companyName: 'FinTech Solutions',
    jobRole: 'Backend Developer',
    status: 'Offer',
    resumeUrl: '#',
    applicationDate: '2024-02-10',
  },
];
