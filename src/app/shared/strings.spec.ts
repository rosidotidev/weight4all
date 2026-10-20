import { Dictionary, Language, strings } from './strings';

const LANGS: Language[] = ['en', 'it'];

// Any parameter name resolves to a sample text, so parameterised entries can be rendered.
const SAMPLE_PARAMS = new Proxy({}, { get: () => 'sample' }) as never;

describe('strings', () => {
  it('fails to compile when a key lacks a language', () => {
    // @ts-expect-error the `it` text is missing
    const missingIt = { x: { en: 'only english' } } satisfies Dictionary;
    // @ts-expect-error the `en` text is missing
    const missingEn = { x: { it: 'solo italiano' } } satisfies Dictionary;
    expect(missingIt).toBeDefined();
    expect(missingEn).toBeDefined();
  });

  it('has non-empty text in both languages for every key', () => {
    for (const [key, entry] of Object.entries(strings)) {
      for (const lang of LANGS) {
        const value = (entry as Record<Language, unknown>)[lang];
        const text = typeof value === 'function' ? (value as (p: never) => string)(SAMPLE_PARAMS) : value;
        expect(typeof text, `${key}.${lang}`).toBe('string');
        expect((text as string).trim().length, `${key}.${lang}`).toBeGreaterThan(0);
      }
    }
  });

  it('allows an exclamation mark only in `saved`', () => {
    for (const [key, entry] of Object.entries(strings)) {
      if (key === 'saved') continue;
      for (const lang of LANGS) {
        const value = (entry as Record<Language, unknown>)[lang];
        const text = typeof value === 'function' ? (value as (p: never) => string)(SAMPLE_PARAMS) : value;
        expect(String(text), `${key}.${lang}`).not.toContain('!');
      }
    }
    expect(strings.saved.en).toBe('Saved!');
    expect(strings.saved.it).toBe('Salvato!');
  });

  it('writes the two Language options in their own language in both Languages', () => {
    expect(strings.settingsLanguageEnglish).toEqual({ en: 'English', it: 'English' });
    expect(strings.settingsLanguageItalian).toEqual({ en: 'Italiano', it: 'Italiano' });
  });

  it('returns strings from parameterised text in both languages', () => {
    const dict = {
      hello: {
        en: (p: { name: string }) => `Hi ${p.name}`,
        it: (p: { name: string }) => `Ciao ${p.name}`,
      },
    } satisfies Dictionary;
    expect(dict.hello.en({ name: 'Ada' })).toBe('Hi Ada');
    expect(dict.hello.it({ name: 'Ada' })).toBe('Ciao Ada');
  });
});
