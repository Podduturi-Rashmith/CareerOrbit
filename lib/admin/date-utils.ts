export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateOnlyToLocal(dateString: string): Date | null {
  if (!DATE_ONLY_REGEX.test(dateString)) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  const parsed = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

export function startOfDayLocal(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}
