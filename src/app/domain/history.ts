import { addDays } from './day';
import { DayKey, Entry } from './entry';

/** The latest Entry with a Day before `day`, or `null`: the one place that computes "previous". */
export function previousEntry(day: DayKey, entries: Readonly<Record<DayKey, Entry>>): Entry | null {
  let best: Entry | null = null;
  for (const entry of Object.values(entries)) {
    if (entry.day < day && (best === null || entry.day > best.day)) best = entry;
  }
  return best;
}

export type HistoryRow =
  | { readonly kind: 'entry'; readonly day: DayKey; readonly entry: Entry }
  | { readonly kind: 'missing'; readonly day: DayKey };

/**
 * The History rows, newest first, from the first Entry's Day to the last Entry's Day, capped at
 * `today`: a row per Entry and a `missing` row per Day without one in between. Future Days never appear.
 */
export function buildHistoryRows(
  entries: Readonly<Record<DayKey, Entry>>,
  today: DayKey,
): HistoryRow[] {
  const days = Object.keys(entries)
    .filter((day) => day <= today)
    .sort();
  if (days.length === 0) return [];
  const rows: HistoryRow[] = [];
  const first = days[0];
  for (let day = days[days.length - 1]; day >= first; day = addDays(day, -1)) {
    const entry = entries[day];
    rows.push(entry ? { kind: 'entry', day, entry } : { kind: 'missing', day });
  }
  return rows;
}

/** The `n` newest Entries, newest first. */
export function recentEntries(entries: Readonly<Record<DayKey, Entry>>, n: number): Entry[] {
  return Object.values(entries)
    .sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0))
    .slice(0, Math.max(0, n));
}
