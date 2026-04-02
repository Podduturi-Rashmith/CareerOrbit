import { describe, expect, it } from 'vitest';
import {
  draftContentToPlainTextForDocx,
  htmlResumeToPlainLines,
  looksLikeHtml,
  plainTextResumeToHtml,
} from '@/lib/jobs/draft-html';

describe('draft-html', () => {
  it('detects HTML vs plain', () => {
    expect(looksLikeHtml('<p>Hi</p>')).toBe(true);
    expect(looksLikeHtml('SUMMARY\n- line')).toBe(false);
  });

  it('wraps plain lines as paragraphs', () => {
    const html = plainTextResumeToHtml('A\nB');
    expect(html).toContain('<p>A</p>');
    expect(html).toContain('<p>B</p>');
  });

  it('preserves HTML when already HTML', () => {
    const raw = '<p>x</p>';
    expect(plainTextResumeToHtml(raw)).toBe(raw);
  });

  it('converts simple editor HTML to plain lines for docx', () => {
    const html = '<h2>Title</h2><p>Line</p><ul><li>One</li><li>Two</li></ul>';
    const plain = htmlResumeToPlainLines(html);
    expect(plain).toContain('Title');
    expect(plain).toContain('Line');
    expect(plain).toContain('- One');
    expect(plain).toContain('- Two');
  });

  it('draftContentToPlainTextForDocx leaves plain untouched', () => {
    const t = 'Hello\nWorld';
    expect(draftContentToPlainTextForDocx(t)).toBe(t);
  });
});
