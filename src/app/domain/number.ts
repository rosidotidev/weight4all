/** Formats a number with a fixed count of decimals for a locale (AD-14). Story 2.1 extends this file. */
export function formatNumber(value: number, decimals: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
