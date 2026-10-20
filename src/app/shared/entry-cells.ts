import { DIMENSIONS, Dimension } from '../domain/dimensions';
import { Entry } from '../domain/entry';
import { formatNumber } from '../domain/number';

export interface Cell {
  readonly key: string;
  /** The formatted value with its unit, or `null` when the Entry has none. */
  readonly text: string | null;
  /** The value to draw as a face (a Dimension with `input: 'faces'`), else `null`. */
  readonly face: number | null;
}

/** One cell per registry Dimension for a list row; an absent value is `text: null`, never 0. */
export function entryCells(entry: Entry, locale: string): Cell[] {
  return (DIMENSIONS as readonly Dimension[]).map((dimension) => {
    const value = (entry.values as Record<string, number | undefined>)[dimension.key];
    if (value === undefined) return { key: dimension.key, text: null, face: null };
    const number = formatNumber(value, dimension.decimals, locale, dimension.rowMinDecimals);
    return {
      key: dimension.key,
      text: `${number}${dimension.unit ? ' ' + dimension.unit : ''}`,
      face: dimension.input === 'faces' ? value : null,
    };
  });
}
