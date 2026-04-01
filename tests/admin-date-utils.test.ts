import { describe, expect, it } from 'vitest';
import { parseDateOnlyToLocal, startOfDayLocal, toDateInputValue } from '@/lib/admin/date-utils';

describe('admin date utils', () => {
  it('formats date to input value', () => {
    expect(toDateInputValue(new Date(2026, 2, 30))).toBe('2026-03-30');
  });

  it('parses date-only value to local midnight', () => {
    const parsed = parseDateOnlyToLocal('2026-03-30');
    expect(parsed).not.toBeNull();
    if (!parsed) return;
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(2);
    expect(parsed.getDate()).toBe(30);
    expect(parsed.getHours()).toBe(0);
  });

  it('returns null for invalid date-only values', () => {
    expect(parseDateOnlyToLocal('2026-13-40')).toBeNull();
    expect(parseDateOnlyToLocal('03-30-2026')).toBeNull();
  });

  it('returns start of local day', () => {
    const start = startOfDayLocal(new Date(2026, 2, 30, 16, 45, 10));
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
  });
});
