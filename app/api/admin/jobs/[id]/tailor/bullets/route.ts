import { NextResponse } from 'next/server';
import { getAdminJobById } from '@/lib/admin/jobs-store';
import { extractMasterResumePlainText } from '@/lib/admin/master-resume-plain-text';
import { getStudentMasterResumeByEmail } from '@/lib/admin/master-resume-store';
import { TailorBulletsChatPayloadSchema } from '@/lib/admin/schemas';
import {
  coerceRegenerateBulletsResponse,
  parseAnthropicJsonText,
} from '@/lib/jobs/experience-bullets-regen';
import { jsonError, parseJsonObject, serverErrorResponse } from '@/lib/server/http';

export const runtime = 'nodejs';

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}\n\n[…truncated for context length…]`;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: jobId } = await context.params;
    const payload = await parseJsonObject(request);
    if (!payload) return jsonError('Invalid payload', 400);

    const parsed = TailorBulletsChatPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Invalid bullets chat payload.';
      return jsonError(message, 400);
    }

    const { studentEmail, messages, priorBullets } = parsed.data;
    const messagesClean = messages.map((m) => ({
      role: m.role,
      content: m.content.trim(),
    })).filter((m) => m.content.length > 0);

    const job = await getAdminJobById(jobId);
    if (!job) return jsonError('Job not found', 404);

    const masterResume = await getStudentMasterResumeByEmail(studentEmail);
    if (!masterResume) {
      return jsonError('No uploaded master resume found for this student.', 400);
    }

    const resumeText = await extractMasterResumePlainText({
      mimeType: masterResume.mimeType,
      fileName: masterResume.fileName,
      fileDataUrl: masterResume.fileDataUrl,
      extractedText: masterResume.extractedText,
    });
    if (!resumeText) {
      return jsonError(
        'Could not read text from master resume. Upload TXT or DOCX in Student Database.',
        400
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model =
      process.env.ANTHROPIC_MODEL?.trim() || 'claude-3-5-sonnet-20241022';
    if (!apiKey) {
      return jsonError('Missing ANTHROPIC_API_KEY.', 500);
    }

    const conversationBlock = messagesClean
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    const prompt = [
      'You help a human admin refine EXPERIENCE bullet suggestions for a resume vs a job posting.',
      'Return a single JSON object only (no markdown). Keys (snake_case):',
      'assistant_message: short reply (1-3 sentences) acknowledging the admin feedback.',
      'experience_bullets: array of 4-8 objects with source_section, target_role, text, needs_user_input (boolean).',
      'Rules:',
      '- Do not invent employers, dates, degrees, or metrics. Use only what can be grounded in the resume text.',
      '- Bullets must be ATS-friendly: strong action verbs, concrete phrasing when the resume supports it.',
      '- If the admin asks for a different angle, produce new bullets; do not repeat prior suggestions verbatim.',
      '- Set needs_user_input true if a bullet needs the admin to verify factual details.',
      '',
      'JOB',
      `Company: ${job.companyName}`,
      `Title: ${job.jobTitle}`,
      `Description:\n${truncate(job.jobDescription, 12000)}`,
      '',
      'RESUME (plain text, truncated if long)',
      truncate(resumeText, 14000),
      '',
      priorBullets && priorBullets.length > 0
        ? `PRIOR SUGGESTED BULLETS (replace with better ones per conversation):\n${JSON.stringify(priorBullets)}\n`
        : '',
      'CONVERSATION (latest user message must drive the revision)',
      conversationBlock,
    ]
      .filter(Boolean)
      .join('\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        temperature: 0.35,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = (await response.json().catch(() => null)) as
      | { content?: Array<{ type?: string; text?: string }>; error?: { message?: string } }
      | null;

    if (!response.ok) {
      const msg =
        data?.error?.message ||
        `Anthropic request failed (HTTP ${response.status}).`;
      return jsonError(msg, response.status >= 400 && response.status < 600 ? response.status : 422);
    }

    const raw = (data?.content || [])
      .filter((part) => part.type === 'text' && typeof part.text === 'string')
      .map((part) => part.text || '')
      .join('\n')
      .trim();
    if (!raw) return jsonError('Empty model response.', 422);

    const parsedJson = parseAnthropicJsonText(raw);
    const coerced = coerceRegenerateBulletsResponse(parsedJson);
    if (!coerced) {
      return jsonError(
        'Could not parse new bullet suggestions from the model. Try a shorter message or retry.',
        422
      );
    }

    return NextResponse.json({
      ok: true,
      assistantMessage: coerced.assistantMessage,
      experienceBullets: coerced.bullets.map((b) => ({
        sourceSection: b.sourceSection,
        targetRole: b.targetRole,
        text: b.text,
        needsUserInput: b.needsUserInput,
      })),
    });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to regenerate bullet suggestions.');
  }
}
