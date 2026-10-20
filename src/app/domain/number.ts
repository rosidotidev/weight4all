/** Formats a number with a fixed count of decimals for a locale (AD-14). Story 2.1 extends this file. */
export function formatNumber(value: number, decimals: number, locale: string, minDecimals = decimals): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Parses typed text: digits with an optional single decimal comma or point and at most `decimals`
 * decimals, surrounding spaces ignored. Anything else is `null`; the value is never rounded (AD-14).
 */
export function parseDecimal(text: string, decimals: number): number | null {
  const match = /^(\d+)(?:[.,](\d+))?$/.exec(text.trim());
  if (!match) return null;
  const fraction = match[2] ?? '';
  if (fraction.length > decimals) return null;
  const value = Number(fraction ? `${match[1]}.${fraction}` : match[1]);
  return Number.isFinite(value) ? value : null;
}

/**
 * One step up (`direction` 1) or down (-1) from `value`, in integer units of 10^-decimals so that
 * 72.7 + 0.1 is exactly 72.8, clamped to `min` and `max` (AD-14).
 */
export function stepValue(
  value: number,
  direction: 1 | -1,
  step: number,
  decimals: number,
  min: number,
  max: number,
): number {
  const unit = 10 ** decimals;
  const next = Math.round(value * unit) + direction * Math.round(step * unit);
  return Math.min(Math.max(next, Math.round(min * unit)), Math.round(max * unit)) / unit;
}

/**
 * `a - b` computed in integer units of 10^-decimals, so 72.4 - 72.7 is exactly -0.3 and never
 * -0.2999999999999972 (AD-14). Never returns negative zero.
 */
export function decimalDifference(a: number, b: number, decimals: number): number {
  const unit = 10 ** decimals;
  return (Math.round(a * unit) - Math.round(b * unit)) / unit + 0;
}
