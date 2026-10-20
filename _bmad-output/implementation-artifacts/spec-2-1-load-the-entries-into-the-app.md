---
title: '2-1 Load the Entries into the app'
type: 'feature'
created: '2026-10-20'
baseline_commit: '797c87bbbd2d6117d587719632dcd6441b2384fe'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-bmad612_home-2026-10-19/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-1-10-choose-an-accent-color.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** There is no Entry model, no Day module beyond `formatDay`, no clock and no store: the Today tab is a placeholder and nothing loads the Account's Entries (FR-7 foundations, NFR-3, NFR-5, AD-2 to AD-5).

**Approach:** Add the pure Day, Entry and Dimension-registry modules, a `ClockService` with a `today` signal, and an `EntryStore` in `core/data` that loads all Entries once per session and mutates only through `save` and `remove`; Today shows a skeleton until `ready` and an inline error with Retry on failure.

## Boundaries & Constraints

**Always:** `domain/day.ts` keeps `formatDay(dayKey, locale)` unchanged and adds `dayKey(date)` (device-local `YYYY-MM-DD`), `parseDayKey(key)` (a local `Date`, or `null` for a malformed or impossible key such as `2026-02-30`), `addDays(key, n)`, `enumerateDays(from, to)` (inclusive, empty when `from` is after `to`) and `resolveRange(rangeId, today, firstDay)` returning `{ from, to }`; ranges `7d`, `30d`, `90d`, `1y` (365 Days) end today, `all` starts at `firstDay` (`null` gives today). All arithmetic is calendar-based on local date parts, never milliseconds, and never `new Date('YYYY-MM-DD')`. `domain/dimensions.ts` holds the ordered registry with Weight only (`key` `weight`, unit kg, range 20 to 400, step 0.1, 1 decimal, required, not clearable, input `stepper`, no default, chart token `--w4a-chart-weight`, label key in `strings.ts`) and `PRIMARY`; `domain/entry.ts` has `DayKey`, `DimensionKey` (derived from the registry) and `Entry = { day, values }` in display units. `ClockService` (`core/state/clock.service.ts`) is the only reader of the clock: `today` signal, refreshed at local midnight and on tab visibility change, timers and listeners released on destroy. `EntryStore` (`core/data/entry.store.ts`) is a `SessionStore` registered with `SessionScope` and instantiated at startup by `App`: `status` (`loading | ready | error`) and `entries` (readonly signal keyed by day) are tagged with `sessionEpoch`; `load` runs once per session through one ordered read of `users/{uid}/entries`, an old-epoch result is discarded, a failed read sets `error`, and `retry()` reloads; `reset()` empties it and returns to `loading`. `save(entry)` and `remove(day)` return `{ ok: true }` or `{ ok: false, code }` with `code` in `network | timeout | permission | invalid | unknown` (Firebase codes mapped, raw text never exposed); `save` writes the full document `users/{uid}/entries/{day}` with `setDoc` without merge, the values by Dimension key plus `updatedAt: serverTimestamp()`; each write is raced against the 10 s timeout shared with `PreferencesStore` (move `withTimeout` and `SAVE_TIMEOUT_MS` to one `core/data` module; keep the constant exported from `preferences.store.ts`); the `entries` signal changes only after Firestore confirms, and a result from an older epoch changes nothing. Today shows a skeleton card layout (`surface-container` tokens, `aria-hidden` shapes plus a visually hidden, polite loading text) while `loading`, an inline message with a Retry button while `error`, and the existing placeholder when `ready`. All text in `strings.ts` (`en` and `it`, warm, no exclamation marks).

**Never:** No Entry form, save button, draft, validation, Happy effect, Missing-entry sign, History or stats (Stories 2.2 and later). No realtime listeners or offline persistence. No `getDocFromServer` re-read after a timeout (Story 2.3). No `new Date`, `Date.now` or `Intl.DateTimeFormat` outside `domain/day.ts` and `ClockService`. No color literal outside `src/styles/`. No change to `firestore.rules`. No Dimension key literal outside `domain/dimensions.ts`, rules and tests.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Day keys near midnight | `new Date(2026, 0, 1, 23, 59)` and `(2026, 0, 2, 0, 0)` | `2026-01-01` and `2026-01-02`; `addDays` crosses month, year and leap day correctly | N/A |
| Bad key | `parseDayKey('2026-02-30')`, `'x'` | `null` | N/A |
| Ranges | `resolveRange('7d', '2026-10-20', null)`; `'all'` with and without `firstDay` | from `2026-10-14`; `all` from `firstDay` or today | N/A |
| Clock rollover | Local midnight passes, or the tab becomes visible after midnight | `today` updates | N/A |
| Start signed in | Session becomes `signedIn` | One read; `loading`, then `ready` with Entries keyed by day; Today shows the skeleton then the content | N/A |
| Failed load | Read rejects | `status` `error`; Today shows the message and Retry; Retry reloads | `error` state |
| Stale load | Session changes while the read is in flight | Result discarded; store stays as `reset` left it | Epoch check |
| Save confirmed | `setDoc` resolves | `{ ok: true }`; signal now holds the Entry | N/A |
| Save fails | `setDoc` rejects (`permission-denied`, `unavailable`, `invalid-argument`, other) | `{ ok: false, code }` as `permission`, `network`, `invalid`, `unknown`; signal unchanged | Closed code set |
| Save times out | No answer in 10 s | `{ ok: false, code: 'timeout' }`; signal unchanged | Closed code set |
| Save during session change | Epoch differs when the write settles | Signal unchanged | Result discarded |
| Remove | `deleteDoc` confirmed or failing | Entry leaves the signal only after confirm; same codes | Closed code set |
| Written document | Any `save` | `setDoc` without `merge`, fields exactly the values plus `updatedAt` | N/A |

</frozen-after-approval>

## Code Map

- `src/app/domain/day.ts` + `day.spec.ts` -- extend (keep `formatDay`; its `new Date(y, m-1, d)` pattern is the model). `domain/number.ts` stays as is.
- `src/app/domain/{dimensions,entry}.ts` + specs (new) -- registry, `PRIMARY`, types; no Angular, no DOM.
- `src/app/core/state/clock.service.ts` + spec (new) -- ESLint already exempts this path from the date rules; `layout.service.ts` is the pattern (signal, `DestroyRef`).
- `src/app/core/data/entry.store.ts` + spec (new) -- model on `preferences.store.ts` (`registerStore`, epoch capture, `withTimeout`, `db` from `./firebase`) and its spec (`vi.mock('firebase/firestore')`, `vi.resetModules()` and dynamic imports); needs `collection`, `query`, `orderBy`, `documentId`, `getDocs`, `doc`, `setDoc`, `deleteDoc`, `serverTimestamp` in the mock.
- `src/app/core/data/preferences.store.ts` -- import the shared timeout module; behavior unchanged; its spec must pass untouched.
- `src/app/app.ts` + `app.spec.ts` -- inject `EntryStore` next to `PreferencesStore` so it exists before the session resolves.
- `src/app/features/today/today.component.ts` + new spec -- skeleton, error with Retry, placeholder; inline template and styles (settings component is the pattern); read `t` from `I18n`.
- `src/app/shared/strings.ts` + `strings.spec.ts` -- `dimensionWeight`, `todayLoading`, `todayLoadError`, `todayRetry`.
- `tests/lint/template-text.spec.ts` scans inline templates: no literal text.

## Tasks & Acceptance

**Execution:**
- [x] `domain/day.ts`, `dimensions.ts`, `entry.ts` + specs -- Day module, registry, Entry types -- AC1
- [x] `core/state/clock.service.ts` + spec -- `today` signal with fake-timer tests -- AC1
- [x] `core/data` timeout module, `entry.store.ts` + spec -- load, retry, save, remove, epoch, codes, full-document write -- AC2, AC3, AC4
- [x] `app.ts` + spec -- instantiate `EntryStore` at startup -- AC2
- [x] `strings.ts` + `strings.spec.ts`, `today.component.ts` + spec -- skeleton, error and Retry -- AC2, AC4
- [x] matrix audit -- every I/O row covered by a test that ran -- verification

**Acceptance Criteria:**
- Given the Day module, `ClockService`, `Entry` and the Weight-only registry, when the unit tests run, then they cover `day.ts` near midnight with no `new Date('YYYY-MM-DD')`, and the registry and `Entry` shapes.
- Given `EntryStore.status`, when the app starts signed in, then all Entries load once into a signal keyed by day tagged with `sessionEpoch`, and Today shows a skeleton until `ready`.
- Given `save` and `remove`, when they are called, then they return `ok` or `error(code)` from the closed set, write the full document without merge, and update the signal only after Firestore confirms.
- Given a failed load, when the store is in `error`, then Today shows an inline message with Retry.

## Implementation Notes

No signed-in user makes `save` and `remove` return `unknown`; `load` skips documents whose id is not a day key and treats a non-numeric value as absent. The Today screen was not looked at in a browser; `npm run test:rules` was not run (rules unchanged).

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| `toCode` branches `unauthenticated`, `deadline-exceeded`, `out-of-range` untested (VG) | medium | patch | Rows added to the `it.each`; 275 tests pass. |
| No test runs the real `SessionScope` with `EntryStore` (VG, BH) | medium | patch | Spec added: sign-in loads once, sign-out resets. |
| Load error block not announced to screen readers (BH) | low | patch | `role="alert"` on the message; one attribute. |
| Save or remove while `loading` can be overwritten by the load result (BH, EC, VG) | medium (unverified) | defer | No UI can write before `ready` in this story; the form in 2.2 must gate on `ready` (AD-12). |
| `getDocs` has no timeout, so an offline stalled read keeps the skeleton (BH, EC) | medium (unverified) | defer | Firestore usually rejects an offline read with `unavailable`; settle with an offline run. |
| Timed-out write may commit later; no `getDocFromServer` re-read (BH, EC, VG) | n/a | rejected | The spec leaves it to Story 2.3. |
| Rules and validation of values, day key and ranges at the store (BH, EC) | n/a | rejected | Rules already exist (Story 1.2); client validation is Story 2.2. |
| `load(uid)` with a changed uid without reset; uid check after settle; epoch signal semantics (EC) | low | rejected | `SessionScope` always resets first; no path demonstrated. |
| Unmapped Firebase codes go to `unknown`; `enumerateDays` bounds; `resolveRange` with a future `firstDay`; clock after timezone change; no-op Retry (EC) | low | rejected | Cosmetic or unreachable with current callers; fixes add guards and branches. |
| Registry typing, hard-coded px in Today, local `.visually-hidden`, `formatDay` not using `parseDayKey`, back-compat re-export, duplicated test constant, focus lost after Retry (BH) | low | rejected | Same px pattern as Settings; no demonstrated failure. |
| Verification gap layer | none | n/a | Every matrix row has a passing test. |

## Verification

**Commands:**
- `npm run lint` -- expected: exit 0
- `npm test` -- expected: exit 0 (unit and lint tests)
- `npx ng build` -- expected: build succeeds (the initial-bundle size warning predates this story)
