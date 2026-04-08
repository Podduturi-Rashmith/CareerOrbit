import { NextResponse } from 'next/server';
import {
  AlignmentType,
  Document,
  LineRuleType,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import { getTailoredResumeDraftById } from '@/lib/admin/tailored-resume-store';
import { draftContentToPlainTextForDocx } from '@/lib/jobs/draft-html';
import { jsonError, serverErrorResponse } from '@/lib/server/http';
import { uploadResume } from '@/lib/blob/resume-storage';
import { getMongoDb } from '@/lib/db/mongodb';

export const runtime = 'nodejs';

/** ATS-oriented export: Garamond 11pt, black, left-aligned, simple body (no tables/shapes). */
const RESUME_FONT = 'Garamond';
/** docx `size` is half-points → 11pt */
const RESUME_TEXT_SIZE = 22;
const RESUME_TEXT_COLOR = '000000';
/** Line spacing 1.2–1.5: AUTO rule uses line/240 as multiplier → 300 ≈ 1.236 */
const ATS_LINE_SPACING = 300;
const ATS_LINE_RULE = LineRuleType.AUTO;
/** ~0.75" margins (1440 twips = 1"). Range 0.5–1" per ATS guidance. */
const ATS_MARGIN_TWIP = 1080;

function atsParagraphSpacing(isHeading: boolean) {
  if (isHeading) {
    return { before: 160, after: 72, line: ATS_LINE_SPACING, lineRule: ATS_LINE_RULE };
  }
  /** Minimal space-after so the doc doesn’t look “double-spaced” between lines. */
  return { after: 0, line: ATS_LINE_SPACING, lineRule: ATS_LINE_RULE };
}

/** Achievement-style bullets typically start with a strong verb (not “Responsible for…”). */
function startsWithExperienceActionVerb(text: string): boolean {
  return /^(?:designed|developed|built|implemented|managed|led|created|improved|delivered|deployed|collaborated|supported|analyzed|optimized|integrated|engineered|established|executed|accelerated|streamlined|coordinated|reduced|increased|decreased|expanded|automated|spearheaded|drove|owned|maintained|enhanced|architected|refactored|migrated|trained|mentored|presented|researched|tested|documented|resolved|fixed|scaled|oversaw|directed|facilitated|planned|supervised|conducted|operated|programmed|shipped|launched|completed|secured|achieved|saved|generated|responsible)\b/i.test(
    text.trim()
  );
}

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
    COMPANYEXPERIENCE: 'PROFESSIONAL EXPERIENCE',
    WORKEXPERIENCE: 'PROFESSIONAL EXPERIENCE',
    TECHNICALSKILLS: 'TECHNICAL SKILLS',
    SKILLS: 'TECHNICAL SKILLS',
    SOFTSKILLS: 'SOFT SKILLS',
    PROJECTS: 'PROJECTS',
    EDUCATION: 'EDUCATION',
    CERTIFICATIONS: 'CERTIFICATIONS',
    CERTIFICATION: 'CERTIFICATIONS',
    ACHIEVEMENTS: 'ACHIEVEMENTS',
    VOLUNTEER: 'VOLUNTEER EXPERIENCE',
    VOLUNTEERWORK: 'VOLUNTEER EXPERIENCE',
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { after: 12, line: ATS_LINE_SPACING, lineRule: ATS_LINE_RULE },
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
    const inExperienceSection = currentSection === 'PROFESSIONAL EXPERIENCE';
    const inSummarySection =
      currentSection === 'PROFESSIONAL SUMMARY' || currentSection === 'SUMMARY';
    const inSkillsSection =
      currentSection === 'TECHNICAL SKILLS' ||
      currentSection === 'SKILLS' ||
      currentSection === 'SOFT SKILLS';
    const hasSentencePunctuation = /[.!?]$/.test(text);
    const hasActionVerb =
      /\b(designed|developed|built|implemented|managed|optimized|collaborated|supported|created|improved|integrated|troubleshot|engineered|led|delivered|deployed|analyzed)\b/i.test(
        text
      );
    const looksLikeDateRange =
      /\b(19|20)\d{2}\b/.test(text) &&
      (/\b(Present|Current|Now)\b/i.test(text) || /[-–—]/.test(text));
    const looksLikeCompanyLocationLine =
      !isHeading &&
      text.length < 80 &&
      /^[A-Za-z .'&/-]+,\s*[A-Za-z .'&/-]+$/.test(text);
    const looksLikeRoleLine =
      !isHeading &&
      text.length < 72 &&
      /engineer|developer|analyst|manager|intern|scientist|consultant|specialist|architect|lead|designer|associate|director|officer|coordinator|assistant|representative/i.test(
        text
      ) &&
      !hasSentencePunctuation;
    /** Title | Company / Company — Role patterns are headers, not bullets. */
    const looksLikeTitleCompanyPipe =
      !isHeading && /\s\|\s/.test(text) && text.length < 120;
    const looksLikeCompanyEmDash =
      !isHeading && /^[A-Za-z0-9 &.'-]{2,50}\s*[—–-]\s*.+/u.test(text) && text.length < 120;
    /** Job/company/header rows are usually compact; long lines are more likely real bullets. */
    const isShortNonAchievementLine =
      inExperienceSection &&
      text.length <= 72 &&
      !startsWithExperienceActionVerb(text) &&
      !/^\d/.test(text.trim());
    const isExperienceMetaLine =
      inExperienceSection &&
      (looksLikeDateRange ||
        looksLikeCompanyLocationLine ||
        (looksLikeRoleLine && !hasActionVerb) ||
        looksLikeTitleCompanyPipe ||
        looksLikeCompanyEmDash ||
        isShortNonAchievementLine);

    if (!firstNonEmptySeen) {
      firstNonEmptySeen = true;
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { after: 120, line: ATS_LINE_SPACING, lineRule: ATS_LINE_RULE },
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
    /** Experience: only bullet explicit list lines or clear achievement lines (not company/title blocks). */
    const shouldBulletizeExperience =
      inExperienceSection &&
      !isHeading &&
      !isExperienceMetaLine &&
      (isBullet ||
        startsWithExperienceActionVerb(text) ||
        (text.length >= 56 && hasActionVerb) ||
        /^\d/.test(text.trim()));
    const stripListMarkerForPlainExperience =
      inExperienceSection && isBullet && isExperienceMetaLine;
    const outputText = isHeading ? normalizedHeading : text;

    const spacing = atsParagraphSpacing(isHeading);
    const useBullet =
      (isBullet && !stripListMarkerForPlainExperience) ||
      (!isBullet && (shouldBulletizeSummary || shouldBulletizeSkills || shouldBulletizeExperience));

    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        ...(useBullet ? { bullet: { level: 0 } } : {}),
        keepLines: isHeading || isExperienceMetaLine,
        keepNext: isHeading || isExperienceMetaLine,
        spacing,
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
                top: ATS_MARGIN_TWIP,
                right: ATS_MARGIN_TWIP,
                bottom: ATS_MARGIN_TWIP,
                left: ATS_MARGIN_TWIP,
              },
            },
          },
          children: toParagraphs(draftContentToPlainTextForDocx(draft.content)),
        },
      ],
    });
    const buffer = await Packer.toBuffer(document);
    const body = new Uint8Array(buffer);

    // Auto-save to Vercel Blob and store URL back on the applied record
    uploadResume(
      draft.studentEmail,
      draft.companyName,
      draft.jobTitle,
      filename,
      Buffer.from(buffer)
    ).then(async (blobUrl) => {
      try {
        const db = await getMongoDb();
        await db.collection('admin_applied_records').updateOne(
          { draftId },
          { $set: { resumeBlobUrl: blobUrl } }
        );
      } catch { /* non-critical */ }
    }).catch(() => { /* non-critical */ });

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
