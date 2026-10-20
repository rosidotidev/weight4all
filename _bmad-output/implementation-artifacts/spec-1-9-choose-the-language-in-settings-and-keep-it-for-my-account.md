---
title: '1-9 Choose the Language in Settings and keep it for my Account'
type: 'feature'
created: '2026-10-20'
baseline_commit: 'e8e91644b552edfb45444a341dd05d21becefbde'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-bmad612_home-2026-10-19/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/DESIGN.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Language can only change in code, is remembered per device only, and Settings shows no Account information, so Bob's choice does not follow him to another device (FR-28, UX-DR14, UX-DR16).

**Approach:** Give `PreferencesStore` Firestore persistence of `users/{uid}/preferences/app` with rollback and a late-load guard, add a Language segmented control and an Account section to Settings, and add the Italian number and date formatters.

## Boundaries & Constraints

**Always:** `PreferencesStore` (`core/data`) keeps owning the `language` signal and the `localStorage` cache (`w4a.language`) read at startup, so the cached Language shows before anything loads. It registers with `SessionScope`. `load(uid)` reads the preferences document once; if it exists with a valid `language`, that Language is applied and cached, and the document's `accent` is remembered (default `violet`, the only value of `domain/accent.ts` in this story); if it is missing or the read fails, the cached Language stays. `setLanguage(language)` returns a promise: it applies the Language and cache at once, then writes the full document `{ accent, language }` with `setDoc` (the rules require both keys), raced against a 10 s timeout. A write that fails or times out restores the previous Language and cache and sets `saveError`, unless a later choice or a session change happened since, in which case nothing is rolled back. A `load` result is discarded when `sessionEpoch` changed or a choice was made after the load started. Choosing the Language already shown writes nothing. `saveError` clears when the next choice starts. `reset()` (session change) clears the remembered accent and `saveError` and leaves the Language signal and cache untouched, so Login stays in the last Language. Without a signed-in user a choice only applies locally. Settings shows a segmented control named by a `<fieldset>` legend with two options, "English" and "Italiano" (fixed text in both Languages), implemented as native radio inputs styled with tokens (one tab stop, arrow keys, checked option marked by `primary-container`), at least 44 px, error shown in an `aria-live="polite"` region kept rendered. Settings > Account shows "Signed in as" with the email and the existing Log out button (behavior unchanged). `AuthService` exposes an `email` signal set from the Firebase user (listener, login, register) and `null` when signed out. `domain/number.ts` exports `formatNumber(value, decimals, locale)` and `domain/day.ts` exports `formatDay(dayKey, locale)` (short weekday, day, short month, without hand-rolled strings); Italian gives `72,5` and `dom 19 ott`, English `72.5` and `Sun 19 Oct`; Story 2.1 extends both files. All text in `shared/strings.ts` (`it` and `en`, warm, no exclamation marks); standalone, OnPush, signals, tokens only.

**Never:** No accent control, accent signal or theme change (Story 1.10). No Entry reads or writes. No change to `firestore.rules`, `firebase.ts`, `eslint.config.js`. `Intl`, `toLocaleString` and `Date` stay inside `domain/number.ts` and `domain/day.ts`. Switching Language never touches stored Entries. No retry or offline queue.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Choose Italiano | Signed in, save succeeds | UI switches at once; document `{accent:'violet', language:'it'}` written; cache `it` | N/A |
| Save fails | `setDoc` rejects | Previous Language and cache restored; error message shown | `saveError` set |
| Save times out | No answer in 10 s | Same as save fails | `saveError` set |
| Late load | Load starts, user chooses, load returns the other Language | The user's choice stays | Load result discarded |
| Normal load | Document says `it`, cache said `en` | Italian applied and cached | N/A |
| No document / read fails | New Account or offline | Cached Language stays | No message |
| Cold start | Cache `it` | Italian shown before load | N/A |
| Same Language chosen | Pick the current one | No write | N/A |
| Accent kept | Document has `accent: 'teal'` | Next save writes `teal` | N/A |
| Session change in flight | Logout or other user during load or save | Result discarded, no rollback, epoch increases | N/A |
| Account section | Signed in | Shows "Signed in as" and the email; Log out works | N/A |
| Italian formats | `formatNumber(72.5,1,'it-IT')`, `formatDay('2025-10-19','it-IT')` | `72,5`, `dom 19 ott` | N/A |

</frozen-after-approval>

## Code Map

- `src/app/core/data/preferences.store.ts` + `.spec.ts` -- extend: `SessionStore` (`reset`, `load`), registers via `inject(SessionScope).registerStore(this)`, `setLanguage` becomes async, `saveError` signal; reads `SessionScope.sessionEpoch`. Specs mock `firebase/firestore` (`doc`, `getDoc`, `setDoc`) and keep the existing cache tests (they call `setLanguage` synchronously: keep the local apply synchronous).
- `src/app/core/data/session-scope.ts` -- reuse unchanged (`registerStore`, `sessionEpoch`); `App` already injects it and `I18n`, which creates `PreferencesStore` before the first session event, so registration precedes the first load (a later-registering store would miss the load: see `deferred-work.md`).
- `src/app/core/data/auth.service.ts` + spec -- add `email` signal.
- `src/app/domain/accent.ts` (new) -- `Accent` type, `DEFAULT_ACCENT = 'violet'`, `isAccent` over the six ids in `firestore.rules`.
- `src/app/domain/number.ts`, `src/app/domain/day.ts` (new) + specs -- formatters only; the lint exemptions already name these files.
- `src/app/features/settings/settings.component.ts` + spec -- replace the placeholder: Language fieldset, Account section; keep `logout()` and its error handling.
- `src/app/shared/strings.ts` + `strings.spec.ts` -- `settingsLanguageLegend`, `settingsLanguageEnglish`, `settingsLanguageItalian`, `settingsLanguageSaveError`, `settingsAccountHeading`, `settingsSignedInAs`.
- `src/app/shell/shell.component.*`, `app.routes.ts` -- do not change.
- `tests/rules/preferences.spec.ts` -- already covers the rules; do not edit.

## Tasks & Acceptance

**Execution:**
- [x] `domain/accent.ts`, `domain/number.ts`, `domain/day.ts` + specs -- accent ids, the two formatters with the matrix vectors -- AC4
- [x] `auth.service.ts` + spec -- `email` signal -- AC5
- [x] `preferences.store.ts` + spec -- persistence, rollback, timeout, late-load and epoch guards, reset, SessionScope registration -- AC1-3
- [x] `strings.ts` -- new keys in `it` and `en` -- AC1, AC5
- [x] `settings.component.ts` + spec -- Language control, error region, Account section -- AC1-2, AC5
- [x] matrix audit -- every I/O row covered by a test that ran -- verification

**Acceptance Criteria:**
- Given Settings, when a Language is chosen, then it applies at once and is saved to `users/{uid}/preferences/app` as a full document.
- Given a failed save, when a Language was chosen, then it rolls back with a visible error and a late load never overwrites a later choice.
- Given a returning user, when the app starts, then the cached Language shows first and is then confirmed from the Account.
- Given the Italian Language, when numbers and dates are formatted, then they follow Italian formats.
- Given Settings > Account, when shown, then it displays the email and a working Log out.

## Implementation Notes

Spec ran about 1150 words (above the 1600-token target); kept whole at the user's pre-approval. `npm run test:rules` could not run (port 8080 held by a local emulator); rules are unchanged. `PreferencesStore` spec uses `vi.resetModules()` plus dynamic imports to stay isolated from the module cache. `formatNumber` uses a plain hyphen as minus; DESIGN.md's typographic minus is left to Story 2.x.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| A load discarded because a choice was made returned before storing the accent, so the next save wrote `violet` over a stored accent (VG, BH, EC) | medium | patch | `load` now stores the accent before the choice guard; new test asserts `teal` is written. |
| Failed read leaves the accent `violet`; next save overwrites a stored one (BH, EC) | medium (unverified) | defer | Needs a read retry or re-read before write; invisible until Story 1.10. |
| Timed-out save may commit later and flip the Language on the next load (BH, EC) | medium (unverified) | defer | Firestore keeps the write queued; same pattern as EntryStore (Story 2.2). |
| `formatDay`/`formatNumber` throw or misformat on bad input (BH, EC) | low | defer | Story 2.1 extends both files; no caller passes user input yet. |
| Choosing the Language already shown writes nothing (BH) | low | rejected | The spec's matrix row requires it. |
| Radio `[checked]` desync after rollback; stale `previous` on overlapping choices; load started after a choice; null email; `email`/`session` as two signals; hard-coded px/weight; tests mocking `SessionScope`; `ACCENTS` duplicated from rules (BH, EC) | low | rejected | Rollback lands in a later change-detection pass; the rest are rare or cosmetic with no demonstrated failure, and the accent list is fixed by the rules tests. |

## Verification

**Commands:**
- `npm run check` -- expected: exit 0 (`test:rules` needs port 8080 free; rules are unchanged)
- `npx ng build` -- expected: build succeeds
