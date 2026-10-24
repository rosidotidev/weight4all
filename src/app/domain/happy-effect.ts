import { PRIMARY } from './dimensions';
import { DayKey, Entry } from './entry';
import { addDays } from './day';
import { previousEntry } from './history';
import { decimalDifference } from './number';

/** What the Happy effect shows after a confirmed save of today's Entry (FR-9). */
export type HappyEffect =
  | { readonly kind: 'welcome' }
  | {
      readonly kind: 'loss' | 'same';
      /** Saved minus previous, exact to the Dimension's decimals: negative for a loss. */
      readonly delta: number;
      /** The Day of the Entry compared with. */
      readonly since: DayKey;
      /** `since` is the calendar Day before `day`. */
      readonly yesterday: boolean;
    }
  | {
      readonly kind: 'gain';
      /** Saved minus previous, exact to the Dimension's decimals: positive for a gain. */
      readonly delta: number;
      /** The Day of the Entry compared with. */
      readonly since: DayKey;
      /** `since` is the calendar Day before `day`. */
      readonly yesterday: boolean;
      /** The rise is strictly more than 1% of the previous value; a change of exactly 1% is not. */
      readonly jump: boolean;
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
  const since = previous.day;
  const yesterday = previous.day === addDays(day, -1);
  if (delta > 0) {
    return { kind: 'gain', delta, since, yesterday, jump: isJump(delta, before) };
  }
  return { kind: delta < 0 ? 'loss' : 'same', delta, since, yesterday };
}

/**
 * Whether `rise` is strictly more than 1% of `before`. Both are compared in integer units of
 * 10^-decimals, so `rise * 100 > before` never depends on float percentages.
 */
function isJump(rise: number, before: number): boolean {
  const unit = 10 ** PRIMARY.decimals;
  // rise / before > 1 / 100, written without division.
  return Math.round(rise * unit) * 100 > Math.round(before * unit);
}
