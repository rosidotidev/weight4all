---
title: 'Login without sign-up, with a branded welcome'
type: 'feature'
created: '2026-10-23'
status: 'done'
baseline_commit: '0621d0e4aa7fa810f891af2526d104827d9c1fc5'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The app lets anyone create an Account from the login screen ("New here? Create an account" and the `/register` screen). The owner creates Accounts himself in the Firebase backend, so self sign-up must go. The login screen is also a plain form with only a "Welcome back" title, with no brand and nothing that says what the app is for.

**Approach:** Remove the register feature from the app entirely (route, screen, service method, strings, the error codes only it produced, tests). Rebuild the login screen with a little branding: the logo dot and "Weight4All" wordmark, a short line about the app, and a small wellness illustration built from the app's own three Dimensions (weight, mood, sleep) in their chart colours. Login behaviour, errors and the "Forgot your password?" link stay as they are.

**Decisions (2026-10-23):**
- Layout A, violet hero: a band in the celebration gradient (`celebration-start` → `celebration-mid` → `celebration-end`) holds the white logo dot, the "Weight4All" wordmark, the tagline and a light illustration (a soft white trend line with one highlighted point, a dotted second line, a moon, and one gentle mood face). The form ("Welcome back", email, password, Log in, "Forgot your password?") sits on a surface card with `rounded.xxl` top corners that overlaps the bottom of the band. From the expanded window class: the band becomes a left brand panel and the form a right column. Preview reference: `C:\Users\ROBERT~1\AppData\Local\Temp\claude\C--Users-Roberto-Sidoti-Desktop-dev-claude-weight4all\dc417e70-bb0a-4d3b-b089-88a0cb89b6c2\scratchpad\login\index.html`, option A and the desktop frame.
- Tagline: "Your kind daily check-in." / "Il tuo check-in quotidiano, senza giudizi."

## Boundaries & Constraints

**Always:** All new text goes through `shared/strings.ts` in English and Italian. The illustration is inline SVG or CSS, `aria-hidden`, with no image files and no external fonts. Colours come from existing tokens in `_tokens.scss`, plus new tokens if needed (no hex in components). The page works from 360 px with no horizontal scroll, and on tablet and desktop. Inputs and buttons keep 44 px touch targets, labels, `autocomplete`, `aria-invalid`/`aria-describedby` and the current focus behaviour. Text contrast stays WCAG AA. The tone never shames: no "lose weight" or before/after message. Update DESIGN.md (a Login component entry) and EXPERIENCE.md (the surface table no longer lists Register) and mark PRD FR-1 as removed.

**Never:** No change to `login()`, `sendPasswordReset()`, `logout()`, the session guard behaviour for `/login` and `/reset`, the reset screen layout, or Firestore rules. No Firebase console or backend changes from code. Do not remove the e2e helper that creates test users through the Auth emulator REST API (`e2e/support.ts`): that is backend-side account creation and the tests need it.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Old link | Signed-out user opens `/register` | Lands on `/login` (unknown path → `/today` → guard → `/login`) | N/A |
| Signed in | Signed-in user opens `/register` | Lands on `/today` | N/A |
| Login screen | Signed out, `/login` | Brand, illustration, form, "Forgot your password?"; no create-account text or link | N/A |
| Wrong password | Bad credentials | Same single message under the email field, focus on email | as today |
| Italian | Language `it` | All new strings in Italian, nothing clipped at 360 px | N/A |

</frozen-after-approval>

## Code Map

- `src/app/app.routes.ts` -- remove the `register` route; the `**` redirect already sends unknown paths to `today`.
- `src/app/core/data/session.guard.ts` -- `PUBLIC_PATHS` drops `'register'`.
- `src/app/core/data/auth.service.ts` -- remove `register()`, the `createUserWithEmailAndPassword` import, and the `email-in-use` / `weak-password` codes and their `toAuthErrorCode` cases (only register produced them; those Firebase codes now map to `unknown`).
- `src/app/features/auth/register.component.{ts,html,scss,spec.ts}` -- delete.
- `src/app/features/auth/login.component.{ts,html,scss}` -- new layout; remove `loginNoAccount`/`loginRegisterLink` usage; `MESSAGE_KEYS` loses the two removed codes. Keep `submit()` logic untouched.
- `src/app/features/auth/reset.component.ts` -- `MESSAGE_KEYS` loses the two removed codes.
- `src/app/shared/strings.ts` -- delete `register*`, `loginNoAccount`, `loginRegisterLink`, `authErrorEmailInUse`, `authErrorWeakPassword`; add brand/tagline strings (`appName` may already exist in the shell — reuse if so).
- `src/styles/_tokens.scss` -- reuse `--w4a-celebration-*`, `--w4a-chart-*`, `--w4a-mood-n-fill/stroke` tokens.
- `src/app/shared/mood-face.component.ts` -- reuse `<w4a-mood-face>` / `mouthPath` for the face in the illustration.
- Tests to update: `app.routes.spec.ts` (register cases → `/register` redirects), `session.guard.spec.ts`, `auth.service.spec.ts` (register block, codes), `login.component.spec.ts` (no `/register` link; brand present), `shared/i18n.spec.ts` if it lists keys.
- Docs: DESIGN.md and EXPERIENCE.md in `_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/`; PRD FR-1 in `prds/prd-bmad612_home-2026-10-19/prd.md`; architecture spine route table (line 164) and capability map (line 240).
- Mockups: there is no login mockup (EXPERIENCE.md flags it "not mocked"); the chosen preview option is the visual reference, recorded in DESIGN.md.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/app.routes.ts`, `session.guard.ts`, `auth.service.ts`, delete `register.component.*` -- remove sign-up end to end -- owner creates Accounts in the backend.
- [x] `src/app/shared/strings.ts`, `login.component.ts`, `reset.component.ts` -- drop unused keys and codes, add brand strings -- no dead text.
- [x] `login.component.{html,scss}` -- build the chosen layout -- branded login.
- [x] Specs listed in the Code Map -- update and add: `/register` redirects (signed out → `/login`, signed in → `/today`), login has no create-account link, brand and tagline render in both languages.
- [x] DESIGN.md, EXPERIENCE.md, PRD FR-1, architecture spine -- record the change.

**Acceptance Criteria:**
- Given the built app, when searching the source, then there is no `register` route, component, `createUserWithEmailAndPassword` call or create-account string.
- Given the login screen at 360, 768 and 1280 px, when it loads, then it shows the brand, tagline and illustration of the chosen option, the form and the reset link, with no horizontal scroll.
- Given wrong credentials or a network error, when submitting, then the behaviour is identical to before.

## Implementation Notes

- Implemented by a subagent from this spec. Sign-up removed end to end; `email-in-use` / `weak-password` codes removed (those Firebase errors now map to `unknown`). New `loginTagline` string; `appName` reused.
- Illustration follows the chosen preview A: white trend lines, moon and highlighted point; the only Dimension-coloured element is the level-9 face (`mouthPath`/`faceColours`). The Approach's "in their chart colours" wording is overridden by the more specific Decisions bullet the user chose.
- Expanded layout uses `@media (min-width: 840px)`, the same pattern as `report.component.scss`.
- `epics.md` still mentions registration as delivered history; left as a record of Epic 1.
- Backend: the owner must turn off "Enable create (sign-up)" in the Firebase console; documented in `docs/README.md`.

## Spec Change Log

## Review Triage Log

- [blind] Sign-up still possible via Auth REST API with the public key — medium, patch: console step to disable sign-up and how to add users documented in `docs/README.md` (a code change cannot block it).
- [blind+edge+gap] Other docs still describe sign-up (`README.md:116`, `docs/weight4all.md:64`, `start-app.bat:3`, AD-9 Binds FR-1) — low, patch: direct wording fixes. `docs/features/feature-00-fondazioni.md` is the historical story plan, left as is.
- [blind] Face markup copied instead of embedding `<w4a-mood-face>` — low, rejected: shape and colours come from `mouthPath`/`faceColours`; only eye offsets are repeated, as already between picker and row; embedding in an SVG needs `foreignObject`.
- [blind+edge] Illustration not in chart colours / no markers — false: the frozen Decisions bullet (user-chosen option A) specifies white lines; code matches it.
- [blind+edge] Breakpoint measured in CSS, not `LayoutService` — low, rejected: same accepted pattern as `report.component.scss`; drift needs the 840 px threshold to change, and the fix adds a host binding.
- [blind+gap] No automated 360/768/1280 no-overflow check for /login; `overflow-x: hidden` could hide overflow — medium, patch: e2e test measuring the document and `.login`.
- [blind] Design reference lives in a temp folder — medium, patch: preview copied to `mockups/login-options.html` and linked from DESIGN.md.
- [blind] White tagline contrast on the celebration gradient for every accent — maybe-false (would be medium), defer: same gradient and white text already used by the Happy effect; needs a contrast check per accent.
- [blind] Hard-coded px values instead of tokens — low, rejected: the file already mixes px (44 px targets) and tokens; no named harm beyond style.
- [blind] Brand band inside `<main>` — low, rejected: no wrong announcement, only a less tidy landmark.
- [blind+edge] `100dvh` without `100vh` fallback — false: every browser in the Angular 22 support baseline supports `dvh`.
- [blind] Italian test uses the real `PreferencesStore` — low, rejected: TestBed builds a fresh store per test; the test passes and leaks nothing.
- [blind] Guard test checks a path the router no longer sends — low, rejected: harmless and documents the intent; the routes spec covers the real path.
- [blind] Spec status out of date / no Verification results — false: status is `in-review` at this step; results are recorded at finalize.
- [gap] Login face colours and mouth not asserted — low, rejected: decorative; the colour and mouth functions are tested in the mood-face specs.
- [edge] Brand 4 px off the card text below ~488 px (`max(space-6, …)` vs card `space-5`) — low, patch: floor changed to `space-5`.

## Design Notes

The illustration uses only the app's own visual language: Dimension colours and markers (circle, square, triangle) and a gentle mood face, so the brand matches what the user sees after login. It is decoration (`aria-hidden`); the tagline carries the meaning for screen readers.

## Verification

**Commands:**
- `npx ng test --watch=false` -- expected: pass
- `npx eslint src` and `npm run test:lint` -- expected: pass
- `npm run build` -- expected: success

**Manual checks (if no CLI):**
- `UX check`: `/login` signed out at 360, 768 and 1280 px in English and Italian, compared with the chosen preview option and DESIGN.md; `/register` redirects; a wrong password shows the usual message.

**Results (2026-10-23):** `ng test` 739/739 pass (46 files); `npm run test:lint` 159/159; eslint clean on `src` and `e2e`; `ng build` succeeds (initial-bundle budget warning 596 kB over 500 kB, pre-existing). New e2e `signed out` login layout tests pass in en and it against the emulators.
