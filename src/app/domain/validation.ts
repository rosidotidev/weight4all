import { Dimension } from './dimensions';
import { parseDecimal } from './number';

export type ValueError = 'missing' | 'range';
export type ValueResult =
  | { readonly ok: true; readonly value: number }
  | { readonly ok: false; readonly error: ValueError };

/** Checks typed text against a Dimension: blank is `missing`; unparseable, too precise, off its step or out of range is `range`. */
export function validateValue(dimension: Dimension, text: string): ValueResult {
  if (text.trim() === '') return { ok: false, error: 'missing' };
  const value = parseDecimal(text, dimension.decimals);
  if (value === null || value < dimension.min || value > dimension.max) return { ok: false, error: 'range' };
  // In integer units of 10^-decimals, so 6.5 / 0.5 is exact (AD-14).
  const unit = 10 ** dimension.decimals;
  if (Math.round(value * unit) % Math.round(dimension.step * unit) !== 0) return { ok: false, error: 'range' };
  return { ok: true, value };
}
