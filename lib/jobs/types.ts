export type JobRoleCategory = 'software-engineer' | 'data-analyst' | 'aiml' | 'java-developer' | 'other';

export interface NormalizedJob {
  source: string;
  externalId: string;
  title: string;
  company: string;
  location?: string;
  workMode?: string;
  description: string;
  applyUrl: string;
  postedAt: Date;
  roleCategory: JobRoleCategory;
}

export interface StudentCandidate {
  name: string;
  email: string;
  major: string;
  graduationYear: string;
  fitScore: number;
  fitReason: string;
}
