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
  loginTitle: { en: 'Welcome back', it: 'Bentornato' },
  loginEmailLabel: { en: 'Email', it: 'Email' },
  loginPasswordLabel: { en: 'Password', it: 'Password' },
  loginSubmit: { en: 'Log in', it: 'Accedi' },
  loginNoAccount: { en: 'New here?', it: 'Sei nuovo?' },
  loginRegisterLink: { en: 'Create an account', it: 'Crea un account' },
  loginForgotLink: { en: 'Forgot your password?', it: 'Hai dimenticato la password?' },
  resetTitle: { en: 'Reset your password', it: 'Reimposta la password' },
  resetEmailLabel: { en: 'Email', it: 'Email' },
  resetSubmit: { en: 'Send reset link', it: 'Invia il link' },
  resetConfirmation: {
    en: 'If this email has an account, a message with a link to choose a new password is on its way. It may take a few minutes to arrive.',
    it: 'Se questa email ha un account, sta arrivando un messaggio con il link per scegliere una nuova password. Potrebbe volerci qualche minuto.',
  },
  resetBackToLogin: { en: 'Back to log in', it: 'Torna al login' },
  settingsTitle: { en: 'Settings', it: 'Impostazioni' },
  settingsLogout: { en: 'Log out', it: 'Esci' },
  settingsLanguageLegend: { en: 'Language', it: 'Lingua' },
  // Fixed text: each option is always written in its own language.
  settingsLanguageEnglish: { en: 'English', it: 'English' },
  settingsLanguageItalian: { en: 'Italiano', it: 'Italiano' },
  settingsLanguageSaveError: {
    en: 'We could not save your language, so we went back to the previous one. Please try again.',
    it: 'Non siamo riusciti a salvare la lingua, quindi abbiamo ripristinato quella di prima. Riprova pure.',
  },
  settingsAccentLegend: { en: 'Accent color', it: 'Colore di accento' },
  accentViolet: { en: 'Violet', it: 'Viola' },
  accentTeal: { en: 'Teal', it: 'Verde acqua' },
  accentOrange: { en: 'Orange', it: 'Arancione' },
  accentMagenta: { en: 'Magenta', it: 'Magenta' },
  accentBlue: { en: 'Blue', it: 'Blu' },
  accentGreen: { en: 'Green', it: 'Verde' },
  settingsAccentSaveError: {
    en: 'We could not save your color, so we went back to the previous one. Please try again.',
    it: 'Non siamo riusciti a salvare il colore, quindi abbiamo ripristinato quello di prima. Riprova pure.',
  },
  settingsAccountHeading: { en: 'Account', it: 'Account' },
  settingsSignedInAs: { en: 'Signed in as', it: 'Accesso eseguito come' },
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
  navLabel: { en: 'Main navigation', it: 'Navigazione principale' },
  navToday: { en: 'Today', it: 'Oggi' },
  navHistory: { en: 'History', it: 'Storico' },
  navReport: { en: 'Report', it: 'Report' },
  navSettings: { en: 'Settings', it: 'Impostazioni' },
  historyPlaceholder: {
    en: 'Your past days will appear here soon.',
    it: 'I tuoi giorni passati appariranno qui a breve.',
  },
  historyDayPlaceholder: {
    en: (p: { dayKey: string }) => `Day ${p.dayKey} will appear here soon.`,
    it: (p: { dayKey: string }) => `Il giorno ${p.dayKey} apparirà qui a breve.`,
  },
  reportPlaceholder: {
    en: 'Your report will appear here soon.',
    it: 'Il tuo report apparirà qui a breve.',
  },
} satisfies Dictionary;

export type StringKey = keyof typeof strings;

/** The dictionary resolved for one Language: each key is its text or its function. */
export type Resolved = { [K in StringKey]: (typeof strings)[K]['en'] };
