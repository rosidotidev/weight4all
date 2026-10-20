/**
 * Short weekday, day and short month of a `YYYY-MM-DD` key, in the locale (AD-4); without the
 * weekday when `weekday` is false ("14 Oct").
 */
export function formatDay(dayKey: string, locale: string, weekday = true): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  // Built from parts in local time: `new Date('YYYY-MM-DD')` would parse as UTC.
  const date = new Date(year, month - 1, day);
  const parts = new Intl.DateTimeFormat(locale, {
    ...(weekday ? { weekday: 'short' as const } : {}),
    day: 'numeric',
    month: 'short',
  }).formatToParts(date);
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return weekday ? `${pick('weekday')} ${pick('day')} ${pick('month')}` : `${pick('day')} ${pick('month')}`;
}

export type RangeId = '7d' | '30d' | '90d' | '1y' | 'all';

const RANGE_DAYS: Record<Exclude<RangeId, 'all'>, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };

const pad = (n: number, width: number) => String(n).padStart(width, '0');

/** The device-local `YYYY-MM-DD` of a date. */
export function dayKey(date: Date): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`;
}

/** A local `Date` at midnight for a valid key, or `null` for a malformed or impossible one. */
export function parseDayKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  // Years 0 to 99 map to 1900 to 1999 in the constructor.
  date.setFullYear(year);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

/** The key `n` calendar days after `key` (before when negative); calendar arithmetic, not milliseconds. */
export function addDays(key: string, n: number): string {
  const date = parseDayKey(key);
  if (!date) throw new Error(`Invalid day key: ${key}`);
  date.setDate(date.getDate() + n);
  return dayKey(date);
}

/** Every key from `from` to `to`, inclusive; empty when `from` is after `to`. */
export function enumerateDays(from: string, to: string): string[] {
  const days: string[] = [];
  // Keys are fixed-width, so string comparison is chronological.
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day);
  return days;
}

/** The inclusive Day span of a Range; `all` starts at `firstDay` (today when `null`). */
export function resolveRange(rangeId: RangeId, today: string, firstDay: string | null): { from: string; to: string } {
  if (rangeId === 'all') return { from: firstDay ?? today, to: today };
  return { from: addDays(today, 1 - RANGE_DAYS[rangeId]), to: today };
}
