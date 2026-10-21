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
  announceSaved: { en: 'Saved', it: 'Salvato' },
  announceDeleted: { en: 'Deleted', it: 'Eliminato' },
  effectYesterday: { en: 'vs yesterday', it: 'rispetto a ieri' },
  effectSince: {
    en: (p: { date: string }) => `vs ${p.date}`,
    it: (p: { date: string }) => `rispetto al ${p.date}`,
  },
  effectLoss: { en: 'Nice! Another step, your way.', it: 'Bene! Un altro passo, a modo tuo.' },
  effectGain: {
    en: 'Bodies fluctuate. Thanks for logging today.',
    it: 'Il corpo cambia di giorno in giorno. Grazie per aver registrato oggi.',
  },
  effectWelcome: {
    en: 'Welcome! Your first log is in.',
    it: 'Benvenuto! La tua prima registrazione è salvata.',
  },
  effectLogged: {
    en: (p: { value: string }) => `${p.value} kg logged for today.`,
    it: (p: { value: string }) => `${p.value} kg registrati per oggi.`,
  },
  effectDone: { en: 'Done', it: 'Fatto' },
  effectDismiss: { en: 'Dismiss', it: 'Chiudi' },
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
  settingsAccentLegend: { en: 'Accent color', it: "Colore d'accento" },
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
  settingsFooterThanks: { en: 'Thanks for being here.', it: 'Grazie di esserci.' },
  settingsFooterCount: {
    en: 'Every log counts, at your own pace.',
    it: 'Ogni registrazione conta, ai tuoi tempi.',
  },
  settingsSignedInAs: { en: 'Signed in as', it: 'Accesso come' },
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
  dimensionWeight: { en: 'Weight', it: 'Peso' },
  weightMissing: { en: 'Add your weight to save.', it: 'Aggiungi il peso per salvare.' },
  weightRange: {
    en: (p: { min: string; max: string }) => `Enter a weight between ${p.min} and ${p.max} kg.`,
    it: (p: { min: string; max: string }) => `Inserisci un peso tra ${p.min} e ${p.max} kg.`,
  },
  weightIncrease: { en: 'Increase weight by 0.1 kg', it: 'Aumenta il peso di 0,1 kg' },
  weightDecrease: { en: 'Decrease weight by 0.1 kg', it: 'Diminuisci il peso di 0,1 kg' },
  weightHint: {
    en: (p: { value: string; step: string }) => `Last time: ${p.value} kg · step ${p.step} kg`,
    it: (p: { value: string; step: string }) => `Ultima volta: ${p.value} kg · passo ${p.step} kg`,
  },
  weightHintNoLast: {
    en: (p: { step: string }) => `Step ${p.step} kg`,
    it: (p: { step: string }) => `Passo ${p.step} kg`,
  },
  dimensionMood: { en: 'Mood', it: 'Umore' },
  optionalTag: { en: 'optional', it: 'facoltativo' },
  moodHint: { en: '1 sad … 10 happy', it: '1 triste … 10 felice' },
  moodRange: {
    en: (p: { min: string; max: string }) => `Choose a mood from ${p.min} to ${p.max}.`,
    it: (p: { min: string; max: string }) => `Scegli un umore da ${p.min} a ${p.max}.`,
  },
  moodFace: {
    en: (p: { n: string }) => `Mood ${p.n} of 10`,
    it: (p: { n: string }) => `Umore ${p.n} su 10`,
  },
  dimensionSleep: { en: 'Sleep', it: 'Sonno' },
  sleepRange: {
    en: (p: { min: string; max: string }) => `Choose sleep from ${p.min} to ${p.max} hours in half-hour steps.`,
    it: (p: { min: string; max: string }) => `Scegli il sonno da ${p.min} a ${p.max} ore a passi di mezz'ora.`,
  },
  sleepValueText: {
    en: (p: { hours: string }) => `${p.hours} hours`,
    it: (p: { hours: string }) => `${p.hours} ore`,
  },
  sleepNone: { en: 'No sleep value', it: 'Nessun valore di sonno' },
  sleepClear: { en: 'Clear sleep', it: 'Cancella sonno' },
  sleepEnd: {
    en: (p: { hours: string }) => `${p.hours} h`,
    it: (p: { hours: string }) => `${p.hours} h`,
  },
  entrySave: { en: 'Save', it: 'Salva' },
  entrySaving: { en: 'Saving…', it: 'Salvataggio in corso…' },
  saveErrorNetwork: {
    en: "Couldn't save. Your numbers are still here. Try again.",
    it: 'Salvataggio non riuscito. I tuoi numeri sono ancora qui. Riprova.',
  },
  saveErrorTimeout: {
    en: "Couldn't save. Your numbers are still here. Try again.",
    it: 'Salvataggio non riuscito. I tuoi numeri sono ancora qui. Riprova.',
  },
  saveErrorPermission: {
    en: "Couldn't save. Your numbers are still here. Please log in again.",
    it: 'Salvataggio non riuscito. I tuoi numeri sono ancora qui. Accedi di nuovo.',
  },
  saveErrorInvalid: {
    en: "Couldn't save. Your numbers are still here. Check them and try again.",
    it: 'Salvataggio non riuscito. I tuoi numeri sono ancora qui. Controllali e riprova.',
  },
  saveErrorUnknown: {
    en: "Couldn't save. Your numbers are still here. Try again in a moment.",
    it: 'Salvataggio non riuscito. I tuoi numeri sono ancora qui. Riprova tra un momento.',
  },
  snackbarDismiss: { en: 'Dismiss', it: 'Chiudi' },
  todayLoading: { en: 'Loading your days', it: 'Sto caricando i tuoi giorni' },
  todayLoadError: {
    en: 'We could not load your days. Please check your connection and try again.',
    it: 'Non siamo riusciti a caricare i tuoi giorni. Controlla la connessione e riprova.',
  },
  todayMissingTitle: { en: "Today isn't logged yet", it: 'Oggi non è ancora registrato' },
  todayMissingBody: {
    en: "Add today's numbers whenever you're ready.",
    it: 'Aggiungi i numeri di oggi quando vuoi.',
  },
  todayRetry: { en: 'Try again', it: 'Riprova' },
  navLabel: { en: 'Main navigation', it: 'Navigazione principale' },
  navToday: { en: 'Today', it: 'Oggi' },
  navHistory: { en: 'History', it: 'Storico' },
  navReport: { en: 'Report', it: 'Report' },
  navSettings: { en: 'Settings', it: 'Impostazioni' },
  historyHeading: { en: 'Entries · newest first', it: 'Registrazioni · dalla più recente' },
  historyMissing: {
    en: (p: { date: string }) => `${p.date} — no entry`,
    it: (p: { date: string }) => `${p.date} — nessuna registrazione`,
  },
  historyAdd: { en: '+ Add', it: '+ Aggiungi' },
  historyAddFor: {
    en: (p: { date: string }) => `Add entry for ${p.date}`,
    it: (p: { date: string }) => `Aggiungi registrazione per ${p.date}`,
  },
  historyOpenEntry: {
    en: (p: { date: string; value: string }) => `Open entry for ${p.date}: ${p.value}`,
    it: (p: { date: string; value: string }) => `Apri registrazione di ${p.date}: ${p.value}`,
  },
  historyEmpty: {
    en: 'Nothing here yet. Your first log starts on Today.',
    it: 'Ancora niente qui. La prima registrazione parte da Oggi.',
  },
  historyLoading: { en: 'Loading your days', it: 'Sto caricando i tuoi giorni' },
  historyLoadError: {
    en: 'We could not load your days. Please check your connection and try again.',
    it: 'Non siamo riusciti a caricare i tuoi giorni. Controlla la connessione e riprova.',
  },
  historyRetry: { en: 'Try again', it: 'Riprova' },
  historyDash: { en: '—', it: '—' },
  historyAbsentValue: { en: 'no value', it: 'nessun valore' },
  historyEdit: { en: 'Edit', it: 'Modifica' },
  historyEditFor: {
    en: (p: { date: string }) => `Edit entry for ${p.date}`,
    it: (p: { date: string }) => `Modifica registrazione per ${p.date}`,
  },
  historyRowMenu: {
    en: (p: { date: string }) => `More actions for ${p.date}`,
    it: (p: { date: string }) => `Altre azioni per ${p.date}`,
  },
  entryAddTitle: {
    en: (p: { date: string }) => `Add entry for ${p.date}`,
    it: (p: { date: string }) => `Aggiungi registrazione per ${p.date}`,
  },
  entryEditTitle: {
    en: (p: { date: string }) => `Edit entry for ${p.date}`,
    it: (p: { date: string }) => `Modifica registrazione per ${p.date}`,
  },
  entryDayTitle: {
    en: (p: { date: string }) => `Entry for ${p.date}`,
    it: (p: { date: string }) => `Registrazione per ${p.date}`,
  },
  entryCancel: { en: 'Cancel', it: 'Annulla' },
  deleteTitle: { en: 'Delete this entry?', it: 'Eliminare questa registrazione?' },
  deleteBody: {
    en: "This removes the day's numbers.",
    it: 'Verranno rimossi i numeri del giorno.',
  },
  deleteConfirm: { en: 'Delete', it: 'Elimina' },
  deleteDeleting: { en: 'Deleting…', it: 'Eliminazione…' },
  deleteError: {
    en: "Couldn't delete. Nothing was removed. Try again.",
    it: 'Eliminazione non riuscita. Non è stato rimosso nulla. Riprova.',
  },
  historyDelete: { en: 'Delete', it: 'Elimina' },
  entryDelete: { en: 'Delete', it: 'Elimina' },
  weekTitle: { en: 'This week', it: 'Questa settimana' },
  weekRegionLabel: { en: 'This week summary', it: 'Riepilogo della settimana' },
  weekRange: {
    en: (p: { from: string; to: string }) => `${p.from} – ${p.to}`,
    it: (p: { from: string; to: string }) => `${p.from} – ${p.to}`,
  },
  weekLogged: {
    en: (p: { count: string }) => `${p.count} of 7 days logged`,
    it: (p: { count: string }) =>
      p.count === '1' ? '1 giorno su 7 registrati' : `${p.count} giorni su 7 registrati`,
  },
  weekAverage: {
    en: (p: { label: string }) => `Avg ${p.label.toLowerCase()}`,
    it: (p: { label: string }) => `${p.label} medio`,
  },
  weekNoData: { en: 'No data', it: 'Nessun dato' },
  recentHeading: { en: 'Last entries · newest first', it: 'Ultime registrazioni · dalla più recente' },
  recentEmpty: { en: 'Nothing logged yet.', it: 'Ancora nessuna registrazione.' },
  reportRangeLabel: { en: 'Report range', it: 'Intervallo del report' },
  rangeDays7: { en: '7 d', it: '7 g' },
  rangeDays30: { en: '30 d', it: '30 g' },
  rangeDays90: { en: '90 d', it: '90 g' },
  rangeYear: { en: '1 y', it: '1 a' },
  rangeAll: { en: 'All', it: 'Tutto' },
  statLastDays: {
    en: (p: { count: string }) => `last ${p.count} days`,
    it: (p: { count: string }) => `ultimi ${p.count} giorni`,
  },
  statAllTime: { en: 'all time', it: 'tutto il periodo' },
  statAverage: { en: 'Average', it: 'Media' },
  statMin: { en: 'Min', it: 'Minimo' },
  statMax: { en: 'Max', it: 'Massimo' },
  statChange: { en: 'Change', it: 'Variazione' },
  statNoData: { en: 'No data', it: 'Nessun dato' },
  reportChartNoData: { en: 'No data in this Range', it: 'Nessun dato in questo intervallo' },
  reportCombinedAriaLabel: { en: 'Weight, mood and sleep chart', it: 'Grafico di peso, umore e sonno' },
  reportEmpty: {
    en: 'No data yet. Log a day on Today and your chart appears here.',
    it: 'Ancora nessun dato. Registra un giorno in Oggi e qui comparirà il grafico.',
  },
  reportEmptyLink: { en: 'Open Today', it: 'Apri Oggi' },
  reportLoading: { en: 'Loading your days', it: 'Sto caricando i tuoi giorni' },
  reportLoadError: {
    en: 'Entries could not be loaded.',
    it: 'Non è stato possibile caricare le registrazioni.',
  },
  reportRetry: { en: 'Try again', it: 'Riprova' },
  reportShowTable: { en: 'Show data as table', it: 'Mostra i dati in tabella' },
  reportHideTable: { en: 'Hide table', it: 'Nascondi tabella' },
  reportTableDay: { en: 'Day', it: 'Giorno' },
  reportTableNoValue: { en: '—', it: '—' },
  chartFootnote: {
    en: 'Each line uses its own scale. Dashed = days without an entry.',
    it: 'Ogni linea ha la sua scala. Tratteggio = giorni senza registrazione.',
  },
  reportChartAriaLabel: {
    en: (p: { name: string }) => `${p.name} chart`,
    it: (p: { name: string }) => `Grafico di ${p.name}`,
  },
} satisfies Dictionary;

export type StringKey = keyof typeof strings;

/** The dictionary resolved for one Language: each key is its text or its function. */
export type Resolved = { [K in StringKey]: (typeof strings)[K]['en'] };
