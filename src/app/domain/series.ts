import { enumerateDays } from './day';
import { DayKey, Entry } from './entry';
import { DimensionKey, Dimension } from './dimensions';

/** One Day of a Dimension's series: its Real value, or `null` for a Day with no value (never 0). */
export interface SeriesPoint {
  readonly day: DayKey;
  readonly value: number | null;
  /** True on a point with a value whose segment from the previous Real value crosses at least one Day without one. */
  readonly bridgedFromPrev: boolean;
}

/**
 * One point per Day from `from` to `to` inclusive, in order, with the Dimension's Real value or `null`.
 * `bridgedFromPrev` marks the Real point that ends a segment crossing a Gap.
 */
export function buildSeries(
  entries: Readonly<Record<DayKey, Entry>>,
  from: DayKey,
  to: DayKey,
  dimension: DimensionKey,
): SeriesPoint[] {
  let previousIndex = -1;
  return enumerateDays(from, to).map((day, index) => {
    const value = entries[day]?.values[dimension] ?? null;
    const bridgedFromPrev = value !== null && previousIndex >= 0 && index - previousIndex > 1;
    if (value !== null) previousIndex = index;
    return { day, value, bridgedFromPrev };
  });
}

/** The number of Days with a Real value. */
export function countValues(series: readonly SeriesPoint[]): number {
  return series.reduce((count, point) => (point.value === null ? count : count + 1), 0);
}

export interface AxisBounds {
  readonly min: number;
  readonly max: number;
}

/**
 * The value axis for a series: the data span padded by the larger of 10 % and one registry step,
 * rounded outward to the registry step and clamped to the registry range. `null` when there is no
 * value. Shared by the per-Dimension and combined charts, so the same series gets the same bounds.
 */
export function axisBounds(
  dimension: Pick<Dimension, 'min' | 'max' | 'step'>,
  series: readonly SeriesPoint[],
): AxisBounds | null {
  const values = series.flatMap((point) => (point.value === null ? [] : [point.value]));
  if (values.length === 0) return null;
  const { min: low, max: high, step } = dimension;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = Math.max(step, (hi - lo) * 0.1);
  const min = Math.max(low, Math.floor((lo - pad) / step) * step);
  const max = Math.min(high, Math.ceil((hi + pad) / step) * step);
  if (max <= min) return { min: low, max: high };
  return { min, max };
}
