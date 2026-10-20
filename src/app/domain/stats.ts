/** The mean of the values, or `null` when there are none (never 0). Epic 4 extends this file. */
export function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
