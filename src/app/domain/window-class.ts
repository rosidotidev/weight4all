export type WindowClass = 'compact' | 'medium' | 'expanded';

/** Width in px at which `medium` and `expanded` begin; the only place the thresholds appear. */
export const MEDIUM_MIN_WIDTH = 600;
export const EXPANDED_MIN_WIDTH = 840;

export function windowClassFor(width: number): WindowClass {
  if (width >= EXPANDED_MIN_WIDTH) return 'expanded';
  if (width >= MEDIUM_MIN_WIDTH) return 'medium';
  return 'compact';
}
