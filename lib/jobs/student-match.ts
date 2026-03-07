import { MOCK_STUDENTS } from '@/lib/mock-data';
import type { Student } from '@/lib/mock-data';
import type { JobRoleCategory, StudentCandidate } from '@/lib/jobs/types';

const ROLE_HINTS: Record<JobRoleCategory, string[]> = {
  'software-engineer': ['Computer Science', 'Software', 'Engineering'],
  'data-analyst': ['Data', 'Statistics', 'Analytics', 'Mathematics'],
  'java-developer': ['Computer Science', 'Software', 'Engineering'],
  aiml: ['Computer Science', 'Data', 'AI', 'ML'],
  other: ['Computer Science', 'Data'],
};

export function findCandidatesForRole(roleCategory: JobRoleCategory): StudentCandidate[] {
  const hints = ROLE_HINTS[roleCategory] || ROLE_HINTS.other;

  return MOCK_STUDENTS.map((student) => {
    const major = student.major.toLowerCase();
    const matched = hints.filter((hint) => major.includes(hint.toLowerCase())).length;
    const fitScore = Math.min(95, 45 + matched * 20);

    return {
      name: student.name,
      email: student.email,
      major: student.major,
      graduationYear: student.graduationYear,
      fitScore,
      fitReason: matched > 0 ? `Major alignment: ${student.major}` : 'General transferable fit',
    };
  }).sort((a, b) => b.fitScore - a.fitScore);
}

export function buildTailoredResumeSummary(input: {
  studentName: string;
  roleCategory: JobRoleCategory;
  jobTitle: string;
  company: string;
  jobDescription: string;
  baseResume?: Student['baseResume'];
}) {
  const roleFocus: Record<JobRoleCategory, string> = {
    'software-engineer': 'full-stack engineering, backend APIs, and production code quality',
    'data-analyst': 'SQL analytics, dashboarding, and business insights',
    'java-developer': 'Java microservices, Spring Boot patterns, and resilient APIs',
    aiml: 'machine learning workflows, experimentation, and model deployment',
    other: 'problem solving, collaboration, and software delivery',
  };

  return [
    `${input.studentName} is being tailored for the ${input.jobTitle} role at ${input.company}.`,
    `Base resume used: ${input.baseResume?.headline || 'Standard student baseline profile'}.`,
    `Resume focus: ${roleFocus[input.roleCategory]}.`,
    input.baseResume?.summaryBullets?.[0]
      ? `Base anchor retained: ${input.baseResume.summaryBullets[0]}`
      : 'Base anchor retained: Core strengths, ownership, and measurable impact statements.',
    'Highlighted strengths: project ownership, communication, and measurable impact.',
    `JD cues incorporated: ${input.jobDescription.slice(0, 180)}${input.jobDescription.length > 180 ? '...' : ''}`,
    'Review checklist: verify years of experience claims, tech stack match, and location/work authorization details.',
  ].join('\n');
}
