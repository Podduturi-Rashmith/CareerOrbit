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
  baseResume: {
    headline: string;
    summaryBullets: string[];
    technicalSkills: Record<string, string[]>;
    experience: Array<{
      company: string;
      period: string;
      role: string;
      bullets: string[];
    }>;
  };
}

export const MOCK_STUDENTS: Student[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex.j@example.com',
    studentId: 'STU001',
    major: 'Computer Science',
    graduationYear: '2025',
    baseResume: {
      headline: 'Backend-focused Software Engineer',
      summaryBullets: [
        'Built backend APIs and data services for student-facing and operational workflows in cloud environments.',
        'Delivered integrations with external platforms using structured authentication, data validation, and retry handling.',
        'Optimized database queries and API payload strategies to improve latency and dashboard responsiveness.',
        'Collaborated with product and analytics teams to convert business requirements into reliable technical deliverables.',
      ],
      technicalSkills: {
        'Programming Languages': ['Python', 'TypeScript', 'JavaScript', 'SQL'],
        'Frameworks & APIs': ['Node.js', 'Express.js', 'FastAPI', 'REST APIs'],
        'Cloud & DevOps': ['AWS', 'Docker', 'GitHub Actions'],
        'Databases': ['PostgreSQL', 'MySQL', 'MongoDB'],
      },
      experience: [
        {
          company: 'CareerOrbit Labs',
          period: '2024 - Present',
          role: 'Software Engineer Intern',
          bullets: [
            'Developed backend endpoints for application tracking and role-based workflows.',
            'Implemented secure auth and session handling using API-driven architecture patterns.',
            'Improved deployment reliability through CI checks and release validation automation.',
            'Partnered with frontend teams to stabilize data contracts and reduce integration issues.',
          ],
        },
        {
          company: 'Campus Tech Initiative',
          period: '2023 - 2024',
          role: 'Fullstack Project Developer',
          bullets: [
            'Built end-to-end student project modules with reusable components and REST integrations.',
            'Created reporting queries and summary dashboards for mentor and admin review cycles.',
            'Documented architecture decisions to support maintainability and onboarding.',
            'Participated in peer reviews to improve quality and long-term code sustainability.',
          ],
        },
      ],
    },
  },
  {
    id: '2',
    name: 'Sarah Smith',
    email: 'sarah.s@example.com',
    studentId: 'STU002',
    major: 'Data Science',
    graduationYear: '2024',
    baseResume: {
      headline: 'Data Analyst',
      summaryBullets: [
        'Analyzed business and product data using SQL and Python to provide actionable reporting insights.',
        'Built recurring dashboards and KPI reports for operational decision-making and stakeholder visibility.',
        'Improved data quality through validation checks, metric governance, and query optimization.',
        'Collaborated with engineering and product teams to ensure analytics reliability across releases.',
      ],
      technicalSkills: {
        'Programming Languages': ['Python', 'SQL', 'R'],
        'Analytics & BI': ['Tableau', 'Power BI', 'Excel', 'Looker Studio'],
        'Data Processing': ['Pandas', 'ETL Pipelines', 'Data Cleaning'],
        'Databases': ['PostgreSQL', 'MySQL', 'BigQuery'],
      },
      experience: [
        {
          company: 'Data Insights Team',
          period: '2023 - Present',
          role: 'Data Analyst Intern',
          bullets: [
            'Created SQL-based KPI reporting pipelines for growth, conversion, and engagement metrics.',
            'Designed dashboards and data stories for non-technical stakeholders and leadership reviews.',
            'Automated recurring analytics reports, reducing manual turnaround time.',
            'Validated source data and maintained metric definitions for reporting consistency.',
          ],
        },
        {
          company: 'University Analytics Lab',
          period: '2022 - 2023',
          role: 'Research Analytics Assistant',
          bullets: [
            'Performed exploratory analysis on multi-source datasets to identify trend patterns.',
            'Built reproducible notebooks for cleaning, transformation, and feature extraction workflows.',
            'Supported survey and experiment analysis through statistical interpretation and documentation.',
            'Presented insights to faculty and peers with visual narratives and concise executive summaries.',
          ],
        },
      ],
    },
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
    name: 'Rashmith Reddy Podduturi',
    email: 'rashmith.admin@example.com',
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
    studentName: 'Rashmith Reddy Podduturi',
    companyName: 'Amazon',
    role: 'Software Engineer, AI/ML',
    year: 'June 2025',
    testimonial: 'During my initial OPT, I connected with CareerOrbit while completing my Master’s. The platform submitted about 50 job applications daily on my behalf, allowing me to focus on studying and preparing for interviews. Within one month of my OPT start date, I successfully landed a job.',
  },
  {
    id: 'p2',
    studentName: 'Keerthi Chowdary',
    companyName: '',
    role: 'Senior Validation Engineer',
    year: 'July 2025',
    testimonial: 'I initially worked with a consultancy during my OPT, but the experience wasn’t great due to high service fees and unclear payment. While working on a contract role, I discovered this platform and connected with the team before my contract ended. Their support helped me successfully transition into a full-time position.',
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
