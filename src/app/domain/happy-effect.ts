import { PRIMARY } from './dimensions';
import { DayKey, Entry } from './entry';
import { addDays } from './day';
import { previousEntry } from './history';
import { decimalDifference } from './number';

/** What the Happy effect shows after a confirmed save of today's Entry (FR-9). */
export type HappyEffect =
  | { readonly kind: 'welcome' }
  | {
      readonly kind: 'loss' | 'gain' | 'same';
      /** Saved minus previous, exact to the Dimension's decimals: negative for a loss. */
      readonly delta: number;
      /** The Day of the Entry compared with. */
      readonly since: DayKey;
      /** `since` is the calendar Day before `day`. */
      readonly yesterday: boolean;
    };

/**
 * Compares the saved primary value with the most recent earlier Entry (`previousEntry`), or says
 * welcome when there is none. Only a lower value is a loss; equal is `same`, never a warning.
 */
export function happyEffect(
  day: DayKey,
  value: number,
  entries: Readonly<Record<DayKey, Entry>>,
): HappyEffect {
  const previous = previousEntry(day, entries);
  const before = previous?.values[PRIMARY.key];
  if (previous === null || before === undefined) return { kind: 'welcome' };
  const delta = decimalDifference(value, before, PRIMARY.decimals);
  return {
    kind: delta < 0 ? 'loss' : delta > 0 ? 'gain' : 'same',
    delta,
    since: previous.day,
    yesterday: previous.day === addDays(day, -1),
  };
}
