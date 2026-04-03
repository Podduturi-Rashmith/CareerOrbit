import type { JobRoleCategory } from '@/lib/jobs/types';

export function classifyRoleFromText(title: string, description: string): JobRoleCategory {
  const corpus = `${title} ${description}`.toLowerCase();

  const score: Record<JobRoleCategory, number> = {
    'software-engineer': 0,
    'data-analyst': 0,
    'java-developer': 0,
    aiml: 0,
    other: 0,
  };

  const has = (pattern: RegExp) => pattern.test(corpus);

  if (has(/\bjava\b/) || has(/spring\s?boot/) || has(/\bjvm\b/)) score['java-developer'] += 4;
  if (has(/\bjava developer\b/) || has(/\bbackend java\b/)) score['java-developer'] += 3;
  if (has(/\bmicroservices?\b/)) score['java-developer'] += 1;

  if (has(/\bai\/?ml\b/) || has(/\bmachine learning\b/) || has(/\bdeep learning\b/)) score.aiml += 4;
  if (has(/\bpytorch\b/) || has(/\btensorflow\b/) || has(/\bllm\b/) || has(/\bnlp\b/)) score.aiml += 2;

  if (has(/\bdata analyst\b/) || has(/\bbusiness analyst\b/) || has(/\bbusiness intelligence\b/)) score['data-analyst'] += 4;
  if (has(/\banalytics\b/) || has(/\bdashboard(s)?\b/) || has(/\btableau\b/) || has(/\bpower ?bi\b/)) score['data-analyst'] += 2;
  if (has(/\bsql\b/) && (has(/\bdata\b/) || has(/\banalyst\b/) || has(/\breport(ing)?\b/))) score['data-analyst'] += 1;

  if (has(/\bsoftware engineer\b/) || has(/\bfullstack\b/) || has(/\bbackend\b/) || has(/\bfrontend\b/)) score['software-engineer'] += 4;
  if (has(/\breact\b/) || has(/\bnode(\.js)?\b/) || has(/\btypescript\b/) || has(/\bapi(s)?\b/)) score['software-engineer'] += 2;
  if (has(/\bpostgresql\b/) || has(/\bmicroservice(s)?\b/)) score['software-engineer'] += 1;

  const sorted = (Object.entries(score) as Array<[JobRoleCategory, number]>).sort((a, b) => b[1] - a[1]);
  const [winner, points] = sorted[0];

  return points > 0 ? winner : 'other';
}

