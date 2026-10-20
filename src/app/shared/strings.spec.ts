import { Dictionary, Language, strings } from './strings';

const LANGS: Language[] = ['en', 'it'];

// Any parameter name resolves to a sample text, so parameterised entries can be rendered.
const SAMPLE_PARAMS = new Proxy({}, { get: () => 'sample' }) as never;

const EXCLAIMING = ['saved', 'effectLoss', 'effectWelcome'];

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
        const text =
          typeof value === 'function' ? (value as (p: never) => string)(SAMPLE_PARAMS) : value;
        expect(typeof text, `${key}.${lang}`).toBe('string');
        expect((text as string).trim().length, `${key}.${lang}`).toBeGreaterThan(0);
      }
    }
  });

  it('allows an exclamation mark only in `saved` and the warm effect messages', () => {
    for (const [key, entry] of Object.entries(strings)) {
      if (EXCLAIMING.includes(key)) continue;
      for (const lang of LANGS) {
        const value = (entry as Record<Language, unknown>)[lang];
        const text =
          typeof value === 'function' ? (value as (p: never) => string)(SAMPLE_PARAMS) : value;
        expect(String(text), `${key}.${lang}`).not.toContain('!');
      }
    }
    expect(strings.saved.en).toBe('Saved!');
    expect(strings.saved.it).toBe('Salvato!');
  });

  it('has the Happy effect copy of EXPERIENCE.md in both languages', () => {
    expect(strings.effectLoss).toEqual({
      en: 'Nice! Another step, your way.',
      it: 'Bene! Un altro passo, a modo tuo.',
    });
    expect(strings.effectWelcome.en).toBe('Welcome! Your first log is in.');
    expect(strings.effectYesterday).toEqual({ en: 'vs yesterday', it: 'rispetto a ieri' });
    expect(strings.effectSince.en({ date: '14 Oct' })).toBe('vs 14 Oct');
    expect(strings.effectSince.it({ date: '14 ott' })).toBe('rispetto al 14 ott');
    expect(strings.effectLogged.en({ value: '72.4' })).toBe('72.4 kg logged for today.');
    expect(strings.effectLogged.it({ value: '72,4' })).toBe('72,4 kg registrati per oggi.');
    expect([strings.effectDone.it, strings.effectDismiss.it]).toEqual(['Fatto', 'Chiudi']);
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
    for (const key of [
      'todayLoading',
      'todayLoadError',
      'todayRetry',
      'todayMissingTitle',
      'todayMissingBody',
    ] as const) {
      expect(strings[key].en).toBeTruthy();
      expect(strings[key].it).toBeTruthy();
    }
  });

  it('has the History copy of EXPERIENCE.md in both languages', () => {
    expect(strings.historyHeading).toEqual({
      en: 'Entries · newest first',
      it: 'Registrazioni · dalla più recente',
    });
    expect(strings.historyEmpty.en).toBe('Nothing here yet. Your first log starts on Today.');
    expect(strings.historyEmpty.it).toBe('Ancora niente qui. La prima registrazione parte da Oggi.');
    expect(strings.historyMissing.en({ date: 'Mon 13 Oct' })).toBe('Mon 13 Oct — no entry');
    expect(strings.historyMissing.it({ date: 'lun 13 ott' })).toBe('lun 13 ott — nessuna registrazione');
  });

  it('has the entry form texts', () => {
    expect(strings.weightMissing.en).toBe('Add your weight to save.');
    expect(strings.weightRange.en({ min: '20.0', max: '400.0' })).toBe(
      'Enter a weight between 20.0 and 400.0 kg.',
    );
    expect(strings.weightRange.it({ min: '20,0', max: '400,0' })).toBe(
      'Inserisci un peso tra 20,0 e 400,0 kg.',
    );
    for (const key of ['entrySave', 'entrySaving'] as const) {
      expect(strings[key].en).toBeTruthy();
      expect(strings[key].it).toBeTruthy();
    }
  });

  it('has one save error message per code, plus the snackbar Dismiss', () => {
    const message = "Couldn't save. Your numbers are still here. Try again.";
    expect(strings.saveErrorNetwork.en).toBe(message);
    expect(strings.saveErrorTimeout.en).toBe(message);
    expect(strings.saveErrorNetwork.it).toBe(
      'Salvataggio non riuscito. I tuoi numeri sono ancora qui. Riprova.',
    );
    expect(strings.saveErrorTimeout.it).toBe(
      'Salvataggio non riuscito. I tuoi numeri sono ancora qui. Riprova.',
    );
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

  it('names the weight stepper and its hint in both languages', () => {
    expect(strings.weightIncrease).toEqual({
      en: 'Increase weight by 0.1 kg',
      it: 'Aumenta il peso di 0,1 kg',
    });
    expect(strings.weightDecrease).toEqual({
      en: 'Decrease weight by 0.1 kg',
      it: 'Diminuisci il peso di 0,1 kg',
    });
    expect(strings.weightHint.en({ value: '72.7', step: '0.1' })).toBe(
      'Last time: 72.7 kg · step 0.1 kg',
    );
    expect(strings.weightHint.it({ value: '72,7', step: '0,1' })).toBe(
      'Ultima volta: 72,7 kg · passo 0,1 kg',
    );
    expect(strings.weightHintNoLast.en({ step: '0.1' })).toBe('Step 0.1 kg');
    expect(strings.weightHintNoLast.it({ step: '0,1' })).toBe('Passo 0,1 kg');
  });
});
