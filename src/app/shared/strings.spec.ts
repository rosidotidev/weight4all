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

  it('names the six accents in both languages', () => {
    expect(strings.accentViolet).toEqual({ en: 'Violet', it: 'Viola' });
    expect(strings.accentTeal).toEqual({ en: 'Teal', it: 'Verde acqua' });
    expect(strings.accentOrange).toEqual({ en: 'Orange', it: 'Arancione' });
    expect(strings.accentMagenta).toEqual({ en: 'Magenta', it: 'Magenta' });
    expect(strings.accentBlue).toEqual({ en: 'Blue', it: 'Blu' });
    expect(strings.accentGreen).toEqual({ en: 'Green', it: 'Verde' });
    expect(strings.settingsAccentLegend.en).toBeTruthy();
    expect(strings.settingsAccentSaveError.it).toBeTruthy();
  });

  it('has the Today loading texts and the Weight label', () => {
    expect(strings.dimensionWeight).toEqual({ en: 'Weight', it: 'Peso' });
    for (const key of ['todayLoading', 'todayLoadError', 'todayRetry'] as const) {
      expect(strings[key].en).toBeTruthy();
      expect(strings[key].it).toBeTruthy();
    }
  });

  it('has the entry form texts', () => {
    expect(strings.weightMissing.en).toBe('Add your weight to save.');
    expect(strings.weightRange.en({ min: '20.0', max: '400.0' })).toBe('Enter a weight between 20.0 and 400.0 kg.');
    expect(strings.weightRange.it({ min: '20,0', max: '400,0' })).toBe('Inserisci un peso tra 20,0 e 400,0 kg.');
    for (const key of ['entrySave', 'entrySaving'] as const) {
      expect(strings[key].en).toBeTruthy();
      expect(strings[key].it).toBeTruthy();
    }
  });

  it('has one save error message per code, plus the snackbar Dismiss', () => {
    const message = "Couldn't save. Your numbers are still here. Try again.";
    expect(strings.saveErrorNetwork.en).toBe(message);
    expect(strings.saveErrorTimeout.en).toBe(message);
    expect(strings.saveErrorNetwork.it).toBe('Salvataggio non riuscito. I tuoi numeri sono ancora qui. Riprova.');
    expect(strings.saveErrorTimeout.it).toBe('Salvataggio non riuscito. I tuoi numeri sono ancora qui. Riprova.');
    expect(strings.saveErrorPermission.en).toContain('log in again');
    expect(strings.saveErrorPermission.it).toContain('Accedi di nuovo');
    for (const key of ['saveErrorInvalid', 'saveErrorUnknown', 'snackbarDismiss'] as const) {
      expect(strings[key].en).toBeTruthy();
      expect(strings[key].it).toBeTruthy();
    }
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
