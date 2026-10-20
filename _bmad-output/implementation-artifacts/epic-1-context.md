# Epic 1 Context: Foundations and adaptive shell

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Weight4All is a personal web app for logging daily weight (plus optional mood and sleep). This epic delivers the base project and everything a user needs before logging data: account registration, login with a persistent session, password reset, per-account data protection, an adaptive four-tab shell (phone, tablet, desktop), English/Italian language switching, and a six-accent Material 3 theme. The project must enforce the architecture rules mechanically from the first commit.

## Stories

- Story 1.1: Create the Angular project with the quality gate
- Story 1.2: Connect to Firebase and protect each Account's data
- Story 1.3: Show the app in English or Italian from one typed dictionary
- Story 1.4: Set up the Material 3 theme and design tokens
- Story 1.5: Register with email and password
- Story 1.6: Log in, stay logged in and log out
- Story 1.7: Reset a forgotten password
- Story 1.8: Move between four Tabs on any screen size
- Story 1.9: Choose the Language in Settings and keep it for my Account
- Story 1.10: Choose an accent color

## Requirements & Constraints

- Register, login (persisting across restarts), logout and password reset; reset responses never reveal whether an email is registered; without a session only the login screen shows and no data loads.
- Each account reads and writes only its own data, enforced by server-side rules, not only the UI.
- Four tabs (Today, History, Report, Settings) reachable in one tap; no horizontal scroll from 360 px.
- Accent chosen from a fixed set of six, persisted per account; chart colors stay independent of accent; AA contrast checked per accent.
- App in Italian or English, English by default, switching instantly with no reload; dates and numbers follow the language.
- Accessibility floor: `<html lang>` follows the language, 44 px targets, visible focus, reduced motion, announced errors.
- Voice: warm, never shaming; no streaks or guilt copy; "Saved!" is the only exclamation.

## Technical Decisions

- No starter template: Angular 22.2.3 CLI, standalone components only, signals, OnPush, zoneless-compatible, no NgModules; TypeScript ~6.0.3; Node >= 24.15; JDK >= 21 for emulators.
- Pinned stack: Angular + Material/CDK 22.2.3, RxJS ~7.8.2, zone.js ~0.16.0, firebase 12.19.0 (modular; no `@angular/fire`), chart.js 4.5.1, ng2-charts 11.0.0, Vitest 5.0.5 with jsdom 30.1.3, @firebase/rules-unit-testing 5.0.2, firebase-tools 15.34.0, @playwright/test 1.64.1; ESLint/typescript-eslint/angular-eslint at versions supporting TS 6.0.
- Layers under `src/app`: `features/{auth,today,history,report,settings}`, `shell`, `domain` (pure), `core/state`, `core/data`, `shared`. Allowed imports: domain -> nothing; core/state -> domain; core/data -> domain, core/state; shared -> domain, core/*; features -> domain, core/*, shared; shell -> domain, core/*, shared, features (routes only).
- Only `core/data` imports `firebase/*` or `@firebase/*`. `npm run check` (ESLint + unit tests + rules tests) is the single gate; `npm run deploy` runs it first, then rules, then Hosting. ESLint also fails on: `new Date`/`Date.now`/`Date.parse`/`Intl.DateTimeFormat` outside `domain/day.ts` and `ClockService`; `toFixed`/`toLocaleString`/`Intl.NumberFormat` outside `domain/number.ts`; Angular/DOM imports in `domain`; Dimension key literals outside the registry, rules and tests; literal UI text in templates (Vitest template scan).
- Repository is put under version control at scaffold time. Two environments only: `local` (Firebase Emulator Suite) and `prod`; Firebase config lives only in `src/environments/`; Firestore in `eur3`.
- Conventions: kebab-case files, `name.component.ts`, `name.service.ts`/`name.store.ts`, selector prefix `w4a-`, unit tests as `*.spec.ts` next to the file, rules tests in `tests/rules/`, e2e in `e2e/`.
- Entry doc `users/{uid}/entries/{YYYY-MM-DD}` with flat fields `weight`, `mood`, `sleep`, `updatedAt`; preferences at `users/{uid}/preferences/app` (`accent`, `language`); full-document writes.
- Session: tri-state (`unknown | signedOut | signedIn(uid)`), one route guard, `SessionScope` resets all stores and bumps `sessionEpoch` on every session change. Auth errors are a closed set: `invalid-credentials | email-in-use | weak-password | invalid-email | network | unknown`.
- All UI text in one typed `shared/strings.ts` (both `it` and `en` required per key); language signal owned by `PreferencesStore` with a `localStorage` cache to avoid a wrong-language flash; Material labels via `*Intl` providers.
- Theme: Angular Material 22 M3 light theme driven by tokens, six accent seeds applied via a runtime theme class (default violet `#5A46D6`); Dimension chart colors (weight blue, mood orange, sleep teal) are a separate token set; no color literals in components.
- Layout: `LayoutService` exposes one `windowClass` signal (compact < 600, medium 600-839, expanded >= 840); compact bottom bar, medium rail, expanded labeled drawer. Routes: `/login`, `/register`, `/reset`, `/today`, `/history`, `/history/:dayKey`, `/report`, `/settings`.

## UX & Interaction Patterns

- Login, Register and Reset screens: email and password fields, inline errors with focus moved to the first invalid field and polite announcement, links between screens, warm tone.
- Settings: accent swatches (single select with check), Language segmented button ("English" / "Italiano", fixed labels), Account section with signed-in email and Log out.
- Navigation items carry `aria-current` and an active indicator.

## Cross-Story Dependencies

- 1.1 is the base for all stories; 1.2 (rules, emulator) precedes preferences persistence (1.9, 1.10) and auth (1.5-1.7).
- 1.3 (strings) and 1.4 (theme) precede every screen; 1.10 only adds seeds to the 1.4 theme.
- 1.6 introduces `SessionScope`; the draft store joins it from Epic 2 (Story 2.2).
- 1.9 owns the Language preference and Account section; 1.6 uses a placeholder logout until then.
