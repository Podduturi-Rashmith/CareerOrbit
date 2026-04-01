import { NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { getTailoredResumeDraftById } from '@/lib/admin/tailored-resume-store';
import { jsonError, serverErrorResponse } from '@/lib/server/http';

export const runtime = 'nodejs';
const RESUME_FONT = 'Garamond';
const RESUME_TEXT_SIZE = 22;
const RESUME_TEXT_COLOR = '000000';

function toParagraphs(content: string): Paragraph[] {
  const lines = content.split('\n');
  const paragraphs: Paragraph[] = [];
  let currentSection = '';
  let firstNonEmptySeen = false;
  const headingMap: Record<string, string> = {
    SUMMARY: 'PROFESSIONAL SUMMARY',
    PROFESSIONALSUMMARY: 'PROFESSIONAL SUMMARY',
    EXPERIENCE: 'PROFESSIONAL EXPERIENCE',
    PROFESSIONALEXPERIENCE: 'PROFESSIONAL EXPERIENCE',
    TECHNICALSKILLS: 'TECHNICAL SKILLS',
    SKILLS: 'TECHNICAL SKILLS',
    EDUCATION: 'EDUCATION',
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: '',
              font: RESUME_FONT,
              size: RESUME_TEXT_SIZE,
              color: RESUME_TEXT_COLOR,
            }),
          ],
        })
      );
      continue;
    }

    const isBullet = line.startsWith('- ');
    const text = isBullet ? line.slice(2).trim() : line;
    const headingKey = text.replace(/[^A-Za-z]/g, '').toUpperCase();
    const normalizedHeading = headingMap[headingKey] || '';
    const isHeading = !isBullet && !!normalizedHeading;
    if (isHeading) currentSection = normalizedHeading;
    const inExperienceSection =
      currentSection === 'PROFESSIONAL EXPERIENCE' || currentSection === 'EXPERIENCE';
    const inSummarySection =
      currentSection === 'PROFESSIONAL SUMMARY' || currentSection === 'SUMMARY';
    const inSkillsSection =
      currentSection === 'TECHNICAL SKILLS' || currentSection === 'SKILLS';
    const hasSentencePunctuation = /[.!?]$/.test(text);
    const hasActionVerb =
      /\b(designed|developed|built|implemented|managed|optimized|collaborated|supported|created|improved|integrated|troubleshot|engineered|led|delivered|deployed|analyzed)\b/i.test(
        text
      );
    const looksLikeDateRange =
      /\b(19|20)\d{2}\b/.test(text) &&
      (/\b(Present|Current)\b/i.test(text) || /[-–]/.test(text));
    const looksLikeCompanyLocationLine =
      !isHeading &&
      !isBullet &&
      text.length < 80 &&
      /^[A-Za-z .'-]+,\s*[A-Za-z .'-]+$/.test(text);
    const looksLikeRoleLine =
      !isHeading &&
      !isBullet &&
      text.length < 60 &&
      /engineer|developer|analyst|manager|intern|scientist/i.test(text) &&
      !hasSentencePunctuation;
    const isExperienceMetaLine =
      inExperienceSection &&
      (looksLikeDateRange || looksLikeCompanyLocationLine || (looksLikeRoleLine && !hasActionVerb));

    if (!firstNonEmptySeen) {
      firstNonEmptySeen = true;
      paragraphs.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text,
              font: RESUME_FONT,
              size: RESUME_TEXT_SIZE,
              color: RESUME_TEXT_COLOR,
              bold: true,
            }),
          ],
        })
      );
      continue;
    }

    const shouldBulletizeSummary = !isHeading && !isBullet && inSummarySection;
    const shouldBulletizeSkills = !isHeading && !isBullet && inSkillsSection;
    const shouldBulletizeExperience =
      inExperienceSection && !isHeading && !isBullet && !isExperienceMetaLine;
    const outputText = isHeading ? normalizedHeading : text;

    paragraphs.push(
      new Paragraph({
        ...((isBullet || shouldBulletizeSummary || shouldBulletizeSkills || shouldBulletizeExperience)
          ? { bullet: { level: 0 } }
          : {}),
        keepLines: isHeading || isExperienceMetaLine,
        keepNext: isHeading || isExperienceMetaLine,
        spacing: isHeading ? { before: 180, after: 80, line: 240 } : { after: 70, line: 240 },
        children: [
          new TextRun({
            text: outputText,
            font: RESUME_FONT,
            size: RESUME_TEXT_SIZE,
            color: RESUME_TEXT_COLOR,
            bold: isHeading,
          }),
        ],
      })
    );
  }

  return paragraphs;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; draftId: string }> }
) {
  try {
    const { id: jobId, draftId } = await context.params;
    const draft = await getTailoredResumeDraftById(draftId);
    if (!draft) {
      return jsonError('Draft not found', 404);
    }
    if (draft.jobId !== jobId) {
      return jsonError('Draft not found for this job.', 404);
    }

    const filenameBase = `${draft.studentName || 'student'}-${draft.companyName || 'company'}-${draft.jobTitle || 'role'}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const filename = `${filenameBase || 'tailored-resume'}.docx`;

    const document = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: RESUME_FONT,
              size: RESUME_TEXT_SIZE,
              color: RESUME_TEXT_COLOR,
            },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1100,
                right: 3200,
                bottom: 1100,
                left: 3200,
              },
            },
          },
          children: toParagraphs(draft.content),
        },
      ],
    });
    const buffer = await Packer.toBuffer(document);
    const body = new Uint8Array(buffer);

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to generate download file.');
  }
}
