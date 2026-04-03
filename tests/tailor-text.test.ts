import { describe, expect, it } from 'vitest';
import {
  findSectionIndices,
  normalizeRewrittenLine,
  stripMarkdownAndLinks,
} from '@/lib/jobs/tailor-text';

describe('tailor text helpers', () => {
  it('strips markdown links and emphasis', () => {
    const input = 'See [Profile](https://x.com) and **impact** with `code`';
    const output = stripMarkdownAndLinks(input);
    expect(output).toContain('Profile');
    expect(output).not.toContain('https://x.com');
    expect(output).not.toContain('**');
    expect(output).not.toContain('`');
  });

  it('finds section range between headings', () => {
    const lines = ['NAME', 'SUMMARY', 'Line 1', 'Line 2', 'EXPERIENCE', 'Role'];
    const range = findSectionIndices(lines, 'summary');
    expect(range).toEqual({ start: 1, end: 4 });
  });

  it('preserves existing bullet prefix when normalizing rewritten text', () => {
    const output = normalizeRewrittenLine('- Built API', 'Improved API throughput by 30%.');
    expect(output.startsWith('- ')).toBe(true);
    expect(output).toContain('Improved API throughput');
  });
});
