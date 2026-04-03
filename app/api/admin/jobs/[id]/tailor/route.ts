import { NextResponse } from 'next/server';
import { extractMasterResumePlainText } from '@/lib/admin/master-resume-plain-text';
import { getStudentMasterResumeByEmail } from '@/lib/admin/master-resume-store';
import { createTailoredResumeDraft } from '@/lib/admin/tailored-resume-store';
import { getAdminJobById } from '@/lib/admin/jobs-store';
import { jsonError, parseJsonObject, serverErrorResponse } from '@/lib/server/http';
import { TailorRequestPayloadSchema } from '@/lib/admin/schemas';

export const runtime = 'nodejs';

type ResumeAnalysis = {
  match_score: number;
  missing_skills: string[];
  suggested_skills: string[];
  professional_summary: string;
  experience_bullets: Array<{
    source_section: string;
    target_role: string;
    text: string;
    needs_user_input: boolean;
  }>;
  project_suggestions: Array<{
    title: string;
    description: string;
    keywords: string[];
  }>;
  ats_keywords_used: string[];
  notes: string[];
};

function stripMarkdownCodeFence(text: string): string {
  let t = text.trim();
  const fenced = /^```(?:json)?\s*\n?([\s\S]*?)```/im.exec(t);
  if (fenced?.[1]) t = fenced[1].trim();
  return t;
}

/** Extract a single JSON object from model text (handles prose before/after and ```json fences). */
function extractBalancedJsonObject(text: string): string | null {
  const stripped = stripMarkdownCodeFence(text);
  const start = stripped.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < stripped.length; i++) {
    const c = stripped[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (c === '\\') escape = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === '{') depth += 1;
    else if (c === '}') {
      depth -= 1;
      if (depth === 0) return stripped.slice(start, i + 1);
    }
  }
  return null;
}

function parseModelJsonOutput(raw: string): unknown | null {
  const candidate = extractBalancedJsonObject(raw);
  if (!candidate) return null;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function unwrapAnalysisPayload(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const nested =
    (typeof o.analysis === 'object' && o.analysis && (o.analysis as object)) ||
    (typeof o.result === 'object' && o.result && (o.result as object)) ||
    (typeof o.data === 'object' && o.data && (o.data as object)) ||
    null;
  return (nested as Record<string, unknown>) || o;
}

function pickFiniteNumber(...vals: unknown[]): number | null {
  for (const v of vals) {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim()) {
      const n = Number(v.trim());
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function asStringArrayLoose(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object' && 'skill' in (item as object)) {
        const s = (item as { skill?: unknown }).skill;
        return typeof s === 'string' ? s.trim() : '';
      }
      if (item && typeof item === 'object' && 'name' in (item as object)) {
        const s = (item as { name?: unknown }).name;
        return typeof s === 'string' ? s.trim() : '';
      }
      return '';
    })
    .filter(Boolean);
}

function truthyFlag(v: unknown): boolean {
  return v === true || v === 'true' || v === 1 || v === '1';
}

type TailorApiAnalysis = {
  matchScore: number;
  missingSkills: string[];
  suggestedSkills: string[];
  professionalSummary: string;
  experienceBullets: Array<{
    sourceSection: string;
    targetRole: string;
    text: string;
    needsUserInput: boolean;
  }>;
  projectSuggestions: Array<{
    title: string;
    description: string;
    keywords: string[];
  }>;
  atsKeywordsUsed: string[];
  notes: string[];
};

function coerceAnalysis(raw: unknown): ResumeAnalysis | null {
  const value = unwrapAnalysisPayload(raw);
  if (!value) return null;

  const missing = asStringArrayLoose(value.missing_skills ?? value.missingSkills ?? value.gaps);
  const suggested = asStringArrayLoose(value.suggested_skills ?? value.suggestedSkills ?? value.recommendedSkills);
  const ats = asStringArrayLoose(value.ats_keywords_used ?? value.atsKeywordsUsed ?? value.keywordsMatched);
  const notes = asStringArrayLoose(value.notes ?? value.scannerNotes);

  const expRaw =
    value.experience_bullets ??
    value.experienceBullets ??
    value.experience ??
    value.tailoredBullets ??
    value.bullets;

  const experience = Array.isArray(expRaw)
    ? expRaw
        .map((item) => {
          if (typeof item === 'string') {
            const text = item.trim();
            if (!text) return null;
            return {
              source_section: 'experience',
              target_role: '',
              text,
              needs_user_input: false,
            };
          }
          const row = item as Record<string, unknown>;
          const text =
            (typeof row.text === 'string' && row.text.trim()) ||
            (typeof row.bullet === 'string' && row.bullet.trim()) ||
            (typeof row.content === 'string' && row.content.trim()) ||
            '';
          if (!text) return null;
          const sourceSection =
            (typeof row.source_section === 'string' && row.source_section.trim()) ||
            (typeof row.sourceSection === 'string' && row.sourceSection.trim()) ||
            'experience';
          const targetRole =
            (typeof row.target_role === 'string' && row.target_role.trim()) ||
            (typeof row.targetRole === 'string' && row.targetRole.trim()) ||
            '';
          return {
            source_section: sourceSection,
            target_role: targetRole,
            text,
            needs_user_input:
              truthyFlag(row.needs_user_input) || truthyFlag(row.needsUserInput ?? row.verify),
          };
        })
        .filter((row): row is NonNullable<typeof row> => !!row)
    : [];

  const projRaw = value.project_suggestions ?? value.projectSuggestions ?? value.projects;
  const projects = Array.isArray(projRaw)
    ? projRaw
        .map((item) => {
          const row = item as Record<string, unknown>;
          const title =
            (typeof row.title === 'string' && row.title.trim()) ||
            (typeof row.name === 'string' && row.name.trim()) ||
            '';
          const description =
            (typeof row.description === 'string' && row.description.trim()) ||
            (typeof row.summary === 'string' && row.summary.trim()) ||
            '';
          if (!title || !description) return null;
          return {
            title,
            description,
            keywords: asStringArrayLoose(row.keywords),
          };
        })
        .filter((row): row is NonNullable<typeof row> => !!row)
    : [];

  let summary =
    (typeof value.professional_summary === 'string' && value.professional_summary.trim()) ||
    (typeof value.professionalSummary === 'string' && value.professionalSummary.trim()) ||
    (typeof value.summary === 'string' && value.summary.trim()) ||
    '';

  if (!summary && (experience.length > 0 || missing.length > 0 || suggested.length > 0)) {
    summary =
      'Results-driven candidate targeting this role; refine this summary using the suggested bullets and keywords below.';
  }

  let matchScore = pickFiniteNumber(value.match_score, value.matchScore, value.match, value.score);
  if (matchScore === null) {
    if (summary || experience.length > 0) matchScore = 55;
    else return null;
  }

  if (!summary) return null;

  return {
    match_score: Math.max(0, Math.min(100, Math.round(matchScore))),
    missing_skills: missing,
    suggested_skills: suggested,
    professional_summary: summary,
    experience_bullets: experience,
    project_suggestions: projects,
    ats_keywords_used: ats,
    notes,
  };
}

type AnthropicAnalyzeResult =
  | { ok: true; analysis: ResumeAnalysis }
  | { ok: false; message: string; httpStatus?: number };

async function analyzeResumeWithAnthropic(input: {
  model: string;
  apiKey: string;
  studentName: string;
  studentEmail: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  masterResumeText: string;
}): Promise<AnthropicAnalyzeResult> {
  const payload = {
    studentName: input.studentName,
    studentEmail: input.studentEmail,
    jobTitle: input.jobTitle,
    companyName: input.companyName,
    jobDescription: input.jobDescription,
    resumeText: input.masterResumeText,
    outputSchema: {
      match_score: 'number(0..100)',
      missing_skills: 'string[]',
      suggested_skills: 'string[]',
      professional_summary: 'string',
      experience_bullets:
        'Array<{source_section:string,target_role:string,text:string,needs_user_input:boolean}>',
      project_suggestions: 'Array<{title:string,description:string,keywords:string[]}>',
      ats_keywords_used: 'string[]',
      notes: 'string[]',
    },
  };

  const prompt = [
    'You are an AI-powered resume optimization engine.',
    'Analyze the resume against the job description.',
    'Do not rewrite or output the full resume — only return the JSON fields below (no tailored_resume, no full text).',
    'Respond with exactly one JSON object and nothing else (no markdown fences, no explanation).',
    'Use these snake_case keys:',
    'match_score (number 0-100), missing_skills (string[]), suggested_skills (string[]),',
    'professional_summary (string, non-empty),',
    'experience_bullets (array of { source_section, target_role, text, needs_user_input }),',
    'project_suggestions (array of { title, description, keywords }),',
    'ats_keywords_used (string[]), notes (string[]).',
    'Rules:',
    '- Never invent companies, technologies, metrics, dates, or roles.',
    '- Keep recommendations realistic for an entry-level profile if unclear.',
    '- ATS-style content: professional_summary should be 3–4 short lines max, tailored with truthful JD keywords;',
    '  experience_bullets start with strong action verbs and include measurable outcomes where the resume supports them;',
    '  suggested_skills may imply Technical vs Soft groupings when appropriate; project_suggestions emphasize tech + impact for students.',
    '- Use concise, ATS-friendly wording; avoid tables, columns, or graphics in your text suggestions.',
    '- Avoid generic phrases like hardworking or team player.',
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
      max_tokens: 4096,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = (await response.json().catch(() => null)) as
    | {
        content?: Array<{ type?: string; text?: string }>;
        error?: { message?: string; type?: string };
      }
    | null;

  if (!response.ok) {
    const msg =
      data?.error?.message ||
      `Anthropic API request failed (HTTP ${response.status}). Check ANTHROPIC_API_KEY and ANTHROPIC_MODEL.`;
    return { ok: false, message: msg, httpStatus: response.status };
  }

  const raw = (data?.content || [])
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text || '')
    .join('\n')
    .trim();
  if (!raw) {
    return {
      ok: false,
      message: 'Anthropic returned an empty response. Try again or verify your model name.',
    };
  }

  const parsedJson = parseModelJsonOutput(raw);
  if (!parsedJson) {
    return {
      ok: false,
      message:
        'Could not parse JSON from the model. It may have been truncated or wrapped differently — try a shorter job description or increase max tokens.',
    };
  }
  const analysis = coerceAnalysis(parsedJson);
  if (!analysis) {
    return {
      ok: false,
      message:
        'Resume scan output was incomplete. The model must return match_score and professional_summary (or bullets). Try again.',
    };
  }
  return { ok: true, analysis };
}

function toTailorApiAnalysis(analysis: ResumeAnalysis): TailorApiAnalysis {
  return {
    matchScore: analysis.match_score,
    missingSkills: analysis.missing_skills,
    suggestedSkills: analysis.suggested_skills,
    professionalSummary: analysis.professional_summary,
    experienceBullets: analysis.experience_bullets.map((row) => ({
      sourceSection: row.source_section,
      targetRole: row.target_role,
      text: row.text,
      needsUserInput: row.needs_user_input,
    })),
    projectSuggestions: analysis.project_suggestions,
    atsKeywordsUsed: analysis.ats_keywords_used,
    notes: analysis.notes,
  };
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

    const masterResumeText = await extractMasterResumePlainText({
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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model =
      process.env.ANTHROPIC_MODEL?.trim() || 'claude-3-5-sonnet-20241022';
    if (!apiKey) {
      return jsonError(
        'Missing ANTHROPIC_API_KEY. Configure it before generating resumes.',
        500
      );
    }
    const anthropicResult = await analyzeResumeWithAnthropic({
      model,
      apiKey,
      studentName,
      studentEmail,
      jobTitle,
      companyName,
      jobDescription,
      masterResumeText,
    });
    if (!anthropicResult.ok) {
      const status =
        anthropicResult.httpStatus &&
        anthropicResult.httpStatus >= 400 &&
        anthropicResult.httpStatus < 600
          ? anthropicResult.httpStatus
          : 422;
      return jsonError(anthropicResult.message, status);
    }
    const analysis = anthropicResult.analysis;

    /** Draft starts as the master resume text; suggestions are analysis-only — admins edit here directly. */
    const content = masterResumeText.trim();

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
        content: draft.content,
        downloadUrl: `/api/admin/jobs/${jobId}/tailor/${draft.id}/download`,
      },
      analysis: toTailorApiAnalysis(analysis),
    });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to generate tailored resume.');
  }
}
