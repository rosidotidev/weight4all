---
title: 'Story 5.3: Verify the layout on three screens and four browsers in both Languages (Chromium run; other browsers are known gaps)'
type: 'feature'
created: '2026-10-21'
status: 'in-review'
baseline_commit: '59ff034'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md', '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/EXPERIENCE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Nothing proves that the four Tabs fit on a phone, a tablet and a desktop in both Languages, or that unsaved input and the Report Range survive a window change.

**Approach:** A Playwright suite runs against the local emulators on Chromium at 360, 768 and 1280 px in English and Italian, checks every Tab for horizontal overflow and the `<html lang>`, and checks that typed input on Today and the selected Range on Report survive a resize. Edge, Firefox and Safari are not available in this environment and are recorded as known gaps, not as passes.

## Boundaries & Constraints

**Always:** Accounts are created only on the local Auth emulator, with a generated email. Entries are seeded only on the local Firestore emulator. The suite uses only `localhost` hosts. Waits use visible content, not `networkidle`, because Firestore keeps a socket open.

**Never:** Run `npm run deploy` or any command that reaches a real Firebase project. Mark Edge, Firefox or Safari as passed. Commit a test that depends on a real account or password.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Four Tabs at each width | 360, 768 or 1280 px; English or Italian | No horizontal page scroll on Today, History, Report, Settings | Test fails with the Tab and width named |
| Language on each Tab | Language set to English or Italian | `<html lang>` equals the Language | Test fails with the value found |
| Resize on Today | Typed weight, then the window changes class | Typed value is still in the field | Test fails with the value found |
| Resize on Report | Range 90 d selected, then the window changes class | Range 90 d is still selected | Test fails with the Range found |
| Sign-in failure | Wrong password | Error is shown, no Tab is reached | Test fails with the message found |

## Code Map

- `playwright.config.ts` -- new: Chromium only, `e2e/` as test directory, `localhost:4200` base URL, one worker. Draft already in the working tree; keep it.
- `e2e/support.ts` -- new: `createAccount` (emulator sign-up), `seedEntries` (emulator Firestore REST), `signIn` (login form), `setLanguage` (writes `w4a.language` before start), `dayKey`. Draft already in the working tree; keep it.
- `e2e/layout.spec.ts` -- new: the width by Tab by Language matrix. Draft already in the working tree; its wait was changed to visible content.
- `e2e/state.spec.ts` -- new: the two resize rows of the matrix.
- `src/app/features/auth/login.component.html` -- reference: labels `login-email` and `login-password` let the test find the fields by label.
- `src/app/core/state/draft.store.ts` and `src/app/app.ts` -- reference: typed values live outside components (AD-12), so they survive a resize.
- `src/app/features/report/report.component.ts` -- reference: `range` is a component signal, kept across a resize.
- `package.json` -- add script `"e2e": "playwright test"`.

## Tasks & Acceptance

**Execution:**
- [x] `playwright.config.ts`, `e2e/support.ts`, `e2e/layout.spec.ts` -- keep the drafts, confirm they run -- the matrix rows for widths and Languages.
- [x] `e2e/state.spec.ts` -- resize keeps typed input on Today and the Range on Report -- the two state rows (plus the sign-in failure row).
- [x] `package.json` -- add the `e2e` script.
- [x] This spec -- record the run result and the known gaps under Verification.

**Acceptance Criteria:**
- Given Playwright against the emulators, when the suite runs at 360, 768 and 1280 px, then all four Tabs show with no horizontal page scroll, in English and in Italian.
- Given the Chromium run passes, when Edge, Firefox and Safari are not available, then they are listed as known gaps in this spec, not as passes.
- Given a window change on Today and Report, when it happens, then unsaved input and the selected Range are kept.

## Design Notes

The suite uses the emulators, so it can run without a real account. The sign-in goes through the real login form, so the test covers the same path as a user.

## Verification

**Commands:**
- `npm run e2e` -- expected: all tests pass with the emulators and the dev server running.
- `npm run lint` -- expected: no errors.
- `npm run test:lint` -- expected: all pass.
- `npx ng test --watch=false` -- expected: all pass.
- `npm run build` -- expected: build succeeds.

**Manual checks (if no CLI):**
- Edge, Firefox and Safari, desktop and mobile: not run in this environment. Known gap; the user runs them.

**Run result (2026-10-21, Chromium only, emulators on 8080 and 9099, dev server on 4200):**
- `npm run e2e` -- 5 passed, 0 failed (`layout.spec.ts`: en and it, 360/768/1280 px, four Tabs; `state.spec.ts`: Today weight kept, Report Range 90 d kept, wrong password shows error and stays on /login).
- `npm run lint` -- exit 0, no errors.
- `npm run test:lint` -- 4 files, 146 tests passed.
- `npx ng test --watch=false` -- 47 files, 745 tests passed.
- `npm run build` -- succeeds; warns that the initial bundle is 597.11 kB over the 500 kB budget (pre-existing, not changed here; see Implementation Notes).

**Known gaps (not passes):**
- Microsoft Edge: not run. Known gap; the user runs it.
- Firefox: not run. Known gap; the user runs it.
- Safari (WebKit): not run. Known gap; the user runs it.
- Mobile browser profiles (Chrome on Android, Safari on iOS): not run. Known gap.
- Only the widths 360, 768 and 1280 px were checked; the 200% zoom reflow and axe audits belong to Story 5.1 and are not part of this suite.
- The sign-in path checks `#login-email-error` for the wrong-password message; no test covers the reset or register screens.

## Implementation Notes

- The emulators and the dev server were already running from this repo (Auth and Firestore ports 9099 and 8080, Angular on 4200), so the start commands exited on port conflicts and nothing was duplicated. The suite ran against those instances. Note: the failed `npm run emulators` start may have run its export-on-exit into `.firebase-emulator-data/`.
- `e2e/support.ts`: the account email uses `crypto.randomUUID()` instead of `Date.now()`, so the test code needs no clock read for uniqueness. This keeps the AD-4 clock rule satisfied for that part.
- `e2e/support.ts` `dayKey`: keeps one `new Date()` with an `eslint-disable-next-line no-restricted-syntax` and a reason. The seeded day keys must match the device-local Day the app uses (NFR-3). The rule guards app code, and it still fires for `e2e/` because the config applies it to every `.ts`. I did not change the ESLint config to exempt `e2e/`.
- `e2e/layout.spec.ts`: the draft already waited for visible content (`h1, h2, main`), not `networkidle`. Kept as is.
- `e2e/state.spec.ts`: the wrong-password row is in the I/O matrix but had no owner in the Code Map; it lives here with the two resize rows.
- The wrong-password message appears under the email field (`#login-email-error`), not in the form-level error (`p.form-error`), because `login.component.ts` maps `invalid-credentials` to the email field on purpose. The test checks the message text `do not match` in English. The test sets Language to English, so the Italian text is not checked for this row.
- The resize tests change the viewport in place, through 1280, 768 and back to 360, so both a class change and a return are covered. Typed weight is held in `DraftStore` and the Range in the Report component signal (per the Code Map references).
- `npm run build` reports the initial bundle at 597.11 kB against a 500 kB budget. This is not caused by the e2e work (no app code changed); it belongs to Story 5.4 (performance budget) and is recorded here rather than fixed.
- No mockup visual check (user standing rule) was run: this story changes no UI, only tests and a script.
- `package.json`: added `"e2e": "playwright test"` after `test:rules`.
- Nothing committed, nothing pushed, `npm run deploy` not run, and no command reached a real Firebase project.

## Run Results (review round)

- `npm run e2e` (Chromium, emulators and dev server up): 5 passed. Layout at 360, 768 and 1280 px in English and Italian, and the three state rows.
- Checks after review: the overflow check now also measures `.content`, because the shell clips it; the readiness wait uses the Tab's own content and the URL, not the shell heading; no fixed sleeps; contexts close in `finally`; sign-in uses `#login-email` and `#login-password`; the Report Range is selected by exact name.
- `npm run lint`: exit 0. `npm run test:lint`: 146 passed.
- Known gaps, not passes: Edge, Firefox, Safari (desktop and mobile). The mobile check uses a desktop Chromium profile at 360 px, not a phone profile. The e2e suite is not part of `npm run check` or `npm run deploy` by design: deploy must not need running emulators. Run `npm run e2e` before a release.
- Italian sign-in error copy is not tested.
