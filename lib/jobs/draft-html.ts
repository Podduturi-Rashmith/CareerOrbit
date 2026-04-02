import { load } from 'cheerio';

/** Detect stored tailored draft content saved as HTML from the rich editor. */
export function looksLikeHtml(content: string): boolean {
  const t = content.trim();
  return t.startsWith('<') && /<[a-zA-Z][^>]*>/.test(t);
}

/** Escape plain lines to TipTap / HTML paragraphs. Preserves existing HTML. */
export function plainTextResumeToHtml(content: string): string {
  if (!content.trim()) return '<p></p>';
  if (looksLikeHtml(content)) return content;
  return content
    .split('\n')
    .map((line) => {
      const safe = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<p>${safe}</p>`;
    })
    .join('');
}

/**
 * Convert editor HTML to newline-separated plain text for the legacy DOCX pipeline
 * (headings + paragraphs + list items as "- " bullets).
 */
export function htmlResumeToPlainLines(html: string): string {
  const $ = load(`<div class="co-root">${html}</div>`, undefined, false);
  const lines: string[] = [];

  const textClean = (s: string) => s.replace(/\s+/g, ' ').trim();

  const walk = (nodes: ReturnType<typeof $>) => {
    nodes.each((_, el) => {
      if (el.type !== 'tag') return;
      const name = el.name;
      if (name === 'p') {
        const t = textClean($(el).text());
        if (t) lines.push(t);
        return;
      }
      if (name === 'h1' || name === 'h2' || name === 'h3' || name === 'h4' || name === 'h5') {
        const t = textClean($(el).text());
        if (t) lines.push(t);
        return;
      }
      if (name === 'ul' || name === 'ol') {
        $(el)
          .children('li')
          .each((__, li) => {
            const t = textClean($(li).text());
            if (t) lines.push(`- ${t}`);
          });
        return;
      }
      if (name === 'blockquote') {
        const t = textClean($(el).text());
        if (t) lines.push(t);
        return;
      }
      if (name === 'hr') {
        lines.push('');
        return;
      }
      walk($(el).children());
    });
  };

  walk($('.co-root').children());
  return lines.join('\n');
}

export function draftContentToPlainTextForDocx(content: string): string {
  if (!looksLikeHtml(content)) return content;
  return htmlResumeToPlainLines(content);
}
