import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { getStudentMasterResumeByEmail } from '@/lib/admin/master-resume-store';
import { createTailoredResumeDraft } from '@/lib/admin/tailored-resume-store';
import { getAdminJobById } from '@/lib/admin/jobs-store';
import { jsonError, parseJsonObject, serverErrorResponse } from '@/lib/server/http';
import { TailorRequestPayloadSchema } from '@/lib/admin/schemas';
import {
  findSectionIndices,
  normalizeRewrittenLine,
  stripMarkdownAndLinks,
  type SectionRange,
} from '@/lib/jobs/tailor-text';

export const runtime = 'nodejs';

function parseDataUrl(dataUrl: string): { mimeType: string; bytes: Buffer } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1] || 'application/octet-stream';
  const bytes = Buffer.from(match[2] || '', 'base64');
  return { mimeType, bytes };
}

async function getMasterResumePlainText(input: {
  mimeType: string;
  fileName: string;
  fileDataUrl: string;
  extractedText: string;
}): Promise<string> {
  if (input.extractedText?.trim()) return input.extractedText.trim();
  const parsed = parseDataUrl(input.fileDataUrl);
  if (!parsed) return '';

  const lowerName = input.fileName.toLowerCase();
  const mime = (input.mimeType || parsed.mimeType || '').toLowerCase();
  if (mime.startsWith('text/') || lowerName.endsWith('.txt') || lowerName.endsWith('.md')) {
    return parsed.bytes.toString('utf8').trim();
  }
  if (
    mime.includes('wordprocessingml.document') ||
    lowerName.endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ buffer: parsed.bytes });
    return (result.value || '').trim();
  }
  return '';
}

async function rewriteResumeSectionsWithAnthropic(input: {
  model: string;
  apiKey: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  lines: string[];
  summaryRange: SectionRange | null;
  experienceRange: SectionRange | null;
}): Promise<
  | { rewrittenLines: string[]; failure: null }
  | {
      rewrittenLines: null;
      failure:
        | 'no_rewritable_lines'
        | 'anthropic_request_failed'
        | 'empty_response'
        | 'missing_json'
        | 'invalid_json'
        | 'shape_mismatch';
    }
> {
  const isExperienceMetaLine = (line: string) => {
    const t = line.trim();
    if (!t) return true;
    const hasSentencePunctuation = /[.!?]$/.test(t);
    const hasActionVerb =
      /\b(designed|developed|built|implemented|managed|optimized|collaborated|supported|created|improved|integrated|troubleshot|engineered|led|delivered|deployed|analyzed)\b/i.test(
        t
      );
    const looksLikeDateRange =
      /\b(19|20)\d{2}\b/.test(t) && (/\b(Present|Current)\b/i.test(t) || /[-–]/.test(t));
    const looksLikeCompanyLocationLine =
      t.length < 80 && /^[A-Za-z .'-]+,\s*[A-Za-z .'-]+$/.test(t);
    const looksLikeRoleLine =
      t.length < 60 &&
      /engineer|developer|analyst|manager|intern|scientist/i.test(t) &&
      !hasSentencePunctuation;
    return looksLikeDateRange || looksLikeCompanyLocationLine || (looksLikeRoleLine && !hasActionVerb);
  };

  const summaryIndices =
    input.summaryRange
      ? input.lines
          .slice(input.summaryRange.start + 1, input.summaryRange.end)
          .map((line, idx) => ({ line, idx: input.summaryRange!.start + 1 + idx }))
          .filter((row) => row.line.trim().length > 0)
      : [];
  const experienceBulletIndices =
    input.experienceRange
      ? input.lines
          .slice(input.experienceRange.start + 1, input.experienceRange.end)
          .map((line, idx) => ({ line, idx: input.experienceRange!.start + 1 + idx }))
          .filter((row) => {
            const trimmed = row.line.trim();
            if (!trimmed) return false;
            if (/^[A-Z][A-Z ]{2,}$/.test(trimmed)) return false;
            if (isExperienceMetaLine(trimmed)) return false;
            return true;
          })
      : [];

  if (summaryIndices.length === 0 && experienceBulletIndices.length === 0) {
    return { rewrittenLines: null, failure: 'no_rewritable_lines' };
  }

  const payload = {
    jobTitle: input.jobTitle,
    companyName: input.companyName,
    jobDescription: input.jobDescription,
    summaryLines: summaryIndices.map((row) => row.line),
    experienceBulletLines: experienceBulletIndices.map((row) => row.line),
  };

  const prompt = [
    'Rewrite resume lines to align with the target job, while preserving facts.',
    'Return strict JSON with keys: summaryLines, experienceBulletLines.',
    'Rules:',
    '- Keep same array lengths as input arrays.',
    '- Do not add or remove any line.',
    '- Keep company names, locations, and dates unchanged (do not touch non-bullet experience lines).',
    '- Keep personal information unchanged (name, email, phone, linkedin are outside these arrays).',
    '- Only improve wording for impact and relevance to job description.',
    '',
    JSON.stringify(payload),
  ].join('\n');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': input.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: input.model,
      max_tokens: 1400,
      temperature: 0.15,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = (await response.json().catch(() => null)) as
    | { content?: Array<{ type?: string; text?: string }> }
    | null;

  if (!response.ok) {
    return { rewrittenLines: null, failure: 'anthropic_request_failed' };
  }

  const raw = (data?.content || [])
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text || '')
    .join('\n')
    .trim();
  if (!raw) {
    return { rewrittenLines: null, failure: 'empty_response' };
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { rewrittenLines: null, failure: 'missing_json' };
  }
  const parsed = (() => {
    try {
      return JSON.parse(jsonMatch[0]) as {
        summaryLines?: string[];
        experienceBulletLines?: string[];
      };
    } catch {
      return null;
    }
  })();
  if (!parsed) {
    return { rewrittenLines: null, failure: 'invalid_json' };
  }

  const rewrittenSummary = Array.isArray(parsed.summaryLines) ? parsed.summaryLines : [];
  const rewrittenBullets = Array.isArray(parsed.experienceBulletLines)
    ? parsed.experienceBulletLines
    : [];
  if (rewrittenSummary.length !== summaryIndices.length) {
    return { rewrittenLines: null, failure: 'shape_mismatch' };
  }
  if (rewrittenBullets.length !== experienceBulletIndices.length) {
    return { rewrittenLines: null, failure: 'shape_mismatch' };
  }

  const out = [...input.lines];
  summaryIndices.forEach((row, idx) => {
    out[row.idx] = normalizeRewrittenLine(row.line, rewrittenSummary[idx] || row.line);
  });
  experienceBulletIndices.forEach((row, idx) => {
    out[row.idx] = normalizeRewrittenLine(row.line, rewrittenBullets[idx] || row.line);
  });
  return { rewrittenLines: out, failure: null };
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: jobId } = await context.params;
    const payload = await parseJsonObject(request);
    if (!payload) {
      return jsonError('Invalid payload', 400);
    }
    const parsed = TailorRequestPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Invalid tailor request payload.';
      return jsonError(message, 400);
    }
    const {
      studentId,
      studentName,
      studentEmail,
      companyName: payloadCompanyName,
      jobTitle: payloadJobTitle,
      jobDescription: payloadJobDescription,
      category: payloadCategory,
    } = parsed.data;
    const jobFromDb = await getAdminJobById(jobId);
    const companyName = jobFromDb?.companyName || payloadCompanyName;
    const jobTitle = jobFromDb?.jobTitle || payloadJobTitle;
    const jobDescription = jobFromDb?.jobDescription || payloadJobDescription;
    const category = jobFromDb?.category || payloadCategory;

    if (!companyName || !jobTitle || !jobDescription || !studentEmail) {
      return jsonError(
        'Missing required fields: companyName, jobTitle, jobDescription, studentEmail',
        400
      );
    }

    const masterResume = await getStudentMasterResumeByEmail(studentEmail);
    if (!masterResume) {
      return jsonError('No uploaded master resume found for selected student.', 400);
    }

    const masterResumeText = await getMasterResumePlainText({
      mimeType: masterResume.mimeType,
      fileName: masterResume.fileName,
      fileDataUrl: masterResume.fileDataUrl,
      extractedText: masterResume.extractedText,
    });
    if (!masterResumeText) {
      return jsonError(
        'Could not read text from master resume file. Upload a TXT or DOCX resume in Student Database.',
        400
      );
    }

    const baseLines = stripMarkdownAndLinks(masterResumeText).split('\n');
    const summaryRange = findSectionIndices(baseLines, 'SUMMARY');
    const experienceRange = findSectionIndices(baseLines, 'EXPERIENCE');
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
    if (!apiKey) {
      return jsonError(
        'Missing ANTHROPIC_API_KEY. Configure it before generating resumes.',
        500
      );
    }
    if (!summaryRange && !experienceRange) {
      return jsonError(
        'Could not detect SUMMARY/EXPERIENCE sections in the master resume. Please upload a structured resume with those headings.',
        400
      );
    }

    const rewriteResult = await rewriteResumeSectionsWithAnthropic({
      model,
      apiKey,
      jobTitle,
      companyName,
      jobDescription,
      lines: baseLines,
      summaryRange,
      experienceRange,
    });
    if (!rewriteResult.rewrittenLines?.join('\n').trim()) {
      const failureMessage = {
        no_rewritable_lines:
          'No rewritable summary/experience lines found in the master resume.',
        anthropic_request_failed:
          'Resume rewrite request to Anthropic failed. Please retry.',
        empty_response:
          'Anthropic returned an empty rewrite response.',
        missing_json:
          'Anthropic response did not include the required JSON payload.',
        invalid_json:
          'Anthropic returned malformed JSON for resume rewrite.',
        shape_mismatch:
          'Anthropic rewrite output did not match the expected line structure.',
      } as const;
      const failureKey = rewriteResult.failure || 'shape_mismatch';
      return jsonError(
        `${failureMessage[failureKey]} No full-resume fallback is used.`,
        422
      );
    }

    const content = rewriteResult.rewrittenLines.join('\n');

    const draft = await createTailoredResumeDraft({
      jobId,
      jobTitle,
      companyName,
      jobDescription,
      category,
      studentId,
      studentName,
      studentEmail,
      masterResumeFileName: masterResume.fileName,
      content,
    });

    return NextResponse.json({
      ok: true,
      draft: {
        id: draft.id,
        createdAt: draft.createdAt,
        studentName: draft.studentName,
        companyName: draft.companyName,
        jobTitle: draft.jobTitle,
        downloadUrl: `/api/admin/jobs/${jobId}/tailor/${draft.id}/download`,
      },
    });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to generate tailored resume.');
  }
}
