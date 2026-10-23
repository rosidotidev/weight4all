---
title: "Weight4All — Experience"
status: final
created: 2026-10-19
updated: 2026-10-19
sources:
  - _bmad-output/planning-artifacts/prds/prd-bmad612_home-2026-10-19/prd.md
  - _bmad-output/planning-artifacts/briefs/brief-bmad612_home-2026-10-19/
---

# Weight4All — Experience Spine

Paired with `DESIGN.md` (visual identity). Terms (Entry, Day, Dimension, Gap, Dashed line, Range, Statistics, Happy effect, Missing-entry sign, Tabs, Language, Accent palette) are used as defined in the PRD Glossary. Mockups are composition references only: [Today](mockups/mock-01-today.svg), [Happy effect](mockups/mock-02-happy-effect.svg), [History](mockups/mock-03-history.svg), [Report](mockups/mock-04-report.svg), [Settings](mockups/mock-05-settings.svg), plus tablet and desktop in Responsive & Platform (overview: `mockups/index.html`). **The spines win over the mockups on conflict.** Tags: `[ASSUMPTION]` inferred, not decided by the user; `[NOTE FOR UX]` open design question.

## Foundation

Responsive web app used on phone, tablet and desktop from one address. UI system: Material Design 3 for web, light theme; M3 components, state layers and motion are inherited; this spine specifies only the behavioral delta. `DESIGN.md` is the visual reference. Single user per Account; no offline use, no notifications (PRD §5). Interface Language: English by default, Italian selectable. Dark mode: not discussed `[NOTE FOR UX]`.

## Information Architecture

Four Tabs, reachable from every signed-in screen in one tap (FR-5). Today is the landing surface after login.

| Surface | Reached from | Purpose | Journey |
|---|---|---|---|
| Login / Reset password | No session, any address (an old `/register` link also lands on Login) | Enter the app (FR-2, 3); no self sign-up, Accounts are created by the owner in the backend | Precedes UJ-1 (entry state "logged in") `[NOTE FOR UX]` not mocked, no journey of its own; Login visual spec in DESIGN.md |
| Today | Login, Tab | Log today's Entry; Missing-entry sign; on desktop also the "This week" summary card and last 5 Entries (FR-29) | UJ-1 |
| Happy effect | After Save on Today | Feedback on the change in Weight | UJ-1 |
| History | Tab | Browse all Entries, missing Days | UJ-2 |
| Entry edit (also "+ Add" for a missing Day) | History row tap, Edit, + Add | Edit or add a past Entry | UJ-2 |
| Delete confirmation | History overflow menu, Entry edit | Confirm delete | UJ-2 (edge case) |
| Report | Tab | Range, combined chart, per-Dimension charts, Statistics | UJ-3 |
| Settings | Tab | Accent palette, Language, Account, Log out | UJ-1 and UJ-3 (Language, Accent) |

Navigation pattern by window size: see Responsive & Platform. Modals stack one level deep.

### FR to surface map

| FR | Surface |
|---|---|
| FR-1 Register | Removed (2026-10-23): no surface; Accounts are created in the backend |
| FR-2 Log in, stay logged in, log out | Login screen; Settings > Account > Log out |
| FR-3 Reset password | Login screen link, Reset screen |
| FR-4 Per-Account separation | No surface (server rules; architecture) |
| FR-5 Adaptive shell | Navigation bar / rail on every surface |
| FR-6 Accent palette | Settings > Accent color |
| FR-7 Record today's Weight | Today > Weight card, Save |
| FR-8 Quick weight input | Today > Weight card (pre-filled, plus/minus) |
| FR-9 Happy effect | Happy effect |
| FR-10 Missing-entry sign | Today > banner |
| FR-11 Browse History | History |
| FR-12 Edit or add past Entry | Entry edit; History > + Add |
| FR-13 Delete | Delete confirmation |
| FR-14 Failed save never silent | Today, Entry edit, Delete confirmation (State Patterns) |
| FR-15 Mood level | Today > Mood card; Entry edit |
| FR-16 Sleep hours | Today > Sleep card; Entry edit |
| FR-17 All three values everywhere | History row; Entry edit |
| FR-18 Range | Report > range chips |
| FR-19 Combined chart | Report |
| FR-20 Per-Dimension charts | Report |
| FR-21 Statistics | Report > Statistics cards |
| FR-22 Dashed line over Gaps | Report charts; History dashed rows |
| FR-23 Sparse and empty states | Report (State Patterns) |
| FR-24 Report fits every device | Report at every window size |
| FR-25 Accessible interface | All surfaces (Accessibility Floor) |
| FR-26 Responsive verified | No surface (verification task) |
| FR-27 Performance budget | No surface (budget; History and Report must honor it) |
| FR-28 Interface Language | Settings > Language; applies everywhere |

Closure check: every FR has a surface or is explicitly non-visual (FR-4, FR-26, FR-27). Every surface has a journey except Login/Reset, flagged above rather than invented.

## Voice and Tone

Warm, encouraging, never shaming: no guilt for a gain, a missed day or low mood; no streaks; no exclamation marks except in celebration (Saved!). Short sentences, "you" implied. Microcopy below is English from the mockups; Italian is the equivalent for the second Language. `[ASSUMPTION]` All Italian wording is drafted here and needs the user's confirmation. Numbers and dates follow the Language (English 72.4 and "Sun 19 Oct"; Italian 72,4 and "dom 19 ott").

| Where | English | Italiano |
|---|---|---|
| Tabs | Today · History · Report · Settings | Oggi · Storico · Report · Impostazioni |
| Missing-entry sign title | Today isn't logged yet | Oggi non è ancora registrato |
| Missing-entry sign body | Add today's numbers whenever you're ready. | Aggiungi i numeri di oggi quando vuoi. |
| Weight card label | Weight | Peso |
| Weight hint | Last time: 72.7 kg · step 0.1 kg | Ultima volta: 72,7 kg · passo 0,1 kg |
| Mood label / tag / hint | Mood · optional · 1 sad … 10 happy | Umore · facoltativo · 1 triste … 10 felice |
| Sleep label / tag | Sleep · optional | Sonno · facoltativo |
| Save | Save | Salva |
| Effect heading | Saved! | Salvato! |
| Effect comparison | vs yesterday | rispetto a ieri |
| Effect, loss | Nice! Another step, your way. | Bene! Un altro passo, a modo tuo. |
| Effect, gain | Bodies fluctuate. Thanks for logging today. | Il corpo cambia di giorno in giorno. Grazie per aver registrato oggi. |
| Effect, logged value | 72.4 kg logged for today. | 72,4 kg registrati per oggi. |
| Effect buttons | Done · Dismiss | Fatto · Chiudi |
| History heading | Entries · newest first | Registrazioni · dalla più recente |
| Missing day row | Mon 13 Oct — no entry · + Add | lun 13 ott — nessuna registrazione · + Aggiungi |
| Swipe action | Edit | Modifica |
| Range chips | 7 d · 30 d · 90 d · 1 y · All | 7 g · 30 g · 90 g · 1 a · Tutto |
| Chart legend | Weight (kg) · Mood (1–10) · Sleep (h) | Peso (kg) · Umore (1–10) · Sonno (h) |
| Chart gap note | no entries · bridged | nessuna registrazione · collegato |
| Chart footnote | Each line uses its own scale. Dashed = days without an entry. | Ogni linea ha la sua scala. Tratteggio = giorni senza registrazione. |
| Statistics | Average · Min · Max · Change · last 30 days | Media · Min · Max · Variazione · ultimi 30 giorni |
| Settings groups | Accent color · Language · Account | Colore d'accento · Lingua · Account |
| Account | Signed in as · Log out | Accesso come · Esci |
| Settings footer | Thanks for being here. Every log counts, at your own pace. | Grazie di esserci. Ogni registrazione conta, ai tuoi tempi. |

Strings not in the mockups, all `[ASSUMPTION]` (English / Italiano):

| Where | English | Italiano |
|---|---|---|
| Effect, no earlier Entry | Welcome! Your first log is in. | Benvenuto! La tua prima registrazione è salvata. |
| Effect, comparison not yesterday | vs 14 Oct | rispetto al 14 ott |
| Failed save | Couldn't save. Your numbers are still here. Try again. | Salvataggio non riuscito. I tuoi numeri sono ancora qui. Riprova. |
| Weight missing | Add your weight to save. | Aggiungi il peso per salvare. |
| Weight out of range | Enter a weight between 20.0 and 400.0 kg. | Inserisci un peso tra 20,0 e 400,0 kg. |
| Delete confirm title / body | Delete this entry? / This removes the day's numbers. | Eliminare questa registrazione? / Verranno rimossi i numeri del giorno. |
| Delete buttons | Delete · Cancel | Elimina · Annulla |
| Empty History | Nothing here yet. Your first log starts on Today. | Ancora niente qui. La prima registrazione parte da Oggi. |
| Empty Report | No data yet. Log a day on Today and your chart appears here. | Ancora nessun dato. Registra un giorno in Oggi e qui comparirà il grafico. |
| Statistic without data | No data | Nessun dato |
| Sleep clear button (accessible name) | Clear sleep | Cancella sonno |
| This week card (desktop) | This week · 6 of 7 days logged · Avg weight · Avg mood · Avg sleep | Questa settimana · 6 giorni su 7 registrati · Peso medio · Umore medio · Sonno medio |
| Missing day, past, Entry edit title | Add entry for Mon 13 Oct | Aggiungi registrazione per lun 13 ott |

## Component Patterns

Behavioral. Visual specs live in `DESIGN.md.Components`.

| Component | Use | Behavioral rules |
|---|---|---|
| Navigation bar / rail | Every signed-in surface | Four destinations; active one shows indicator and `aria-current`; switching Tabs keeps unsaved Today input in the current session `[ASSUMPTION]`. |
| Weight card | Today, Entry edit | Pre-filled with last Weight (empty with no earlier Entry). Number is typeable; plus/minus change by 0.1 kg per tap. Accepts 20.0–400.0 kg, one decimal; decimal comma or point accepted in either Language, stored identically. |
| Mood card | Today, Entry edit | Ten faces, radio-group behavior; one tap selects, tapping the selected face clears (FR-15). Optional. Number always visible under each face. |
| Sleep card | Today, Entry edit | Slider 0–24 h, half-hour steps, live value shown ("6.0 h"). Defaults to 6.0 h; saving without touching it stores 6.0 h. An "x" clear button next to the slider empties the value (shown as an em dash); touching the slider again sets a value. Optional: a weight-only Day is still possible after clearing. In Entry edit the slider shows the stored value, or the cleared state when the Entry has no Sleep. |
| This week card | Today, desktop (expanded) only | Summary of the last 7 Days: days logged out of 7, average Weight, average Mood, average Sleep, from Real entries only; a Dimension with none reads "No data". Informational, no actions; updates after a confirmed save. Not shown on compact or medium. Realizes FR-29. |
| Save button | Today, Entry edit | Always enabled; validates on press. Disabled with progress state while the save is in flight. |
| Missing-entry banner | Today | Shown whenever today has no Entry; disappears on confirmed save; reappears if today's Entry is deleted. Informational: not dismissible, no action `[ASSUMPTION]`. |
| Happy effect | After Save on Today | Loss: celebratory card with confetti. Gain or no change: calm card, no confetti. Compares with the most recent earlier Entry, naming its date when not yesterday. Confetti plays at most 3 s. Done and Dismiss both close it `[ASSUMPTION]` and return to Today. Not shown after saving an edit of a past Day (FR-12). |
| History row | History | Newest first. Tap opens Entry edit. Swipe left reveals Edit; overflow menu offers Edit and Delete `[ASSUMPTION]`. Absent values show an em dash. |
| Missing-day row | History | Dashed row for each Day without an Entry between the first and last Entry; "+ Add" opens Entry edit for that Day. Future Days never appear (FR-12). |
| Entry edit | From History | Same cards as Today for the chosen Day; same validation; Save and Cancel; Delete is available. Presented full screen on compact, as a dialog on medium and expanded `[ASSUMPTION]`. |
| Delete confirmation | History, Entry edit | M3 dialog; destructive action named explicitly; Cancel leaves the Entry untouched and is the default focus. |
| Range chips | Report | Single select among 7 d, 30 d, 90 d, 1 y, All; default 30 d; one Range drives every chart and Statistics. Custom start and end Day (FR-18) `[NOTE FOR UX]` not designed. |
| Charts | Report | Lines solid between consecutive Real entries, dashed over Gaps, per Dimension. Marker at every Real entry. Each Dimension has its own scale in the combined chart. No tap-to-highlight in v1 (deferred). |
| Statistics card | Report | Average, Min, Max, Change per Dimension from Real entries only; Change is last minus first Real entry in the Range. |
| Accent swatches | Settings | Single select among six; applies at once; persists per Account. |
| Language segmented button | Settings | English or Italiano; applies at once, no reload, no loss of unsaved input. Segment labels stay "English" and "Italiano" in both Languages `[ASSUMPTION]`. |
| Log out | Settings | Returns to Login; no Entry data reachable afterwards. |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Loading | Today, History, Report | M3-style skeleton cards in `{colors.surface-container}` matching the layout; Today shows its form as soon as the last Weight is known; no spinner-only screens `[ASSUMPTION]`. |
| First use, no earlier Entry | Today | Weight field empty; Happy effect shows the welcome message instead of a comparison. |
| Missing today | Today | Missing-entry banner on top (FR-10). No email or push reminder. |
| Missing Day | History | Dashed row with + Add. Report: Gap bridged by a Dashed line; History and chart update at once once the Entry is saved. |
| Weight-only Entry | Today, Edit, History | Saves normally (Sleep is empty only if the user cleared it with the "x"; an untouched slider saves 6.0 h). History shows an em dash for mood and sleep, never 0. Report draws a Dashed line over that Day on the missing Dimensions only. |
| Validation | Today, Edit | Inline message under the field and focus moved to it; announced to screen readers. |
| Failed save or delete | Today, Entry edit, Delete confirmation | Message in a snackbar plus inline; every typed value stays; Save remains available to retry; nothing is shown as saved without server confirmation (FR-14). |
| Failed load | History, Report | Inline message with Retry; previously shown data stays if present. |
| Empty History | History | Friendly message pointing to Today. |
| Empty Report | Report | Friendly message pointing to Today, no empty axes (FR-23). |
| Sparse Report | Report | One Real entry in the Range: the point and its Statistics show without error. A Dimension with none: its Statistics read "No data", not zero. |

## Interaction Primitives

- **Weight:** plus and minus buttons change by 0.1 kg per tap or Enter/Space; the number is also typeable; arrow Up/Down in the field step by 0.1 kg `[ASSUMPTION]`.
- **Mood:** tap a face to select, tap the selected face again to clear. Keyboard: arrow keys move, Space toggles.
- **Sleep:** drag or arrow keys, half-hour steps from 0 to 24. The slider starts at 6.0 h; saving without touching it stores 6.0 h. The "x" clear button next to the slider empties the value (Enter/Space on keyboard); the Day then saves without Sleep, so a weight-only Day stays possible.
- **Edit:** tap the row, swipe left on the row, or overflow menu > Edit. Desktop uses click and the overflow menu; swipe is a touch shortcut, never the only path.
- **Delete:** overflow menu > Delete, or Delete in Entry edit; always behind a confirmation dialog.
- **Range:** tap a chip; selection persists while the Report stays open and through rotation or window resize (FR-24).
- **Language and Accent:** tap to apply immediately.
- **Banned:** streaks, badge counts, push or email reminders, guilt copy, auto-dismissing error messages.

## Accessibility Floor

Behavioral target: WCAG 2.1 AA (FR-25). Visual contrast lives in `DESIGN.md`.

- **Keyboard:** every function reachable and operable without a pointer; logical Tab order; visible M3 focus ring on every control; Esc closes dialogs and the Happy effect.
- **Focus management:** after Save, focus moves to Done in the Happy effect and returns to Today on close; dialogs trap focus and restore it on close; validation errors move focus to the first invalid field.
- **Labels:** every field and icon button has an accessible name ("Decrease weight by 0.1 kg", "Increase weight by 0.1 kg"). Mood faces expose "Mood 7 of 10" and selected state; slider exposes value text ("7.5 hours"); the clear button is named "Clear sleep" and a cleared slider reads "No sleep value" `[ASSUMPTION]`. Errors and "Saved" use a polite live region.
- **Not color alone:** mood faces carry numbers; chart lines carry markers (circle weight, square mood, triangle sleep) and dashes for Gaps; selected chip and segment carry a check mark, selected swatch a check.
- **Charts as text:** each chart has a "Show data as table" control `[ASSUMPTION]` listing Days and values; Statistics are already text.
- **Reduced motion:** with `prefers-reduced-motion`, no confetti motion: show the loss card static; other transitions use no movement.
- **Language:** the `lang` attribute of the page follows the selected Language (`en` or `it`) and updates on switch.
- **Targets:** at least 44 x 44 px on phones, including plus/minus, faces, chips, overflow dots and swatches.
- **Zoom and text:** layout reflows at 200% zoom without horizontal page scroll; Italian strings must not truncate controls.

## Responsive & Platform

Uses M3 window size classes. Tablet and desktop were mocked and approved.

| Window class | Width | Navigation | Layout |
|---|---|---|---|
| Compact | under 600 px | Bottom navigation bar ([phone mockups](mockups/mock-01-today.svg)) | Single column, 16 px margins, full-width cards |
| Medium | 600–839 px | Navigation rail at the left ([Today](mockups/tablet-01-today.svg), [Report](mockups/tablet-02-report.svg)) | Weight and Sleep cards side by side, Mood on one row of ten faces; Entry edit as dialog |
| Expanded | 840 px and up | Labeled side drawer, always visible ([Today](mockups/desktop-01-today.svg), [Report](mockups/desktop-02-report.svg)) | Today: centered 600 px form column plus a right column; Report: wide layout |

What the mockups show:

- **Tablet Today** ([tablet-01-today.svg](mockups/tablet-01-today.svg)): navigation rail at the left with the four destinations (Today active), Missing-entry banner on top, Weight and Sleep cards side by side, Mood as one row of ten faces, Save, and a "Last entries" list below.
- **Tablet Report** ([tablet-02-report.svg](mockups/tablet-02-report.svg)): rail with Report active, range chips, a large combined chart, three Statistics cards in a row, and three per-Dimension mini charts, each with its own axis and unit.
- **Desktop Today** ([desktop-01-today.svg](mockups/desktop-01-today.svg)): labeled side drawer with Today active, top app bar with the date, a centered 600 px form column (banner, Weight, Mood, Sleep, Save) and a right column with the "This week" card (see Component Patterns) and the last 5 Entries.
- **Desktop Report** ([desktop-02-report.svg](mockups/desktop-02-report.svg)): drawer with Report active, range chips, the large combined chart on the left (about two thirds), the three Statistics cards stacked on the right (about one third), and the three per-Dimension charts in a row below.
- **Report layout:** medium and up, range chips sit above everything, then the combined chart with Statistics cards, then the three per-Dimension charts. On compact, everything stacks: chips, combined chart, per-Dimension charts, then Statistics ([phone Report](mockups/mock-04-report.svg)).

Rules:

- The Sleep clear "x" button appears on every window class, next to the slider.
- Between mocked widths the layout follows the nearest window class; breakpoints are the M3 values above `[ASSUMPTION]`.
- No horizontal page scroll from 360 px; checked at 360, 768 and 1280 px (FR-24).
- Changing orientation or window size keeps the selected Range and unsaved input.
- Hover states and the overflow menu are first-class on desktop; swipe is touch only.

## Key Flows

### UJ-1. Bob logs his day in under 30 seconds

Bob, just awake, phone in hand. Compact window, logged in from an earlier session.

1. Bob opens the app; it lands on Today. The Missing-entry banner reads "Today isn't logged yet".
2. The Weight card shows his last Weight; he taps plus or minus until it reads 72.4 kg.
3. He taps the face that fits (7).
4. He drags Sleep to 7.5 h.
5. He taps Save.
6. **Climax:** the Happy effect shows "−0.3 kg vs yesterday" with confetti and "Nice! Another step, your way."
7. He taps Done; Today is back, the banner is gone, the Entry is saved and editable later.

Edge case: in a hurry he sets only Weight and taps Save. The Entry saves, mood stays empty (a dash in History) and Sleep stores the default 6.0 h unless he taps the "x" to clear it first; both can be changed later.

Failure: with no network, the error appears and every value stays; he retries.

### UJ-2. Bob repairs a forgotten day

Bob, evening, remembers he skipped yesterday. Logged in, History tab.

1. He opens History; the list is newest first.
2. A dashed row reads "no entry" for yesterday with + Add.
3. He taps + Add; Entry edit opens for that Day.
4. He enters Weight, Mood and Sleep and taps Save. No Happy effect is shown for a past Day.
5. **Climax:** yesterday appears as a normal row in History, and on the Report the Dashed line over that Day is now solid. No guilt message anywhere.

Edge case: a wrong Weight in an old Entry. He swipes the row (or uses the overflow menu), edits it; or deletes the Entry after the confirmation, and the Day shows again as missing.

### UJ-3. Bob looks for patterns on his laptop

Bob, three weeks in, at a desktop (expanded window, labeled drawer). Logged in.

1. He opens Report; the default Range is 30 d.
2. He reads the combined chart: large, with the Statistics cards beside it.
3. He taps the 90 d chip; all charts and Statistics update together.
4. He scrolls to the Sleep chart and its Statistics.
5. **Climax:** on the combined chart he sees low-mood days follow short nights. The app itself states no correlation.
6. He closes the app; the same Report is readable on his phone.

Edge case: a week without logging is bridged by a Dashed line and the Statistics ignore it.
