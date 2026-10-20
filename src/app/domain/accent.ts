/** The six accent ids allowed by `firestore.rules`; all six are themed (`src/styles/_theme.scss`). */
export const ACCENTS = ['violet', 'teal', 'orange', 'magenta', 'blue', 'green'] as const;

export type Accent = (typeof ACCENTS)[number];

export const DEFAULT_ACCENT: Accent = 'violet';

export function isAccent(value: unknown): value is Accent {
  return typeof value === 'string' && (ACCENTS as readonly string[]).includes(value);
}
