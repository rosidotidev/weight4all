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
 * The last value minus the first, without rounding to tenths (formatStat rounds the result once, so a
 * move of 0.02 shows as 0.0). Nine decimals only remove floating-point noise; 0 for a single value and
 * `null` for none.
 */
export function change(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const first = values[0];
  const last = values[values.length - 1];
  return Math.round((last - first) * 1e9) / 1e9 + 0;
}

/**
 * A Statistic as text: one decimal, the Language's separator, the unit when given after a space,
 * U+2212 for a negative value and "+" for a positive one when `signed` (Change). Zero has no sign.
 */
export function formatStat(value: number, locale: string, unit = '', signed = false): string {
  // Round the magnitude, then take the sign, so -0.25 and 0.25 read as mirror images.
  const magnitude = Math.round(Math.abs(value) * 10) / 10;
  const sign = value < 0 && magnitude > 0 ? '\u2212' : magnitude > 0 && signed ? '+' : '';
  const digits = formatNumber(magnitude, STAT_DECIMALS, locale);
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
    if (typeof value === 'number') values.push(value);
  }
  return {
    average: average(values),
    minimum: minimum(values),
    maximum: maximum(values),
    change: change(values),
  };
}
