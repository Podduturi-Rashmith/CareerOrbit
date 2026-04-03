import mammoth from 'mammoth';

/** DOCX / XLSX / etc. are ZIP archives; Word files are ZIP-based. */
function bufferLooksLikeZip(buf: Buffer): boolean {
  return buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b;
}

async function mammothExtractToPlain(buf: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer: buf });
    return (result.value || '').trim();
  } catch {
    return '';
  }
}

export function parseMasterResumeDataUrl(dataUrl: string): { mimeType: string; bytes: Buffer } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1] || 'application/octet-stream';
  const bytes = Buffer.from(match[2] || '', 'base64');
  return { mimeType, bytes };
}

/**
 * Plain text for admin tooling (tailor scan, bullet chat).
 * Only uses `extractedText` for real text files (.txt / text/*). For DOCX we always read from the
 * stored file so a stale or AI-filled `extractedText` field cannot replace the student's resume.
 */
export async function extractMasterResumePlainText(input: {
  mimeType: string;
  fileName: string;
  fileDataUrl: string;
  extractedText: string;
}): Promise<string> {
  const parsed = parseMasterResumeDataUrl(input.fileDataUrl);
  if (!parsed) return '';

  const lowerName = input.fileName.toLowerCase();
  const mime = (input.mimeType || parsed.mimeType || '').toLowerCase();
  const isPlainTextFile =
    mime.startsWith('text/') || lowerName.endsWith('.txt') || lowerName.endsWith('.md');

  if (isPlainTextFile && input.extractedText?.trim()) {
    return input.extractedText.trim();
  }

  if (isPlainTextFile) {
    return parsed.bytes.toString('utf8').trim();
  }

  const explicitDocx =
    mime.includes('wordprocessingml.document') || lowerName.endsWith('.docx');

  const zipMaybeWordDoc =
    bufferLooksLikeZip(parsed.bytes) &&
    !mime.includes('spreadsheetml') &&
    !mime.includes('presentationml') &&
    !lowerName.endsWith('.xlsx') &&
    !lowerName.endsWith('.pptx') &&
    !lowerName.endsWith('.zip');

  if (explicitDocx || zipMaybeWordDoc) {
    const text = await mammothExtractToPlain(parsed.bytes);
    if (text) return text;
  }

  return '';
}
