// Shared value vectors (AD-8, AD-14): the client validators of later stories run against the same lists.
export const VALID_WEIGHTS: number[] = [20, 72, 72.5, 72.7, 99.9, 400];
export const INVALID_WEIGHTS: unknown[] = [19.9, 400.1, 72.55, 0, -1, '72', null, true];

export const VALID_MOODS: number[] = [1, 5, 7, 10];
export const INVALID_MOODS: unknown[] = [0, 11, 7.5, -1, '7', null];

export const VALID_SLEEPS: number[] = [0, 6, 7, 7.5, 24];
export const INVALID_SLEEPS: unknown[] = [-0.5, 24.5, 7.25, '7', null];

export const VALID_DAY_IDS: string[] = ['2026-01-05', '1999-12-31'];
export const INVALID_DAY_IDS: string[] = ['2026-1-5', '26-01-05', '2026-01-051', 'abc', '2026/01/05'];

export const ACCENTS: string[] = ['violet', 'teal', 'orange', 'magenta', 'blue', 'green'];
export const INVALID_ACCENTS: unknown[] = ['pink', '', 'Violet', 1, null];
export const LANGUAGES: string[] = ['it', 'en'];
export const INVALID_LANGUAGES: unknown[] = ['fr', 'IT', '', 1, null];
