/** Short weekday, day and short month of a `YYYY-MM-DD` key, in the locale (AD-4). Story 2.1 extends this file. */
export function formatDay(dayKey: string, locale: string): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  // Built from parts in local time: `new Date('YYYY-MM-DD')` would parse as UTC.
  const date = new Date(year, month - 1, day);
  const parts = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).formatToParts(date);
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${pick('weekday')} ${pick('day')} ${pick('month')}`;
}
