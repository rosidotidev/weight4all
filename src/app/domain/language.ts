export type Language = 'it' | 'en';

export const LANGUAGES: readonly Language[] = ['en', 'it'];

export const DEFAULT_LANGUAGE: Language = 'en';

export const LOCALES: Record<Language, string> = { it: 'it-IT', en: 'en-GB' };

export function isLanguage(value: unknown): value is Language {
  return value === 'it' || value === 'en';
}
