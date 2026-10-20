---
status: final
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-bmad612_home-2026-10-19/prd.md
  - _bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/EXPERIENCE.md
  - _bmad-output/planning-artifacts/architecture/architecture-bmad612_home-2026-10-19/ARCHITECTURE-SPINE.md
---

# Weight4All - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Weight4All, decomposing the requirements from the PRD, the UX design contract (`DESIGN.md` + `EXPERIENCE.md`) and the architecture spine into implementable stories. Requirement ids follow the PRD (`FR-n`, `NFR-n`); architecture decisions are cited as `AD-n` from the spine. Stories are sized for one dev session and depend only on earlier stories.

## Requirements Inventory

### Functional Requirements

- FR-1: A visitor can register an Account with email and password; invalid or duplicate emails and too-short passwords are rejected with a clear message.
- FR-2: An Account owner can log in, stay logged in across browser restarts, and log out; without a session only the login screen is shown and no Entry data loads.
- FR-3: An Account owner can request a password-reset email; the response never reveals whether an address is registered.
- FR-4: Each Account can read and write only its own Entries, enforced by server-side rules; unauthenticated requests cannot read or write.
- FR-5: The signed-in app shows four Tabs (Today, History, Report, Settings), reachable in one tap, and adapts to phone, tablet and desktop with no horizontal scroll from 360 px.
- FR-6: An Account owner can choose an accent from a fixed set of six in Settings; it persists across sessions and devices; Dimension chart colors stay independent.
- FR-7: An Account owner can save an Entry for today with a required Weight (20.0 to 400.0 kg, one decimal); saving again updates the same Entry.
- FR-8: The Weight field starts from the last Weight and has plus/minus buttons changing it by 0.1 kg; it is also typeable.
- FR-9: After a save, the app shows the Weight change against the previous Entry with a happy, never shaming effect (celebratory on loss, calm otherwise; welcome message with no earlier Entry; dismissible, under 3 s; respects reduced motion).
- FR-10: When today has no Entry the Today tab shows the Missing-entry sign; it disappears once today is saved and reappears if that Entry is deleted; no email or push.
- FR-11: The History tab lists all Entries newest first, shows missing Days between the first and last Entry as openable rows, and stays usable with 365 rows.
- FR-12: An Account owner can edit any Entry and create an Entry for any past Day (never a future Day); no Happy effect for past Days.
- FR-13: An Account owner can delete an Entry after an explicit confirmation; cancelling leaves it untouched.
- FR-14: A failed save or delete is never silent: an error is shown, typed values stay, and nothing is shown as saved without server confirmation.
- FR-15: An Account owner can optionally set a Mood level 1 to 10 by tapping an emoji face; tapping the selected face clears it.
- FR-16: An Account owner can optionally set Sleep hours from 0 to 24 in half-hour steps.
- FR-17: History rows and the edit screen show and edit all three values; absent values show as absent, never zero; Weight cannot be cleared.
- FR-18: An Account owner can select the Report Range (7 d, 30 d, 90 d, 1 y, all time; custom start and end deferred); one Range drives every chart and the Statistics; default 30 days.
- FR-19: The Report shows one combined chart of Weight, Mood and Sleep, each readable despite different units.
- FR-20: The Report shows one chart per Dimension with a labeled value axis; charts are generated from the Dimension list.
- FR-21: The Report shows average, minimum, maximum and change per Dimension from Real entries only.
- FR-22: On every chart a Gap between two Real entries is bridged by a Dashed line; a missing single Dimension dashes only that line.
- FR-23: The Report explains itself with no Entries (friendly message) and with a single Real entry (point and Statistics without error).
- FR-24: The Report adapts to 360, 768 and 1280 px; orientation or window changes keep the selected Range.
- FR-25: The whole app meets WCAG 2.1 AA (keyboard, contrast in every accent, page language, labels, announced errors, 44 px targets, not color alone, text alternatives for charts, reduced motion).
- FR-26: The layout is verified on phone, tablet and desktop in the latest two versions of Chrome, Edge, Firefox and Safari, in both Languages.
- FR-27: Performance budget: Today interactive within 3 s on a mid-range phone; with 365 Entries a Range switch updates within 1 s and History scrolls without jank.
- FR-28: An Account owner can use the app in Italian or English and switch in Settings immediately with no reload; English by default; dates and numbers follow the Language; entries are language independent.
- FR-29: On wide screens the Today tab shows a "This week" summary of the last 7 Days (days logged and averages per Dimension from Real entries only, "No data" when none).

### NonFunctional Requirements

- NFR-1: Security and privacy: HTTPS only; every data access requires authentication and is limited to the owning Account; Entries are personal health data.
- NFR-2: Extensible data model: a new Dimension is an optional field with no migration; Report charts and Statistics derive from the Dimension list.
- NFR-3: Time handling: a Day is the device-local calendar date; "today" and the Missing-entry sign follow it.
- NFR-4: Hosting and availability: stable web address on Firebase infrastructure; best effort availability.
- NFR-5: Data durability: a saved Entry is not lost by a later save of a different Day.
- NFR-6 (F0): Authentication and data separation are enforced server side (security rules), not only in the interface.
- NFR-7 (F1): The Today tab is usable within the 30-second target (SM-1); Weight is the only required field.
- NFR-8 (F3): A year of daily Entries renders in the Report without a visible freeze.

### Additional Requirements

From the architecture spine:

- Starter: no starter template. The project is created with the Angular 22.2.3 CLI (standalone, signals, OnPush); the repository is put under version control at scaffold time (AD-11).
- Pinned stack per the spine Stack table (Angular and Material 22.2.3, TypeScript ~6.0.3, firebase 12.19.0, chart.js 4.5.1, ng2-charts 11.0.0, Vitest 5.0.5, Playwright 1.64.1, firebase-tools 15.34.0, rules-unit-testing 5.0.2, JDK 21+); `@angular/fire` is not used.
- AD-1 / AD-13: only `core/data` imports `firebase/*` or `@firebase/*`; an allowed-imports table is enforced by ESLint; `npm run check` (ESLint + unit tests + rules tests) is the single gate and runs before every deploy.
- AD-2: Entry domain type in display units; Firestore document `users/{uid}/entries/{YYYY-MM-DD}` with flat fields `weight`, `mood`, `sleep`, `updatedAt`; full-document writes (`setDoc` without merge); absent value means absent field.
- AD-3: one Dimension registry (`key` equals Firestore field; `input`, `clearable`, `decimals`, `defaultValue`, chart token and marker); `PRIMARY` for Weight-only behavior.
- AD-4: one `domain/day.ts` for day keys, ranges and date formatting; `ClockService` exposes the `today` signal; Ranges end today; `1y` is 365 days; `all` starts at the first Entry.
- AD-5: `EntryStore` loads all Entries once, derives everything in memory, mutates only through `save`/`remove` with a closed error set, 10 s write timeout, `getDocFromServer` re-read after timeout, `sessionEpoch` tagging, last write wins.
- AD-6: gaps are `null` values; `bridgedFromPrev` on the segment-ending point; one `chartDataset` helper; combined chart uses three independent y axes; unit test of `p0/p1DataIndex`.
- AD-7: one typed `strings.ts` (IT and EN keys both required); Language signal owned by `PreferencesStore`; no literal UI text in templates or snackbars; Material built-in labels via `*Intl` providers.
- AD-8: `firestore.rules` for `entries` and `preferences/app` only, with id format, key set, `is number` ranges, tolerance step checks, preferences enums; emulator tests with shared integer and decimal vectors.
- AD-9: tri-state session, one route guard, `SessionScope` resets all stores on every session change and bumps `sessionEpoch`; closed set of auth error codes.
- AD-10: Angular Material M3 theme with tokens, six accent seeds, runtime accent class, AA contrast unit test per accent, Dimension chart colors independent of accent, preferences saved as a full document with rollback on error.
- AD-11: two environments (local on the Firebase Emulator Suite, prod); Firestore in `eur3`; email-enumeration protection enabled; `npm run deploy` runs the check, then rules, then Hosting; manual rollback via Hosting history.
- AD-12: one `EntryFormComponent` and `DraftStore`; draft built only when `EntryStore` is `ready`, with per-field `untouched | value | cleared`; Sleep default 6.0 h for any Day without an Entry; Happy effect after any confirmed save of today's Entry.
- AD-14: one `domain/number.ts` parses, steps and formats; Weight with more than one decimal is rejected; integer tenths and half-hours stay internal.
- AD-15: accessibility floor (`<html lang>`, reduced motion, focus to first error, `aria-live` region, 44 px targets, `aria-current`, axe in Playwright).
- PRD amendments (recorded in the spine, Deferred; applied to the PRD with `/bmad-prd update` before sprint planning): Sleep defaults to 6.0 h (conflicts with FR-16/FR-17/UJ-1 wording) and custom Range is deferred (FR-18).

### UX Design Requirements

- UX-DR1: Material Design 3 for web, light theme, tokens from `DESIGN.md`: colors, typography, spacing (including the six accent swatches and the amber Missing-entry sign color).
- UX-DR2: Window size classes: compact under 600 px with bottom navigation bar; medium 600 to 839 px with navigation rail; expanded 840 px and up with a labeled side drawer.
- UX-DR3: Login, Register and Reset-password screens (not mocked): email and password fields, inline errors, links between them, warm tone.
- UX-DR4: Today surface: Missing-entry banner (amber, informational, not dismissible), Weight card, Mood card, Sleep card, Save button always enabled and disabled with progress while saving.
- UX-DR5: Weight card: pre-filled with the last Weight, typeable, plus/minus 0.1 kg, Up/Down arrow keys step 0.1, hint text with last value and step.
- UX-DR6: Mood card: ten faces as a radio group, number visible under each, tap again to clear, accessible name "Mood 7 of 10", on medium and up one row of ten.
- UX-DR7: Sleep card: slider 0 to 24 h in half-hour steps, live value, starts at 6.0 h, "x" clear button on every window class, cleared state shows an em dash, accessible value text.
- UX-DR8: Happy effect: celebratory card with confetti (at most 3 s) on a loss; calm card without confetti on a gain or no change; welcome message with no earlier Entry; comparison date named when not yesterday; Done and Dismiss both close; focus to Done, then back to Today; static card under reduced motion.
- UX-DR9: History: newest-first rows, em dash for absent values, swipe-left Edit on touch, overflow menu Edit and Delete, dashed Missing-day rows with "+ Add", empty state.
- UX-DR10: Entry edit: same cards as Today for the chosen Day, Save, Cancel and Delete; full screen on compact, dialog on medium and expanded; title "Add entry for Mon 13 Oct" for a missing Day.
- UX-DR11: Delete confirmation dialog: destructive action named, Cancel is the default focus, focus trapped and restored.
- UX-DR12: Report surface: Range chips (single select, check mark), combined chart, three Statistics cards, three per-Dimension charts, "each line uses its own scale / dashed = days without an entry" footnote; layout per window class (compact stacked; medium and expanded combined chart with Statistics beside it, then three charts in a row).
- UX-DR13: Charts: Dimension colors and markers (weight blue circle, mood orange square, sleep teal triangle), solid over Real entries, dashed over Gaps, a marker at every Real entry, "Show data as table" control per chart.
- UX-DR14: Settings: Accent swatches (single select with check, applied at once), Language segmented button (English / Italiano, labels fixed), Account (signed-in email, Log out), warm footer.
- UX-DR15: State patterns: skeleton loading cards, first use, validation inline with focus moved, failed save in a snackbar plus inline, failed load with Retry, empty History, empty and sparse Report; no auto-dismissing error messages.
- UX-DR16: Voice: all product text exists in English and Italian with the same warm tone; no streaks, badge counts, guilt copy or exclamation marks except "Saved!".
- UX-DR17: Desktop "This week" card and last-5-Entries list in the right column of Today; absent on compact and medium.
- UX-DR18: Accessibility floor from `EXPERIENCE.md`: keyboard operation and visible focus ring, accessible names, polite live region, not color alone, reduced motion, 44 px targets, 200% zoom reflow, Italian strings never truncate controls.
- UX-DR19: Interaction primitives: swipe is a shortcut never the only path; hover states and overflow menu are first-class on desktop; Range, unsaved input and orientation survive window changes.

### FR Coverage Map

FR-1: Epic 1 - Register
FR-2: Epic 1 - Log in, stay logged in, log out
FR-3: Epic 1 - Reset password
FR-4: Epic 1 - Per-Account data separation (security rules)
FR-5: Epic 1 - Adaptive shell with four Tabs
FR-6: Epic 1 - Accent palette
FR-7: Epic 2 - Record today's Weight
FR-8: Epic 2 - Quick weight input
FR-9: Epic 2 - Happy effect
FR-10: Epic 2 - Missing-entry sign
FR-11: Epic 2 - Browse History
FR-12: Epic 2 - Edit or add a past Entry
FR-13: Epic 2 - Delete an Entry
FR-14: Epic 2 - Failed save is never silent
FR-15: Epic 3 - Mood level
FR-16: Epic 3 - Sleep hours
FR-17: Epic 3 - All three values everywhere
FR-18: Epic 4 - Range selection
FR-19: Epic 4 - Combined chart
FR-20: Epic 4 - Per-Dimension charts
FR-21: Epic 4 - Statistics
FR-22: Epic 4 - Dashed line over Gaps
FR-23: Epic 4 - Sparse and empty states
FR-24: Epic 4 - Report fits every device
FR-25: Epic 5 - Accessible interface (floor built in earlier epics, audited here)
FR-26: Epic 5 - Responsive layout verified
FR-27: Epic 5 - Performance budget
FR-28: Epic 1 - Interface Language
FR-29: Epic 2 - "This week" summary (Weight in Epic 2; Mood and Sleep appear in Epic 3 through the registry)

## Epic List

### Epic 1: Foundations and adaptive shell

Bob can create an Account, sign in and stay signed in, reset a forgotten password, move between the four Tabs on any screen size, and choose the Language and the accent color, all on a project that enforces the architecture rules from the first commit.

**FRs covered:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-28

### Epic 2: Daily weight entry

Bob can log today's Weight in seconds, get a warm response, see when today is missing, browse his history, and correct, add or delete any day.

**FRs covered:** FR-7, FR-8, FR-9, FR-10, FR-11, FR-12, FR-13, FR-14, FR-29

### Epic 3: Emotional level and sleep hours

Bob can add Mood and Sleep to the same entry in one tap and one slide, and see and edit all three values everywhere an Entry appears.

**FRs covered:** FR-15, FR-16, FR-17

### Epic 4: Report tab with charts

Bob can pick a Range and see how Weight, Mood and Sleep move together and apart, with Statistics and dashed lines over days without data, on any device.

**FRs covered:** FR-18, FR-19, FR-20, FR-21, FR-22, FR-23, FR-24

### Epic 5: Polish and quality

Everyone can use the app: it meets WCAG 2.1 AA, is verified on three screen sizes and four browsers in both Languages, meets the performance budget, passes the three key journeys end to end, and can be released safely.

**FRs covered:** FR-25, FR-26, FR-27

## Epic 1: Foundations and adaptive shell

Bob can create an Account, sign in and stay signed in, reset a forgotten password, move between the four Tabs on any screen size, and choose the Language and the accent color, on a project that enforces the architecture rules from the first commit.

### Story 1.1: Create the Angular project with the quality gate

As Bob, the builder,
I want a new Angular 22 project with the pinned stack and the architecture checks wired in,
So that every later story starts from a base that already enforces the rules.

**Acceptance Criteria:**

**Given** an empty project folder and Node 24.15 or newer
**When** the project is created with the Angular 22.2.3 CLI (standalone, signals, OnPush, strict TypeScript ~6.0.3) and the stack versions in the spine are installed
**Then** `ng build` and `ng test` (Vitest with jsdom) run successfully
**And** the repository is under version control with a `.gitignore`.

**Given** the allowed-imports table in the spine
**When** ESLint runs
**Then** an import of `firebase/*` or `@firebase/*` outside `src/app/core/data`, an import that violates the layer table, `new Date`, `Date.now`, `Date.parse` or `Intl.DateTimeFormat` outside `domain/day.ts` and `ClockService`, a use of `toFixed`, `toLocaleString` or `Intl.NumberFormat` outside `domain/number.ts`, and an Angular or DOM import inside `domain` each fail the lint
**And** a sample violation committed in a test fixture proves each rule fires.

**Given** the folder layout in the spine
**When** the project is opened
**Then** `src/app/{features,shell,domain,core/state,core/data,shared}` and `src/environments`, `tests/rules`, `e2e` exist with placeholders only where needed.

**Given** the scripts in `package.json`
**When** `npm run check` is executed
**Then** it runs ESLint, the unit tests and the rules tests and exits non-zero on any failure
**And** `npm run deploy` runs `check` first and stops on failure.

### Story 1.2: Connect to Firebase and protect each Account's data

As Bob,
I want each Account's data protected by server-side rules and a safe local environment,
So that my entries are private and I never test against real data (FR-4, NFR-1, NFR-6).

**Acceptance Criteria:**

**Given** the Firebase Emulator Suite (Auth and Firestore) and JDK 21
**When** `firebase emulators:start` runs and the app environment is `local`
**Then** `core/data/firebase.ts` connects to the emulators; the `prod` environment file holds the real project config and no emulator connection
**And** Firebase config exists only under `src/environments/`.

**Given** `firestore.rules` for `users/{uid}/entries/{id}` and `users/{uid}/preferences/app`
**When** the rules tests run in the emulator
**Then** an authenticated user can read and write only their own paths, another user's path is denied, an unauthenticated request is denied, and every other path is denied.

**Given** an `entries` write
**When** the rules evaluate it
**Then** the id must match `YYYY-MM-DD`, keys must be a subset of `weight, mood, sleep, updatedAt` with `weight` present and `updatedAt` equal to the request time, and each number must satisfy `is number` with its range and step (with tolerance)
**And** shared test vectors cover integer (72) and decimal (72.5) values for Weight and Sleep, integer Mood, and invalid values for each.

**Given** a `preferences/app` write
**When** `accent` is not one of the six palette ids or `language` is not `it` or `en`
**Then** the write is denied.

### Story 1.3: Show the app in English or Italian from one typed dictionary

As Bob,
I want every text of the app to exist in English and Italian and switch at once,
So that the app speaks my language and no text is missed (FR-28 mechanism, AD-7).

**Acceptance Criteria:**

**Given** `shared/strings.ts` typed so each key has both `it` and `en`
**When** a key lacks one of them
**Then** compilation fails.

**Given** the voice rules (UX-DR16: warm, never shaming, no streaks or guilt copy, "Saved!" the only exclamation)
**When** any text is added to `strings.ts`
**Then** it exists in both Languages with the same tone.

**Given** the Language signal
**When** no choice has been made, including on the login screen
**Then** the Language is English, the page `<html lang>` is `en`, and the Material built-in labels (via the `*Intl` providers) are English.

**Given** the Language changes to Italian
**When** any screen is showing
**Then** all texts, labels, messages and the `<html lang>` change at once without a reload and without losing typed input.

**Given** a test that scans templates
**When** a template contains literal user-visible text
**Then** the test fails; attribute values such as class, id, role and `strings.ts` keys are ignored.

### Story 1.4: Set up the Material 3 theme and design tokens

As Bob,
I want the Material Design 3 theme and the design tokens in place before any screen is built,
So that every screen from login onwards is styled from tokens, never from color literals (UX-DR1, AD-10).

**Acceptance Criteria:**

**Given** Angular Material 22 with an M3 light theme
**When** the app builds
**Then** colors, typography, spacing, shapes and the amber Missing-entry color come from the tokens in `DESIGN.md` and no component uses a color literal.

**Given** the default accent (violet `#5A46D6`)
**When** the app starts
**Then** the theme is applied through a theme class derived from its seed color, ready for the other five accents to be added in Story 1.10.

**Given** the Dimension chart colors (weight blue, mood orange, sleep teal) and their markers
**When** the tokens are defined
**Then** they are a separate token set, independent of the accent, resolvable as CSS custom properties.

**Given** the base look
**When** a sample screen is rendered at 360, 768 and 1280 px
**Then** cards, buttons and inputs follow the shapes and spacing of `DESIGN.md` and touch targets are at least 44 by 44 px (theme density token).

### Story 1.5: Register with email and password

As a visitor,
I want to create an Account with my email and a password,
So that my entries are mine (FR-1, UX-DR3).

**Acceptance Criteria:**

**Given** the Register screen with the warm tone in both Languages
**When** a valid, unused email and a password meeting the Firebase minimum are submitted
**Then** an Account is created and the user is signed in and lands on a placeholder `/today` route.

**Given** an email already in use, an invalid email or a too-short password
**When** the form is submitted
**Then** a clear message from `strings.ts` is shown inline, focus moves to the first invalid field, the message is announced politely, and no Account is created.

**Given** `AuthService`
**When** any auth call fails
**Then** it returns an `auth-error(code)` with code in `invalid-credentials | email-in-use | weak-password | invalid-email | network | unknown` and no raw Firebase text is shown.

**Given** the emulator
**When** the register flow is tested
**Then** unit tests cover success and each error code.

### Story 1.6: Log in, stay logged in and log out

As Bob,
I want to sign in once and stay signed in until I log out,
So that opening the app lands me on Today without friction (FR-2, UX-DR3).

**Acceptance Criteria:**

**Given** the tri-state session (`unknown`, `signedOut`, `signedIn(uid)`) and one route guard
**When** the app starts with no session
**Then** every address except login, register and reset shows only the login screen and no Entry data is loaded.

**Given** a valid login
**When** the user signs in
**Then** they land on `/today`; reopening the app in the same browser does not ask for credentials until logout, and a reload does not flash the login screen while the session is `unknown`.

**Given** `SessionScope`
**When** the session changes in any way (login, logout, one user replaced by another)
**Then** it increments `sessionEpoch`, resets every store signal to empty (and the draft store as soon as it exists, from Story 2.2), and loads stores only when `signedIn`.

**Given** logout from Settings > Account (placeholder button until Story 1.9)
**When** the user logs out
**Then** they return to login and back navigation shows no Entry data.

**Given** wrong credentials
**When** login is submitted
**Then** an inline message is shown without revealing which part was wrong.

### Story 1.7: Reset a forgotten password

As Bob,
I want to request a password-reset email from the login screen,
So that I am never locked out of my own data (FR-3, UX-DR3).

**Acceptance Criteria:**

**Given** the login screen link and the Reset screen
**When** an email address is submitted
**Then** the same neutral confirmation is shown whether or not the address is registered, and a reset email is sent for a registered address.

**Given** the Firebase Authentication settings
**When** the project is configured
**Then** email-enumeration protection is enabled (recorded in the release checklist of Story 5.6).

**Given** an invalid email format
**When** submitted
**Then** an inline message is shown and nothing is sent.

### Story 1.8: Move between four Tabs on any screen size

As Bob,
I want the four Tabs reachable in one tap, laid out for my screen,
So that the app feels native on phone, tablet and desktop (FR-5, UX-DR2).

**Acceptance Criteria:**

**Given** `LayoutService` exposing one `windowClass` signal (compact under 600 px, medium 600 to 839 px, expanded 840 px and up)
**When** the window is resized or rotated
**Then** compact shows a bottom navigation bar, medium a navigation rail, expanded a labeled side drawer, and no component measures the window itself.

**Given** the shell route table (`/today`, `/history`, `/history/:dayKey`, `/report`, `/settings`)
**When** the user taps a Tab
**Then** the destination opens in one tap, the active one shows an indicator and `aria-current`, and Today is the landing surface after login.

**Given** each Tab has placeholder content
**When** the app is viewed at 360 px
**Then** no horizontal page scrolling is needed.

**Given** the Tab labels
**When** the Language changes
**Then** they read Today, History, Report, Settings or Oggi, Storico, Report, Impostazioni.

### Story 1.9: Choose the Language in Settings and keep it for my Account

As Bob,
I want to pick English or Italian in Settings and have it remembered on all my devices,
So that the app always opens in my language (FR-28, UX-DR14, UX-DR16).

**Acceptance Criteria:**

**Given** the Settings tab with a segmented button "English" / "Italiano" (labels fixed in both Languages)
**When** a Language is chosen
**Then** it applies at once, is saved to `users/{uid}/preferences/app` as a full document, and `PreferencesStore` owns the Language signal.

**Given** the save fails
**When** the user chooses a Language
**Then** the choice is rolled back with a visible error and a late load never overwrites a choice made after it started.

**Given** a returning user
**When** the app starts
**Then** the last Language is shown from a local cache before preferences load, avoiding a flash of the wrong Language, and then confirmed from the Account.

**Given** the Language is Italian
**When** numbers and dates are shown
**Then** they follow Italian formats (decimal comma, "dom 19 ott") and switching Language never changes stored data.

**Given** Settings > Account
**When** the screen is shown
**Then** it displays "Signed in as" the email and a working Log out button.

### Story 1.10: Choose an accent color

As Bob,
I want to choose one of six accent colors,
So that the app feels like mine (FR-6, UX-DR1, UX-DR14).

**Acceptance Criteria:**

**Given** the Settings tab with six accent swatches (single select, check mark on the selected)
**When** a swatch is tapped
**Then** the accent applies at once through a theme class derived from its seed color, is saved to `preferences/app`, and persists across sessions and devices.

**Given** the six accent seeds and the M3 token pairs for text and essential graphics
**When** the unit test runs
**Then** contrast is at least 4.5 to 1 for text and 3 to 1 for graphics for every accent, or the build fails.

**Given** the theme and tokens created in Story 1.4
**When** an accent is added
**Then** it only adds a seed color and its derived theme class, with no change to component styles and no color literals.

**Given** the Dimension chart colors (weight blue, mood orange, sleep teal)
**When** the accent changes
**Then** the chart tokens do not change.

**Given** the save fails
**When** an accent is chosen
**Then** the choice rolls back with a visible error.

## Epic 2: Daily weight entry

Bob can log today's Weight in seconds, get a warm response, see when today is missing, browse his history, and correct, add or delete any day.

### Story 2.1: Load the Entries into the app

As Bob,
I want my Entries loaded once and kept in memory with a clear status,
So that every screen reads the same data and never shows unsaved values as saved (FR-7 foundations, NFR-3, NFR-5, AD-2, AD-3, AD-4, AD-5).

**Acceptance Criteria:**

**Given** `domain/day.ts` (`dayKey`, `parseDayKey`, `addDays`, `enumerateDays`, `resolveRange`, `formatDay`), `ClockService` (the `today` signal), `domain/entry.ts` and a registry with Weight only (`domain/dimensions.ts`, `PRIMARY`)
**When** the unit tests run
**Then** they cover `day.ts`, including the local date near midnight and no use of `new Date('YYYY-MM-DD')`, and the registry and `Entry` shapes.

**Given** `EntryStore` with `status` (`loading | ready | error`)
**When** the app starts signed in
**Then** it loads all of the user's Entries once into a signal keyed by day, tagged with `sessionEpoch`, and the Today tab shows a skeleton card layout until `ready` (UX-DR15 loading state).

**Given** `EntryStore.save` and `remove`
**When** they are called
**Then** they return `ok` or `error(code)` from the closed set, write the full document `users/{uid}/entries/{YYYY-MM-DD}` (`setDoc` without merge), and update the in-memory signal only after Firestore confirms.

**Given** a failed load
**When** the store is in `error`
**Then** the Today tab shows an inline message with Retry.

### Story 2.2: Save today's Weight

As Bob,
I want to enter my Weight on Today and save it,
So that today's number exists (FR-7, NFR-3, NFR-5, AD-12).

**Acceptance Criteria:**

**Given** `shared/EntryFormComponent`, `DraftStore` (in `core/state`) and the pure `initialDraft(day, entries, lastEntry)` in `domain/entry.ts`
**When** the Today tab opens and `EntryStore` is `ready`
**Then** the form shows the Weight card built from the draft, one draft per Day with per-field state `untouched | value | cleared`, and typed values survive a Tab switch.

**Given** the session changes
**When** `SessionScope` resets the stores
**Then** `DraftStore` is reset too.

**Given** the Today tab with a Weight card
**When** Weight is empty and Save is pressed
**Then** saving is blocked with "Add your weight to save." (or Italian) inline, focus moves to the field and it is announced.

**Given** a Weight outside 20.0 to 400.0 or with more than one decimal
**When** Save is pressed
**Then** the value is rejected with the range message and not rounded.

**Given** a valid Weight
**When** Save is pressed
**Then** `EntryStore.save` writes the full document `users/{uid}/entries/{todayKey}`, the Save button shows progress while in flight, and the Entry appears in memory only after Firestore confirms.

**Given** an Entry for today already exists
**When** Weight is saved again
**Then** the same document is replaced and no second Entry exists for that Day.

**Given** a save for Day A and later a save for Day B
**When** both are confirmed
**Then** Day A's Entry is unchanged (NFR-5).

### Story 2.3: Never lose typed values when a save fails

As Bob,
I want a clear message and my typed numbers kept when a save cannot reach the server,
So that nothing is silently lost (FR-14, AD-5, UX-DR15).

**Acceptance Criteria:**

**Given** the network is disconnected
**When** Save is pressed
**Then** within 10 seconds a snackbar and an inline message say the save failed ("Couldn't save. Your numbers are still here. Try again."), the form values remain, and Save is available to retry.

**Given** a write returns `permission`, `invalid` or `unknown`
**When** it fails
**Then** the store returns `error(code)` from the closed set and the UI maps the code to a `strings.ts` message.

**Given** a write timed out
**When** the next write for the same Day starts
**Then** the Entry is first re-read with `getDocFromServer` before writing.

**Given** a write started in one session
**When** the session changes before it completes
**Then** its result is discarded (`sessionEpoch`) and never reaches the new session's stores.

**Given** a failed save
**When** the screen is inspected
**Then** nothing is shown as saved and error messages do not auto-dismiss.

### Story 2.4: Adjust the weight quickly

As Bob,
I want the Weight to start from my last weight and change by 0.1 kg per tap,
So that logging takes seconds (FR-8, UX-DR5).

**Acceptance Criteria:**

**Given** a previous Entry exists
**When** Today opens with no Entry for today
**Then** the Weight field starts from the most recent Entry's Weight (a suggestion, built only when the store is `ready`) and the hint shows the last value and the step.

**Given** no previous Entry
**When** Today opens
**Then** the field starts empty.

**Given** the plus and minus buttons, or Up and Down arrow keys in the field
**When** pressed once
**Then** the value changes by exactly 0.1 kg using integer tenths (72.7 plus 0.1 is 72.8) and the buttons have the accessible names "Increase weight by 0.1 kg" and "Decrease weight by 0.1 kg".

**Given** `domain/number.ts`
**When** a Weight is typed with a comma or a point in either Language
**Then** both store the same value, display follows the Language, and shared test vectors pass against the client validators.

**Given** the controls
**When** viewed on a phone
**Then** every target is at least 44 by 44 px.

### Story 2.5: See that today is not logged yet

As Bob,
I want a friendly sign when today has no entry,
So that I remember to log without being pushed (FR-10, UX-DR4).

**Acceptance Criteria:**

**Given** `EntryStore.status` is `ready` and today has no Entry
**When** the Today tab opens
**Then** the amber Missing-entry banner "Today isn't logged yet / Add today's numbers whenever you're ready." (Italian equivalent) is shown, not dismissible, no error red, no exclamation icon.

**Given** the store is still `loading`
**When** the Today tab renders
**Then** the sign is not shown (no flash).

**Given** today's Entry is saved
**When** the save is confirmed
**Then** the banner disappears; if that Entry is deleted later it reappears.

**Given** the app
**When** it is used
**Then** no email or push notification is ever sent.

### Story 2.6: Get a warm response after saving

As Bob,
I want a happy effect after I save,
So that logging feels rewarding and never judged (FR-9, UX-DR8).

**Acceptance Criteria:**

**Given** `domain/happy-effect.ts` and `previousEntry(day, entries)`
**When** today's Entry is saved and confirmed
**Then** the effect compares its Weight with the most recent earlier Entry and names that Entry's date when it is not yesterday.

**Given** a loss
**When** the effect shows
**Then** it is a celebratory card with confetti playing for at most 3 seconds and "Nice! Another step, your way."

**Given** a gain or no change
**When** the effect shows
**Then** it is a calm card with no confetti and a kind message with no shaming text or red or warning visuals.

**Given** no earlier Entry
**When** the effect shows
**Then** a welcome message replaces the comparison.

**Given** the effect is open
**When** Done or Dismiss or Esc is used
**Then** it closes, focus returns to Today, and it never blocks interaction for more than a few seconds; with `prefers-reduced-motion` no confetti moves and the card is static.

**Given** the effect uses the chosen accent
**When** the accent changes
**Then** the effect colors follow it.

### Story 2.7: Browse my history

As Bob,
I want to see all my entries and the days I missed,
So that I can find and fix gaps (FR-11, UX-DR9).

**Acceptance Criteria:**

**Given** `domain/history.ts` (`buildHistoryRows`, `recentEntries`)
**When** the History tab opens
**Then** Entries are listed newest first, each row showing the Day and the values present, with an em dash for absent values (never 0).

**Given** Days without an Entry between the first and last Entry
**When** the list renders
**Then** each appears as a dashed "no entry · + Add" row, and future Days never appear.

**Given** a year of daily Entries (365 rows)
**When** the user scrolls
**Then** CDK virtual scroll with a fixed row height keeps scrolling smooth.

**Given** no Entries at all
**When** History opens
**Then** "Nothing here yet. Your first log starts on Today." is shown.

**Given** a failed load
**When** History opens
**Then** an inline message with Retry is shown and previously shown data stays.

### Story 2.8: Edit an entry or add a forgotten day

As Bob,
I want to change any entry or add a missing past day,
So that my history is complete and correct (FR-12, UX-DR10, UX-DR19).

**Acceptance Criteria:**

**Given** the route `/history/:dayKey`
**When** a row is tapped, swiped left (touch), or opened from the overflow menu, or "+ Add" is chosen for a missing Day
**Then** Entry edit opens full screen on compact and as a dialog on medium and expanded, with the same Weight card, validation and Save as Today, titled "Add entry for Mon 13 Oct" for a missing Day.

**Given** a malformed `:dayKey` or one later than today
**When** the route is visited
**Then** the guard redirects to `/history`.

**Given** the draft is built by `initialDraft` only when the store is `ready`
**When** the form opens for an existing Entry
**Then** its stored values are used; for a Day without an Entry the registry defaults apply.

**Given** Save is confirmed for a past Day
**When** the edit closes
**Then** History and (later) the Report update at once and no Happy effect is shown.

**Given** today's Entry is edited from History
**When** Save is confirmed
**Then** the Happy effect runs.

**Given** Cancel, a confirmed save, or a delete
**When** the form closes
**Then** the draft for that Day is dropped; typed values survive a failed save and a Tab switch.

### Story 2.9: Delete an entry safely

As Bob,
I want to delete an entry only after confirming,
So that I can remove a wrong day without accidents (FR-13, UX-DR11).

**Acceptance Criteria:**

**Given** the History overflow menu or Entry edit
**When** Delete is chosen
**Then** a dialog "Delete this entry? / This removes the day's numbers." with Delete and Cancel appears, Cancel is the default focus, focus is trapped and restored on close.

**Given** Cancel
**When** pressed
**Then** the Entry is untouched.

**Given** Delete is confirmed
**When** the server confirms
**Then** the Entry disappears from memory, the Day shows as missing in History and (later) as a Gap in the Report; if it was today's, the Missing-entry sign reappears.

**Given** the delete cannot reach the server
**When** confirmed
**Then** an error is shown, nothing is removed and the dialog allows a retry.

### Story 2.10: See "This week" on wide screens

As Bob on a desktop,
I want a summary of the last 7 days next to the form,
So that I see how the week is going (FR-29, UX-DR17).

**Acceptance Criteria:**

**Given** an expanded window
**When** Today opens
**Then** a right column shows the "This week" card and the last 5 Entries; on compact and medium neither is shown.

**Given** `domain/stats.ts` created in this story with the `average` helper (Real entries only, `null` when there is none) and its unit tests
**When** the card needs an average
**Then** it uses that helper; Story 4.1 extends the same file with minimum, maximum and change.

**Given** the 7 Days ending today from `resolveRange`
**When** the card renders
**Then** it shows how many of the 7 Days have an Entry and, for each Dimension in the registry, the average from Real entries only; a Dimension with none reads "No data", never 0.

**Given** an Entry is saved, edited or deleted
**When** the change is confirmed
**Then** the card updates.

**Given** the card iterates the registry
**When** a Dimension is added later
**Then** it appears without changing the card's code.

## Epic 3: Emotional level and sleep hours

Bob can add Mood and Sleep to the same entry in one tap and one slide, and see and edit all three values everywhere an Entry appears.

### Story 3.1: Record my mood with a face

As Bob,
I want to tap a face for my mood from 1 to 10,
So that my emotional level is logged in one tap (FR-15, UX-DR6).

**Acceptance Criteria:**

**Given** the registry gains `mood` (key equals field `mood`, `input: faces`, 1 to 10, integer, optional, clearable)
**When** Today or Entry edit renders
**Then** the Mood card shows ten distinct faces as a radio group with the number visible under each and the accessible name "Mood 7 of 10"; on medium and up they sit in one row.

**Given** a face is selected
**When** it is tapped again
**Then** the Mood is cleared; arrow keys move and Space toggles.

**Given** an Entry saved with no Mood
**When** it is stored
**Then** the `mood` field is absent and the History row shows an em dash.

**Given** the rules tests
**When** they run
**Then** Mood vectors (integers 1 and 10 valid, 0, 11 and 7.5 invalid) pass on the client validator and in the emulator.

### Story 3.2: Record my sleep with a slider

As Bob,
I want to slide my hours of sleep, starting from 6.0 h,
So that sleep is logged in one slide (FR-16, UX-DR7).

**Acceptance Criteria:**

**Given** the registry gains `sleep` (`input: slider`, 0 to 24, step 0.5, `defaultValue` 6.0, clearable)
**When** Today opens for a Day without an Entry
**Then** the slider starts at 6.0 h with the live value shown and saving without touching it stores `sleep: 6` (display "6.0 h").

**Given** the "x" clear button next to the slider (present on every window class)
**When** it is pressed
**Then** the value shows an em dash, the Day saves without a `sleep` field, and touching the slider again sets a value.

**Given** values outside 0 to 24 or off the half-hour step
**When** entered
**Then** they are not accepted; the slider exposes value text "7.5 hours", the clear button is named "Clear sleep" and a cleared slider reads "No sleep value".

**Given** a past Day without an Entry
**When** "+ Add" opens Entry edit
**Then** Sleep starts at 6.0 h as on Today (decision recorded in AD-12).

**Given** the rules tests
**When** they run
**Then** Sleep vectors (0, 6, 6.5, 24 valid; 24.5, -1, 6.3 invalid) pass on the client and in the emulator.

### Story 3.3: See and edit all three values everywhere

As Bob,
I want Weight, Mood and Sleep to appear and be editable wherever an Entry appears,
So that nothing I logged is hidden (FR-17, FR-29).

**Acceptance Criteria:**

**Given** History rows and Entry edit
**When** an Entry is shown
**Then** all three values show, an absent Mood or Sleep as an em dash and never 0, and a Weight-only Entry saves and displays correctly.

**Given** an existing Entry
**When** it is edited
**Then** Mood and Sleep can be added, changed or cleared and the result is a valid Entry; Weight cannot be cleared.

**Given** an existing Entry with no Sleep
**When** Entry edit opens
**Then** the slider shows the cleared state, not 6.0.

**Given** the "This week" card
**When** Mood and Sleep are in the registry
**Then** it shows their averages from Real entries only, "No data" when none, with no change to the card's code.

**Given** Language is Italian
**When** values show
**Then** Weight and Sleep use the decimal comma.

## Epic 4: Report tab with charts

Bob can pick a Range and see how Weight, Mood and Sleep move together and apart, with Statistics and dashed lines over days without data, on any device.

### Story 4.1: Choose a Range and read the Statistics

As Bob,
I want to pick how far back to look and read the key numbers,
So that I see the shape of my weeks (FR-18, FR-21, UX-DR12).

**Acceptance Criteria:**

**Given** `resolveRange(rangeId, today, firstDay)`
**When** a chip is chosen
**Then** `7d`, `30d`, `90d` and `1y` end today (a year is 365 Days) and `all` starts at the first Entry (today when none); the default is 30 d; one Range drives every chart and the Statistics.

**Given** the Range chips (single select with a check mark)
**When** the window rotates or resizes
**Then** the selected Range is kept.

**Given** `domain/stats.ts` (created with `average` in Story 2.10) extended with minimum, maximum and change, and `formatStat`
**When** Statistics are computed for each Dimension in the registry
**Then** average, minimum, maximum and change use only Real entries inside the Range, change is the last minus the first Real entry, one decimal everywhere, and a Dimension with no Real entry shows "No data", never 0.

**Given** unit tests
**When** they run
**Then** they cover gaps, a single Real entry, no entries and each Range boundary including `all`.

### Story 4.2: See each Dimension on its own chart with dashed gaps

As Bob,
I want one chart per Dimension, dashed where I did not log,
So that a missing day is never mistaken for a value (FR-20, FR-22, UX-DR13).

**Acceptance Criteria:**

**Given** Chart.js 4.5.1 with ng2-charts loaded lazily with the Report route
**When** the Report opens
**Then** one chart per registry Dimension is generated, each with a labeled value axis in its unit and a marker at every Real entry (weight circle, mood square, sleep triangle) in its token color.

**Given** `domain/series.ts` produces `value: number | null` per Day on a shared category axis and `bridgedFromPrev` on the segment-ending point
**When** `chartDataset` builds a dataset with `spanGaps: true`
**Then** segments between consecutive Real entries are solid and segments over any Gap are dashed.

**Given** an Entry that lacks Sleep
**When** the charts draw
**Then** only the sleep line is dashed over that Day and the other lines stay solid.

**Given** the missing Entry is added
**When** it is saved
**Then** the dashed segment becomes solid.

**Given** a unit test of a series with null gaps
**When** it runs
**Then** it asserts the `p0DataIndex` and `p1DataIndex` the dash callback receives.

**Given** the chart colors
**When** the accent changes
**Then** the chart colors do not change.

### Story 4.3: Compare the three Dimensions on one chart

As Bob,
I want one chart with weight, mood and sleep together,
So that I can see links between them (FR-19).

**Acceptance Criteria:**

**Given** the combined chart
**When** it renders
**Then** it uses one independent y axis per Dimension with real values (no normalization), each line has its color, marker and legend entry ("Weight (kg) · Mood (1–10) · Sleep (h)"), and the footnote "Each line uses its own scale. Dashed = days without an entry." is shown.

**Given** the same `chartDataset` helper
**When** the combined and the per-Dimension charts are built
**Then** their axis bounds come from the registry range and step so both agree.

**Given** the chart legend and lines
**When** viewed without color
**Then** lines remain distinguishable by marker and dashes.

**Given** a Gap in one Dimension
**When** the combined chart draws
**Then** only that line is dashed over the Day.

### Story 4.4: Make a sparse Report explain itself

As Bob,
I want a friendly message when there is too little data,
So that I never see empty or broken charts (FR-23).

**Acceptance Criteria:**

**Given** no Entries
**When** the Report opens
**Then** "No data yet. Log a day on Today and your chart appears here." is shown with a pointer to Today and no empty axes.

**Given** a single Real entry in the Range
**When** the Report renders
**Then** the point and its Statistics show without error.

**Given** a Dimension with no Real entry in the Range
**When** it renders
**Then** its Statistics read "No data" and its chart shows the friendly state.

**Given** the load fails
**When** the Report opens
**Then** an inline message with Retry is shown and earlier data stays.

### Story 4.5: Read the Report on phone, tablet and desktop

As Bob,
I want the Report to fit any screen,
So that I can read it wherever I am (FR-24, NFR-8, UX-DR12).

**Acceptance Criteria:**

**Given** compact windows
**When** the Report shows
**Then** everything stacks: chips, combined chart, per-Dimension charts, then Statistics.

**Given** medium and expanded windows
**When** the Report shows
**Then** chips sit on top, the combined chart has the Statistics cards beside it (about two thirds and one third on expanded), and the three charts sit in a row below.

**Given** widths of 360, 768 and 1280 px
**When** the Report is loaded
**Then** all charts and Statistics are fully visible, axis labels are legible and no horizontal page scrolling is needed.

**Given** each chart
**When** "Show data as table" is used
**Then** a table of Days and values built from the same series is shown and keyboard operable.

**Given** a year of Entries
**When** the Report renders and a Range is switched
**Then** it does not visibly freeze.

## Epic 5: Polish and quality

Everyone can use the app: it meets WCAG 2.1 AA, is verified on three screen sizes and four browsers in both Languages, meets the performance budget, passes the three key journeys end to end, and can be released safely.

### Story 5.1: Operate the whole app with keyboard and screen reader

As an Account owner who uses a keyboard or a screen reader,
I want every function to be usable and announced,
So that the app works for everyone (FR-25, AD-15, UX-DR18).

**Acceptance Criteria:**

**Given** the whole app on desktop
**When** only the keyboard is used
**Then** every function is operable in a logical order with a visible focus ring, Esc closes dialogs and the Happy effect, dialogs trap and restore focus.

**Given** forms
**When** validation fails or a save or delete finishes
**Then** focus moves to the first invalid field and the outcome is announced through a polite `aria-live` region; every field and icon button has an accessible name.

**Given** the Language changes
**When** the page is inspected
**Then** `<html lang>` follows it.

**Given** `prefers-reduced-motion`
**When** the Happy effect plays
**Then** it is static, and other transitions use no movement.

**Given** phone widths and 200% zoom
**When** the app is used
**Then** targets are at least 44 by 44 px, the layout reflows without horizontal scroll, and Italian strings never truncate controls.

**Given** the Playwright suite with axe
**When** it runs on each Tab and dialog
**Then** it reports no critical or serious violations.

### Story 5.2: Never rely on color alone

As an Account owner with low vision or color blindness,
I want shapes, numbers and text to carry meaning,
So that I can read faces, charts and states (FR-25).

**Acceptance Criteria:**

**Given** the Mood faces, chips, segmented button and swatches
**When** viewed in grayscale
**Then** faces carry numbers, selected chips and segments a check mark, selected swatches a check.

**Given** the charts
**When** viewed in grayscale
**Then** lines carry markers and Gaps carry dashes, and each chart's data is available as a table.

**Given** each of the six accents
**When** the contrast audit runs on screens and the Happy effect
**Then** text and essential graphics meet AA, verified by the AD-10 unit test and a visual pass.

### Story 5.3: Verify the layout on three screens and four browsers in both Languages

As Bob,
I want proof that nothing breaks across devices and Languages,
So that I can trust the app everywhere (FR-26, SM-4).

**Acceptance Criteria:**

**Given** Playwright against the emulators
**When** the suite runs at 360, 768 and 1280 px
**Then** all four Tabs show with no layout breakage and no horizontal page scroll, in English and in Italian.

**Given** the latest two versions of Chrome, Edge, Firefox and Safari (desktop and mobile)
**When** the manual or automated check is run
**Then** each browser passes the same checks and any defect found is logged and fixed or recorded as known.

**Given** orientation or window changes
**When** they happen on Today and Report
**Then** unsaved input and the selected Range are kept.

### Story 5.4: Meet the performance budget

As Bob,
I want the app to open fast and stay smooth with a long history,
So that daily use stays effortless (FR-27, NFR-8).

**Acceptance Criteria:**

**Given** a mid-range phone profile over a typical mobile connection
**When** a signed-in visitor opens the app
**Then** the Today tab is interactive within 3 seconds, with Chart.js not in the initial bundle.

**Given** 365 seeded Entries
**When** a Range is switched on the Report
**Then** every chart and Statistic updates within 1 second.

**Given** 365 seeded Entries
**When** History is scrolled
**Then** there is no visible jank.

**Given** the measurements
**When** the story completes
**Then** results and the method are recorded and any miss is fixed or documented.

### Story 5.5: Pass the three key journeys end to end

As Bob,
I want the three journeys to work from start to finish,
So that the product does what I set out to build (SM-1, SM-3).

**Acceptance Criteria:**

**Given** Playwright against the emulators and a phone viewport
**When** UJ-1 runs (open Today, adjust Weight, pick a face, set Sleep, Save)
**Then** the Happy effect shows, the Missing-entry sign is gone and the Entry exists; a stopwatch-style test shows the flow completes well within the 30-second target.

**Given** UJ-2 (History, add a forgotten day, edit a wrong value, delete after confirmation)
**When** it runs
**Then** each outcome shows in History and the Report Gap becomes solid.

**Given** UJ-3 on a desktop viewport (Report, change Range, read Statistics and the Sleep chart)
**When** it runs
**Then** every chart and Statistic updates together and a week without logging is bridged by a Dashed line.

**Given** the network is cut during UJ-1
**When** Save is pressed
**Then** the error shows, typed values stay and a retry succeeds.

### Story 5.6: Release safely

As Bob,
I want one safe command to publish the app and its rules,
So that a release never leaves rules and app out of step (NFR-1, NFR-4, FR-3).

**Acceptance Criteria:**

**Given** `npm run deploy`
**When** it runs
**Then** it runs `npm run check` first and stops on failure, then deploys `firestore.rules`, then Firebase Hosting over HTTPS at the stable address.

**Given** the production Firebase project
**When** the release checklist is completed
**Then** Firestore is in `eur3`, email-enumeration protection is enabled, the `prod` environment file holds the real config, and nothing in `prod` connects to emulators.

**Given** a bad release
**When** a rollback is needed
**Then** the documented steps (Hosting version history for the app, redeploy of the previous `firestore.rules` from version control for rules) are in the README and have been walked through once.

**Given** the PRD, already amended before sprint planning (Sleep 6.0 h default, custom Range deferred)
**When** the story completes
**Then** the PRD is validated against what was built and any remaining divergence is recorded.
