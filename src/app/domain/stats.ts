import { DayKey, Entry } from './entry';
import { DimensionKey } from './dimensions';
import { formatNumber } from './number';

/** Statistics are shown with one decimal for every Dimension (epic "one decimal everywhere"). */
const STAT_DECIMALS = 1;

/** The mean of the values, or `null` when there are none (never 0). */
export function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** The smallest value, or `null` when there are none. */
export function minimum(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return Math.min(...values);
}

/** The largest value, or `null` when there are none. */
export function maximum(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return Math.max(...values);
}

/**
 * The last value minus the first, computed in tenths so 7.5 - 7.0 is exactly 0.5; 0 for a single
 * value and `null` for none.
 */
export function change(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const first = values[0];
  const last = values[values.length - 1];
  return (Math.round(last * 10) - Math.round(first * 10)) / 10 + 0;
}

/**
 * A Statistic as text: one decimal, the Language's separator, the unit when given after a space,
 * U+2212 for a negative value and "+" for a positive one when `signed` (Change). Zero has no sign.
 */
export function formatStat(value: number, locale: string, unit = '', signed = false): string {
  const rounded = Math.round(value * 10) / 10 + 0;
  const sign = rounded < 0 ? '\u2212' : rounded > 0 && signed ? '+' : '';
  const digits = formatNumber(Math.abs(rounded), STAT_DECIMALS, locale);
  return `${sign}${digits}${unit ? ' ' + unit : ''}`;
}

export interface DimensionStatistics {
  readonly average: number | null;
  readonly minimum: number | null;
  readonly maximum: number | null;
  readonly change: number | null;
}

/**
 * The Statistics of one Dimension over the Entries whose Day lies between `from` and `to` inclusive,
 * from Real entries only (a Day with no value for the Dimension is skipped).
 */
export function dimensionStatistics(
  entries: Readonly<Record<DayKey, Entry>>,
  from: DayKey,
  to: DayKey,
  dimension: DimensionKey,
): DimensionStatistics {
  // Keys are fixed-width, so string comparison is chronological.
  const days = Object.keys(entries)
    .filter((day) => day >= from && day <= to)
    .sort();
  const values: number[] = [];
  for (const day of days) {
    const value = entries[day].values[dimension];
    if (value !== undefined) values.push(value);
  }
  return {
    average: average(values),
    minimum: minimum(values),
    maximum: maximum(values),
    change: change(values),
  };
}
