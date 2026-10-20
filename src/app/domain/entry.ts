import { DimensionKey } from './dimensions';

export type { DimensionKey } from './dimensions';

/** A device-local `YYYY-MM-DD`. */
export type DayKey = string;

/** One Day's numbers, in display units; an absent Dimension is an absent key. */
export interface Entry {
  readonly day: DayKey;
  readonly values: Partial<Record<DimensionKey, number>>;
}
