import { type ApplicationCategory } from '@/lib/admin/applications-store';
type StudentRecord = {
  major: string;
  baseResume?: {
    headline?: string;
    technicalSkills?: Record<string, string[]>;
  };
};

const CATEGORY_PATTERNS: Array<{ category: ApplicationCategory; pattern: RegExp }> = [
  {
    category: 'Cybersecurity',
    pattern: /\b(cyber|security|cybersecurity|siem|soc|pentest|vulnerability)\b/,
  },
  { category: 'Design', pattern: /\b(ui|ux|design|figma|prototype|product designer|interaction)\b/ },
  { category: 'QA/Testing', pattern: /\b(qa|testing|test automation|manual tester|sdet|software test)\b/ },
  {
    category: 'Cloud/DevOps',
    pattern: /\b(cloud|devops|aws|gcp|azure|kubernetes|docker|platform engineer|sre)\b/,
  },
  {
    category: 'Business/Product',
    pattern: /\b(product manager|project manager|program manager|operations analyst|business operations)\b/,
  },
  { category: 'AI/Machine Learning', pattern: /\b(ai|ml|machine learning|nlp|computer vision|deep learning)\b/ },
  {
    category: 'Data Roles',
    pattern: /\b(data analyst|data scientist|data engineer|analytics|bi|business intelligence|sql)\b/,
  },
];

export function classifyStudentRole(student: StudentRecord): ApplicationCategory {
  const technicalSkills = Object.entries(student.baseResume?.technicalSkills || {})
    .map(([group, values]) => `${group} ${(values || []).join(' ')}`)
    .join(' ')
    .toLowerCase();

  const corpus = `${student.major} ${student.baseResume?.headline || ''} ${technicalSkills}`.toLowerCase();
  const matchedCategory = CATEGORY_PATTERNS.find(({ pattern }) => pattern.test(corpus));
  return matchedCategory?.category || 'Software Engineering';
}
