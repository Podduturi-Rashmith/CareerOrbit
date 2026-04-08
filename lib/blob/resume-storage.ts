import { put, list, del } from '@vercel/blob';

/**
 * Blob path structure:
 *   resumes/{studentEmail}/{companyName}--{jobTitle}/{filename}.docx
 *
 * This gives us a virtual folder tree:
 *   Student → Job → File
 */

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function buildBlobPath(
  studentEmail: string,
  companyName: string,
  jobTitle: string,
  filename: string
): string {
  const emailSlug = slugify(studentEmail);
  const folderSlug = `${slugify(companyName)}--${slugify(jobTitle)}`;
  return `resumes/${emailSlug}/${folderSlug}/${filename}`;
}

export async function uploadResume(
  studentEmail: string,
  companyName: string,
  jobTitle: string,
  filename: string,
  data: Buffer
): Promise<string> {
  const path = buildBlobPath(studentEmail, companyName, jobTitle, filename);
  const blob = await put(path, data, {
    access: 'public',
    contentType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    addRandomSuffix: false,
  });
  return blob.url;
}

export type ResumeBlob = {
  url: string;
  pathname: string;
  filename: string;
  studentEmail: string;
  jobFolder: string;    // e.g. "stripe--software-engineer"
  companyName: string;
  jobTitle: string;
  uploadedAt: Date;
  size: number;
};

function parsePathname(pathname: string): {
  studentEmail: string;
  jobFolder: string;
  companyName: string;
  jobTitle: string;
  filename: string;
} | null {
  // resumes/{emailSlug}/{companySlug}--{jobSlug}/{filename}
  const match = pathname.match(/^resumes\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (!match) return null;

  const [, emailSlug, jobFolder, filename] = match;
  const parts = jobFolder.split('--');
  const companyName = parts[0]?.replace(/-/g, ' ') ?? jobFolder;
  const jobTitle = parts.slice(1).join(' ').replace(/-/g, ' ');

  return {
    studentEmail: emailSlug.replace(/-/g, '.'), // best-effort reverse
    jobFolder,
    companyName,
    jobTitle,
    filename,
  };
}

export async function listAllResumes(): Promise<ResumeBlob[]> {
  const result = await list({ prefix: 'resumes/', mode: 'expanded' });
  return result.blobs
    .map((blob) => {
      const parsed = parsePathname(blob.pathname);
      if (!parsed) return null;
      return {
        url: blob.url,
        pathname: blob.pathname,
        filename: parsed.filename,
        studentEmail: parsed.studentEmail,
        jobFolder: parsed.jobFolder,
        companyName: parsed.companyName,
        jobTitle: parsed.jobTitle,
        uploadedAt: new Date(blob.uploadedAt),
        size: blob.size,
      } satisfies ResumeBlob;
    })
    .filter((b): b is ResumeBlob => b !== null);
}

export async function listResumesByStudent(
  emailSlug: string
): Promise<ResumeBlob[]> {
  const result = await list({
    prefix: `resumes/${emailSlug}/`,
    mode: 'expanded',
  });
  return result.blobs
    .map((blob) => {
      const parsed = parsePathname(blob.pathname);
      if (!parsed) return null;
      return {
        url: blob.url,
        pathname: blob.pathname,
        filename: parsed.filename,
        studentEmail: parsed.studentEmail,
        jobFolder: parsed.jobFolder,
        companyName: parsed.companyName,
        jobTitle: parsed.jobTitle,
        uploadedAt: new Date(blob.uploadedAt),
        size: blob.size,
      } satisfies ResumeBlob;
    })
    .filter((b): b is ResumeBlob => b !== null);
}

export async function deleteResume(url: string): Promise<void> {
  await del(url);
}
