import { DIMENSIONS, DimensionKey, PRIMARY } from './dimensions';

export type { DimensionKey } from './dimensions';

/** A device-local `YYYY-MM-DD`. */
export type DayKey = string;

/** One Day's numbers, in display units; an absent Dimension is an absent key. */
export interface Entry {
  readonly day: DayKey;
  readonly values: Partial<Record<DimensionKey, number>>;
}

/**
 * The values a form starts from: the stored Entry's values if there is one, else each Dimension's
 * registry default, plus the last Entry's primary value as a suggestion when given (AD-12).
 */
export function initialDraft(
  day: DayKey,
  entries: Readonly<Record<DayKey, Entry>>,
  lastEntry: Entry | null,
): Partial<Record<DimensionKey, number>> {
  const stored = entries[day];
  if (stored) return { ...stored.values };
  const values: Partial<Record<DimensionKey, number>> = {};
  for (const dimension of DIMENSIONS) {
    if (dimension.defaultValue !== null) values[dimension.key] = dimension.defaultValue;
  }
  const suggestion = lastEntry?.values[PRIMARY.key];
  if (suggestion !== undefined) values[PRIMARY.key] = suggestion;
  return values;
}
