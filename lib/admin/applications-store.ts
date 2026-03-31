export const APPLICATION_CATEGORY_MAP = {
  'Software Engineering': [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Mobile App Developer (iOS/Android)',
    'Web Developer',
  ],
  'Data Roles': [
    'Data Analyst',
    'Data Scientist',
    'Data Engineer',
    'Business Intelligence (BI) Analyst',
    'Business Analyst',
  ],
  'AI/Machine Learning': [
    'Machine Learning Engineer',
    'AI Engineer',
    'NLP Engineer',
    'Computer Vision Engineer',
  ],
  'Cloud/DevOps': [
    'DevOps Engineer',
    'Cloud Engineer',
    'Site Reliability Engineer (SRE)',
    'Platform Engineer',
  ],
  'QA/Testing': [
    'QA Engineer',
    'Automation Tester',
    'Manual Tester',
    'Software Test Engineer',
  ],
  'Business/Product': [
    'Product Manager',
    'Project Manager',
    'Program Manager',
    'Operations Analyst',
    'Business Operations Analyst',
  ],
  Cybersecurity: [
    'Security Analyst',
    'Cybersecurity Engineer',
    'Information Security Analyst',
  ],
  Design: [
    'UI Designer',
    'UX Designer',
    'Product Designer',
  ],
} as const;

export type ApplicationCategory = keyof typeof APPLICATION_CATEGORY_MAP;

export type AdminApplicationRecord = {
  id: string;
  companyName: string;
  category: ApplicationCategory;
  subcategory: string;
  jobTitle: string;
  jobDescription: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  studentName: string;
  createdAt: number;
};

const STORAGE_KEY = 'careerorbit_admin_applications_v1';

export function loadAdminApplications(): AdminApplicationRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(Boolean) as AdminApplicationRecord[];
  } catch {
    return [];
  }
}

export function saveAdminApplications(data: AdminApplicationRecord[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

