import { classifyRoleFromText } from '@/lib/jobs/role-utils';
import type { NormalizedJob } from '@/lib/jobs/types';

const SAMPLE_JOBS = [
  {
    title: 'Software Engineer I',
    company: 'Northstar Systems',
    location: 'Austin, TX',
    workMode: 'Hybrid',
    description: 'Build fullstack features with React, Node.js and PostgreSQL. Strong fundamentals in data structures.',
    applyUrl: 'https://example.com/jobs/northstar-se1',
  },
  {
    title: 'Data Analyst - Product',
    company: 'BrightDash',
    location: 'Remote (US)',
    workMode: 'Remote',
    description: 'Analyze product metrics using SQL, Python, and BI dashboards. Experience with Tableau is a plus.',
    applyUrl: 'https://example.com/jobs/brightdash-da',
  },
  {
    title: 'Java Developer (Spring Boot)',
    company: 'OrbitBank',
    location: 'New York, NY',
    workMode: 'Onsite',
    description: 'Develop microservices in Java and Spring Boot with Kafka-based integrations and cloud deployment.',
    applyUrl: 'https://example.com/jobs/orbitbank-java',
  },
  {
    title: 'AI/ML Engineer',
    company: 'VisionForge AI',
    location: 'San Jose, CA',
    workMode: 'Hybrid',
    description: 'Build ML pipelines using Python, PyTorch and model evaluation workflows for NLP systems.',
    applyUrl: 'https://example.com/jobs/visionforge-aiml',
  },
];

export async function fetchMockJobsSnapshot(): Promise<NormalizedJob[]> {
  const now = Date.now();

  return SAMPLE_JOBS.map((job, index) => {
    const externalId = `mock-${index + 1}-${Math.floor(now / 300000)}`;
    return {
      source: 'mock-job-scout',
      externalId,
      title: job.title,
      company: job.company,
      location: job.location,
      workMode: job.workMode,
      description: job.description,
      applyUrl: job.applyUrl,
      postedAt: new Date(now - index * 60 * 60 * 1000),
      roleCategory: classifyRoleFromText(job.title, job.description),
    };
  });
}
