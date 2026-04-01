export type SectionRange = { start: number; end: number };

export function stripMarkdownAndLinks(input: string): string {
  return input
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/(^|\s)#{1,6}\s+/gm, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '- ')
    .replace(/^\s*_{2,}\s*$/gm, '')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

export function findSectionIndices(lines: string[], keyword: string): SectionRange | null {
  const upperKeyword = keyword.toUpperCase();
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const clean = lines[i].replace(/[^A-Za-z ]/g, '').toUpperCase().trim();
    if (clean.includes(upperKeyword)) {
      start = i;
      break;
    }
  }
  if (start < 0) return null;

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const candidate = lines[i].trim();
    if (!candidate) continue;
    const looksHeading =
      candidate === candidate.toUpperCase() &&
      /[A-Z]/.test(candidate) &&
      candidate.length < 50;
    if (looksHeading) {
      end = i;
      break;
    }
  }
  return { start, end };
}

export function normalizeRewrittenLine(original: string, rewritten: string): string {
  const clean = stripMarkdownAndLinks(rewritten || original).trim();
  const originalTrim = original.trim();
  const originalBulletPrefix = originalTrim.match(/^[\-\u2022\*]\s+/)?.[0] || '';
  if (originalBulletPrefix) {
    const withoutBullet = clean.replace(/^[\-\u2022\*]\s+/, '').trim();
    return `${originalBulletPrefix}${withoutBullet}`;
  }
  return clean;
}
