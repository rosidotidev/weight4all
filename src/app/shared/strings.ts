import { Language } from '../domain/language';

// Language lives in `domain` so `core/data` (PreferencesStore) can use it without importing `shared`.
export { DEFAULT_LANGUAGE, LOCALES } from '../domain/language';
export type { Language } from '../domain/language';

/** Every key needs both languages; parameterised text is a function `(params) => string`. */
export type Dictionary = Record<
  string,
  Record<Language, string> | Record<Language, (params: never) => string>
>;

export const strings = {
  appName: { en: 'Weight4All', it: 'Weight4All' },
  saved: { en: 'Saved!', it: 'Salvato!' },
  datepickerCalendar: { en: 'Calendar', it: 'Calendario' },
  datepickerOpenCalendar: { en: 'Open calendar', it: 'Apri calendario' },
  datepickerCloseCalendar: { en: 'Close calendar', it: 'Chiudi calendario' },
  datepickerPrevMonth: { en: 'Previous month', it: 'Mese precedente' },
  datepickerNextMonth: { en: 'Next month', it: 'Mese successivo' },
  datepickerPrevYear: { en: 'Previous year', it: 'Anno precedente' },
  datepickerNextYear: { en: 'Next year', it: 'Anno successivo' },
  datepickerPrevMultiYear: { en: 'Previous 24 years', it: 'I 24 anni precedenti' },
  datepickerNextMultiYear: { en: 'Next 24 years', it: 'I 24 anni successivi' },
  datepickerSwitchToMonthView: { en: 'Choose date', it: 'Scegli una data' },
  datepickerSwitchToMultiYearView: {
    en: 'Choose month and year',
    it: 'Scegli mese e anno',
  },
  datepickerStartDate: { en: 'Start date', it: 'Data di inizio' },
  datepickerEndDate: { en: 'End date', it: 'Data di fine' },
  datepickerComparisonDate: { en: 'Comparison date', it: 'Data di confronto' },
  registerTitle: { en: 'Create your account', it: 'Crea il tuo account' },
  registerEmailLabel: { en: 'Email', it: 'Email' },
  registerPasswordLabel: { en: 'Password', it: 'Password' },
  registerPasswordHint: { en: 'At least 6 characters.', it: 'Almeno 6 caratteri.' },
  registerSubmit: { en: 'Create account', it: 'Crea account' },
  registerHaveAccount: { en: 'Already have an account?', it: 'Hai già un account?' },
  registerLoginLink: { en: 'Log in', it: 'Accedi' },
  authErrorInvalidCredentials: {
    en: 'That email and password do not match. Please try again.',
    it: 'Email e password non corrispondono. Riprova pure.',
  },
  authErrorEmailInUse: {
    en: 'This email already has an account. You can log in instead.',
    it: 'Questa email ha già un account. Puoi accedere invece.',
  },
  authErrorWeakPassword: {
    en: 'Please choose a password with at least 6 characters.',
    it: 'Scegli una password di almeno 6 caratteri.',
  },
  authErrorInvalidEmail: {
    en: 'That email address does not look right. Could you check it?',
    it: 'Questo indirizzo email non sembra corretto. Puoi ricontrollarlo?',
  },
  authErrorNetwork: {
    en: 'We could not reach the server. Check your connection and try again.',
    it: 'Non riusciamo a raggiungere il server. Controlla la connessione e riprova.',
  },
  authErrorUnknown: {
    en: 'Something went wrong on our side. Please try again in a moment.',
    it: 'Qualcosa è andato storto da parte nostra. Riprova tra un momento.',
  },
  todayPlaceholder: {
    en: 'Your day will appear here soon.',
    it: 'Il tuo giorno apparirà qui a breve.',
  },
} satisfies Dictionary;

export type StringKey = keyof typeof strings;

/** The dictionary resolved for one Language: each key is its text or its function. */
export type Resolved = { [K in StringKey]: (typeof strings)[K]['en'] };
