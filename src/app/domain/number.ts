/** Formats a number with a fixed count of decimals for a locale (AD-14). Story 2.1 extends this file. */
export function formatNumber(value: number, decimals: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
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
