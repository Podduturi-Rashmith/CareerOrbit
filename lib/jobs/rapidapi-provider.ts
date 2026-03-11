import { classifyRoleFromText } from '@/lib/jobs/role-utils';
import type { NormalizedJob } from '@/lib/jobs/types';

const RAPIDAPI_BASE_URL = process.env.RAPIDAPI_BASE_URL || 'https://real-time-glassdoor-data.p.rapidapi.com';
const RAPIDAPI_JOB_SEARCH_PATH = process.env.RAPIDAPI_JOB_SEARCH_PATH || '/job-search';

const ROLE_QUERIES = [
  'Software Engineer',
  'Data Analyst',
  'Machine Learning Engineer',
  'Fullstack Developer',
  'Python Developer',
  'Java Developer',
] as const;

const JOBS_PER_ROLE = 50;

function getRapidApiHeaders() {
  const apiKey = process.env.RAPIDAPI_KEY;
  const apiHost = process.env.RAPIDAPI_HOST;
  if (!apiKey || !apiHost) {
    return null;
  }
  return {
    'x-rapidapi-key': apiKey,
    'x-rapidapi-host': apiHost,
  };
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function extractJobsPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const obj = payload as Record<string, unknown>;
  const candidates = [
    toArray(obj.jobs),
    toArray(obj.results),
    toArray(obj.data),
    toArray((obj.data as Record<string, unknown> | undefined)?.jobs),
    toArray((obj.response as Record<string, unknown> | undefined)?.jobs),
  ];
  return candidates.find((list) => list.length > 0) || [];
}

function normalizeJob(raw: unknown, roleQuery: string, idx: number): NormalizedJob | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const title = asString(item.title || item.job_title || item.position || roleQuery);
  const description = asString(item.description || item.job_description || item.summary);
  const company = asString(item.company || item.company_name || item.employer || 'Unknown Company');
  const location = asString(item.location || item.city || item.job_location) || undefined;
  const workMode = asString(item.work_mode || item.workMode || item.remote || item.location_type) || undefined;
  const applyUrl = asString(item.apply_url || item.applyUrl || item.url || item.job_url || item.link);
  const externalId = asString(item.id || item.job_id || item.uuid || `${roleQuery}-${idx}-${Date.now()}`);
  const postedAtRaw = asString(item.posted_at || item.date || item.created_at || item.published_at);
  const employmentType = asString(item.employment_type || item.job_type || item.type).toLowerCase();

  const isFullTime =
    !employmentType ||
    employmentType.includes('full') ||
    employmentType.includes('permanent') ||
    employmentType.includes('fte');

  if (!title || !company || !applyUrl || !isFullTime) {
    return null;
  }

  return {
    source: 'rapidapi-glassdoor',
    externalId,
    title,
    company,
    location,
    workMode,
    description: description || `${title} role at ${company}`,
    applyUrl,
    postedAt: postedAtRaw ? new Date(postedAtRaw) : new Date(),
    roleCategory: classifyRoleFromText(title, description || roleQuery),
  };
}

async function fetchJobsForRole(roleQuery: string, headers: Record<string, string>): Promise<NormalizedJob[]> {
  const params = new URLSearchParams({
    query: roleQuery,
    job_title: roleQuery,
    employment_type: 'full_time',
    page: '1',
    limit: String(JOBS_PER_ROLE),
  });

  const response = await fetch(`${RAPIDAPI_BASE_URL}${RAPIDAPI_JOB_SEARCH_PATH}?${params.toString()}`, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`RapidAPI failed for ${roleQuery} (${response.status})`);
  }

  const payload = await response.json();
  const rows = extractJobsPayload(payload);

  return rows
    .map((row, index) => normalizeJob(row, roleQuery, index))
    .filter((job): job is NormalizedJob => Boolean(job))
    .slice(0, JOBS_PER_ROLE);
}

export async function fetchRapidApiJobsSnapshot() {
  const headers = getRapidApiHeaders();
  if (!headers) {
    return { jobs: [], enabled: false as const };
  }

  const chunks = await Promise.all(ROLE_QUERIES.map((role) => fetchJobsForRole(role, headers)));
  return {
    enabled: true as const,
    jobs: chunks.flat(),
    roleStats: ROLE_QUERIES.map((role, index) => ({ role, count: chunks[index].length })),
    targetPerRole: JOBS_PER_ROLE,
  };
}
