import { DayKey, Entry } from './entry';

/** The latest Entry with a Day before `day`, or `null`: the one place that computes "previous". */
export function previousEntry(day: DayKey, entries: Readonly<Record<DayKey, Entry>>): Entry | null {
  let best: Entry | null = null;
  for (const entry of Object.values(entries)) {
    if (entry.day < day && (best === null || entry.day > best.day)) best = entry;
  }
  return best;
}
