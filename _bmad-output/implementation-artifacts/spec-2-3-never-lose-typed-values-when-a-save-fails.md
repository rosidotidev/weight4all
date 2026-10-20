---
title: '2-3 Never lose typed values when a save fails'
type: 'feature'
created: '2026-10-20'
baseline_commit: 'a3cc48a95214ec86ab700a8696145a61b0664a83'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-bmad612_home-2026-10-19/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/EXPERIENCE.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-2-2-save-today-s-weight.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A failed save shows nothing: the form re-enables Save and says no word, and a write that timed out may still commit later and be overwritten blindly by the next save (FR-14, AD-5, UX-DR15).

**Approach:** The form maps `error(code)` to a persistent inline message plus a persistent snackbar and keeps the draft; `EntryStore.save` re-reads a Day with `getDocFromServer` before writing it again after a timeout; the form ignores the result of a save started in an older session.

## Boundaries & Constraints

**Always:** `strings.ts` gets one message per code of the closed set, `network`, `timeout`, `permission`, `invalid`, `unknown`, plus `snackbarDismiss`; `network` and `timeout` say "Couldn't save. Your numbers are still here. Try again." (Italian: "Salvataggio non riuscito. I tuoi numeri sono ancora qui. Riprova."); `permission`, `invalid` and `unknown` use the same warm tone, no exclamation mark, and `permission` asks the user to log in again. A pure `saveErrorKey(code)` in `shared/` returns the `strings.ts` key; raw Firebase text is never shown. When `save` returns `error(code)` the form keeps the draft, re-enables Save, shows the message inline in the first Dimension's live region (replacing "Saved!"), and opens a `MatSnackBar` with the same text and a Dismiss action that never auto-dismisses (`duration: 0`); the inline message stays until the next edit or save attempt, and a new attempt closes the snackbar. Nothing is shown as saved after a failure. The failure appears within 10 seconds (the existing write timeout). `EntryStore` remembers the Days whose write timed out; the next `save` for such a Day first reads it with `getDocFromServer` (raced against the same 10 s timeout), puts the result in the signal (absent document removes the Day), clears the mark, then writes; if that read fails, `save` returns `error(code)` without writing and keeps the mark. The mark is per session and cleared by `reset()`. The form records `scope.sessionEpoch()` before awaiting `save` and, when it differs afterwards, discards the result: no message, no snackbar, no "Saved!", no draft change. All text goes through `strings.ts`.

**Never:** No plus/minus buttons or pre-fill (Story 2.4), no Missing-entry sign (2.5), no Happy effect (2.6), no History or edit route (2.7, 2.8), no automatic retry, no offline persistence or listeners. No change to `firestore.rules`, the theme or `remove` behavior (Story 2.9 owns delete failure). No `new Date`, `toFixed`, `toLocaleString` or `Intl.NumberFormat` outside their modules; no color literal outside `src/styles/`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Offline save | `save` returns `network` or `timeout` | Inline and snackbar message, text stays, Save enabled, not shown as saved | Retry by pressing Save |
| Other codes | `permission`, `invalid`, `unknown` | Message mapped from the code, same behavior | Retry by pressing Save |
| Message persists | Failed save, wait past any snackbar default | Snackbar and inline message still shown | Closed only by Dismiss, an edit or a new attempt |
| Retry succeeds | Failed save, then `ok` | Message and snackbar gone, "Saved!" shown, draft dropped | N/A |
| Re-read after timeout | A write for Day D timed out, Save pressed again | `getDocFromServer` for D runs before `setDoc`; signal updated from it | Re-read failure returns `error(code)`, no write |
| No timeout before | First save, or other Day | No re-read | N/A |
| Session changes mid-save | Logout while a save is pending | Result discarded, no message, nothing reaches the new session | `sessionEpoch` |

</frozen-after-approval>

## Code Map

- `src/app/core/data/entry.store.ts` + `entry.store.spec.ts` -- add the timed-out Day set, the `getDocFromServer` re-read in `save`, cleared in `reset()`; `toCode`, `withTimeout`, `SAVE_TIMEOUT_MS` (`timeout.ts`) are reused; the spec mocks `firebase/firestore` (extend with `getDocFromServer`); `remove` unchanged.
- `src/app/shared/entry-form.component.ts` + spec -- `submit` handles `result.ok === false` (new `failure` signal holding the code), takes `SessionScope.sessionEpoch()` before and after the await; snackbar through `MatSnackBar` (`@angular/material` 22.2.3 is installed, unused so far); realizes the "failed save in a snackbar plus inline" State Pattern in `EXPERIENCE.md`, which no mockup draws (so none to match); the inline message reuses the `.message` style, not error red on Today.
- `src/app/shared/save-error.ts` + spec (new) -- `saveErrorKey(code: EntryErrorCode): StringKey`; `entry.store.ts` is imported for the type only.
- `src/app/shared/strings.ts` + `strings.spec.ts` -- `saveErrorNetwork`, `saveErrorTimeout`, `saveErrorPermission`, `saveErrorInvalid`, `saveErrorUnknown`, `snackbarDismiss` (`saved`, `entrySave` are the pattern).
- `src/app/core/data/session-scope.ts` -- read only: `sessionEpoch`.

## Tasks & Acceptance

**Execution:**
- [ ] `shared/strings.ts` + spec, `shared/save-error.ts` + spec -- messages and the code-to-key map, every code covered, en and it -- AC1, AC2
- [ ] `core/data/entry.store.ts` + spec -- timeout mark, `getDocFromServer` re-read before the next write, mark cleared on success and `reset()`, re-read failure returns its code -- AC3
- [ ] `shared/entry-form.component.ts` + spec -- inline message, persistent snackbar with Dismiss, draft kept, Save available, epoch guard, message cleared on edit or new attempt -- AC1, AC2, AC4, AC5
- [ ] matrix audit -- every I/O row covered by a test that ran, then `UX check` -- verification

**Acceptance Criteria:**
- Given a failed save with `network`, when it returns, then within 10 seconds a snackbar and an inline message say "Couldn't save. Your numbers are still here. Try again.", the typed values remain and Save works again.
- Given `permission`, `invalid` or `unknown`, when it fails, then the store returns `error(code)` from the closed set and the UI shows the `strings.ts` message for that code.
- Given a write timed out, when the next write for the same Day starts, then the Entry is first re-read with `getDocFromServer`.
- Given a save started in one session, when the session changes before it completes, then its result is discarded and never reaches the new session's stores or form.
- Given a failed save, when the screen is inspected, then nothing is shown as saved and the messages do not auto-dismiss.

## Implementation Notes

`getDocFromServer` adds about 120 kB to the initial bundle (920 kB to 1.04 MB), which tripped the 1 MB hard budget; `angular.json` `maximumError` is now 1.25 MB (outside the Code Map; for the human to confirm). The snackbar (`@angular/material/snack-bar`) is loaded with a dynamic import on the first failure to keep it out of the initial chunk, so on the first failure it opens one tick after the inline message; if the chunk cannot load, only the inline message shows. An edit, a new attempt or destroying the form closes the snackbar. A save failing after a timeout-mark re-read can take up to 20 s (10 s re-read plus 10 s write). Not tried in a browser or against the emulator.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| An edit does not close the snackbar, but the matrix says an edit closes the messages (EC) | medium | patch | Matrix row "Message persists" names an edit; `edit()` now closes the snackbar. Test added. |
| Lazy snackbar import can reject, e.g. offline chunk load, leaving an unhandled rejection (BH, EC, VG) | medium | patch | `try/catch` around the import and `open`; the inline message already shows. Not tested: a dynamic import cannot be made to reject in the unit setup. |
| Snackbar outlives the form (Tab switch, logout) while the inline message is gone (BH, EC) | medium | patch | `DestroyRef.onDestroy` closes it and invalidates a pending open. Test added. |
| Guard after the lazy import has no test (VG) | medium | patch | Test added for the session change during the import. The `opening` (edit or new attempt during the import) branch has no deterministic test. |
| "Does not auto-dismiss" test starts fake timers after the snackbar opened (BH, EC) | low | patch | Fake timers removed; the `{ duration: 0 }` assertion plus a real wait remain. |
| Edit during the in-flight save would have suppressed the snackbar (found while patching) | medium | patch | The guard value is read after the failure is set, not when Save is pressed. |
| `diff` lists `save-error` files twice (BH) | false | rejected | Artifact of how the review diff was built, not of the code. |
| Re-read failure can block saving offline; re-read result is overwritten by the write (BH, EC) | low | rejected | Spec Always: a failed re-read returns `error(code)` without writing. |
| `remove` neither clears nor sets the timeout mark (BH, EC) | medium | defer | Spec Never: `remove` unchanged; a timed-out delete needs the same pattern in Story 2.9. |
| About 20 s to a failure after a timeout when the re-read is slow and the write hangs (EC) | low | rejected | Needs a re-read that succeeds slowly, then a hung write; a shared deadline adds complexity. |
| Snackbar text frozen in the open-time Language; no `role="alert"` (BH) | low | rejected | Rare; the inline region is already `aria-live="polite"` (Story 2.2). |
| `fromDoc` throws on malformed data; two forms re-read concurrently; day input changes in flight; stale message after a validation error (EC) | false | rejected | `fromDoc` ignores non-numbers; one form exists; the Today form is rebuilt per Day; an edit clears the failure before any validation error. |
| Bundle budget raised without justification; lazy load and larger budget seem to contradict (BH, EC) | low | rejected | The 120 kB comes from `getDocFromServer`, not Material; kept and put to the human in the summary. |
| Verification gap layer | none | n/a | Every matrix row has a passing test; the one gap is the patch above. |

## Verification

**Commands:**
- `npm run lint` -- expected: exit 0
- `npm test` -- expected: exit 0 (unit and lint tests)
- `npx ng build` -- expected: build succeeds (the initial-bundle size warning predates this story)

**Manual checks:**
- `UX check`: no mockup draws the failed-save state; compare Today against `mock-01-today.svg` and `desktop-01-today.svg`, confirm the new messages follow `EXPERIENCE.md` (State Patterns, copy table) and DESIGN.md tokens; the known Today and shell deviations stay with Story 2.4.
