---
title: '2-9 Delete an entry safely'
type: 'feature'
created: '2026-10-20'
baseline_commit: 'c57b676ee3dcd38841925c39768a5d415498f7fa'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/DESIGN.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Bob cannot remove a wrong day's Entry (FR-13, UX-DR11).

**Approach:** Add a Delete confirmation dialog, reachable from the History overflow menu and from Entry edit. Deleting calls the existing `EntryStore.remove(day)` only after Bob confirms.

## Boundaries & Constraints

**Always:** One new component `features/history/delete-entry-dialog.component` (`.ts`, `.html`, `.scss`, like every component in this project), inputs `day`, outputs `cancelled` and `deleted`, used by both entry points. Title "Delete this entry?", body "This removes the day's numbers.", buttons Delete and Cancel (reuse `entryCancel`). `role="alertdialog"`, `aria-modal`, labelled by the title and described by the body, centered over a scrim (M3 dialog), `cdkTrapFocus` with Cancel as the initial focus (`cdkFocusInitial`); on close focus returns to what had focus before (Delete button or the row's overflow button). Esc closes it as Cancel, and stops there (does not also cancel Entry edit): handle it on the dialog element and `preventDefault`. A scrim click is Cancel. While deleting, Delete shows "Deleting…" and is disabled; Cancel stays enabled but is ignored while the request is in flight. `remove` returning `ok` closes the dialog, emits `deleted` and the Day's draft is dropped (`DraftStore.drop`); the Entry then vanishes from History (the Day shows as a dashed missing row, or no row when it was the first or last Entry) and, for today, Today's missing banner reappears — both follow from the store with no extra code. A failed `remove` keeps the dialog open, shows a persistent inline `role="alert"` message ("Couldn't delete. Nothing was removed. Try again."), nothing changes in the list, and Delete can be pressed again. History: the overflow menu gains "Delete" under "Edit", only for Entry rows (the menu is shared, so Delete is shown only when the row has an Entry). Entry edit: a "Delete" text button beside Cancel, shown only when the Day has an Entry; after `deleted` the edit screen closes to `/history`. Delete uses the error color role already in the tokens for the destructive text, no new color literal. Targets at least 44 px. All copy in `strings.ts` en/it.

**Never:** No undo or soft delete, no bulk delete, no change to `EntryStore`, `EntryFormComponent`, `DraftStore` or the shell. No literal UI text in templates, no color literal outside `src/styles/`, no Dimension named outside the registry.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Open from menu | Overflow > Delete on an Entry row | Dialog opens, focus on Cancel | N/A |
| Open from edit | Delete in Entry edit of an existing Entry | Dialog over the edit screen, focus on Cancel | N/A |
| Missing Day | Entry edit of a Day with no Entry | No Delete button | N/A |
| Cancel | Cancel, Esc or scrim | Dialog closes, Entry untouched, focus restored; Esc does not also close Entry edit | N/A |
| Confirm | Delete, server confirms | Dialog closes, Entry gone, Day shows missing; from edit the edit screen closes | N/A |
| Delete today | Today's Entry deleted | Missing banner reappears on Today | N/A |
| Failure | `remove` returns an error | Dialog stays, inline persistent message, Entry still listed | Delete again retries |
| In flight | Delete pressed, request pending | Button disabled "Deleting…", second press ignored | N/A |
| Italian | Language `it` | "Eliminare questa registrazione?" / "Verranno rimossi i numeri del giorno." / Elimina / Annulla | N/A |

</frozen-after-approval>

## Code Map

- `src/app/features/history/delete-entry-dialog.component.{ts,html,scss}` (+ spec) -- new; modeled on `history-day.component` (scrim, `A11yModule`, `LayoutService` not needed). Calls `EntryStore.remove` (`core/data/entry.store.ts:151`, returns `{ok}|{ok:false,code}`) and `DraftStore.drop`.
- `src/app/features/history/history.component.{ts,html}` (+ spec) -- shared `<mat-menu #menu>` at html line ~85 gets a Delete item; hold a `deleting` signal (day) and render the dialog; menu opener restores focus via the dialog's trap.
- `src/app/features/history/history-day.component.{ts,html}` (+ spec) -- Delete button next to Cancel when `store.entries()[day]` exists; render the dialog; on `deleted` call `close()`. Esc handler must stay inert while the dialog is open (dialog stops it).
- `src/app/shared/strings.ts` + `strings.spec.ts` -- delete title, body, confirm, deleting, failure, menu item, edit-screen button name. EXPERIENCE.md "Delete confirm" and "Delete buttons" rows give the en/it text.
- Leave alone: `entry.store.ts`, `entry-form.component.*`, `draft.store.ts`, shell.
- UX: no dedicated mockup; follow DESIGN.md dialog note (M3 dialog elevation and scrim) and EXPERIENCE.md "Delete confirmation"; the menu follows `mock-03-history.svg` overflow dots.

## Tasks & Acceptance

**Execution:**
- [x] `shared/strings.ts` + spec -- delete copy en/it -- AC1
- [x] `features/history/delete-entry-dialog.component.*` + spec -- dialog, focus, Esc, in-flight, failure; matrix audit -- AC1-AC4
- [x] `features/history/history.component.*` + spec -- Delete in the overflow menu for Entry rows -- AC1, AC3
- [x] `features/history/history-day.component.*` + spec -- Delete button, close after delete; then `UX check` -- AC1, AC3

**Acceptance Criteria:**
- Given the overflow menu or Entry edit, when Delete is chosen, then the confirmation dialog opens with Cancel focused, focus trapped and restored on close.
- Given Cancel, then the Entry is untouched.
- Given a confirmed delete, then the Entry disappears, the Day shows as missing in History, and today's missing banner reappears when it was today's.
- Given the delete cannot reach the server, then an error shows, nothing is removed and Delete can be retried.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Layer | Finding | Verdict | Route | Evidence |
|-------|---------|---------|-------|----------|
| gap | No test of focus after the History Delete dialog closes | low | patch | Two tests added (Cancel, confirmed delete) |
| gap | Failed-delete focus on Delete untested | low | patch | Failed-delete spec asserts focus |
| edge | Esc dead after a click on dialog text moves focus to body | medium | patch | Esc now listened on the document |
| edge | Dialog destroyed mid-request emits on a destroyed output | medium | patch | `DestroyRef` flag; test added |
| edge | Focus drops to body after a confirmed delete from the menu | low | patch | Falls back to the host (`tabindex=-1`) |
| edge | `remove` rejects and leaves the dialog stuck | false | rejected | `EntryStore.remove` returns an `EntryResult` and does not throw |
| edge | Delete pressed while an Entry save is in flight | low | rejected | Needs a `saving` output on `EntryFormComponent`, which the spec forbids changing |
| edge | `remove` ok after a session change | low | rejected | The store discards stale results; the session reset empties the list anyway |
| blind | Scrim or Cancel clicks bubble into Entry edit's click handler | false | rejected | The scrim class is `backdrop`; the handler only reacts to `.scrim` |
| blind | Inline error color on the menu item, repeated strings, no `aria-live` on "Deleting…", no scroll lock or `inert` | low | rejected | Overlay menu is outside style encapsulation; the rest is cosmetic and `aria-busy`-level polish |
| blind | Failure message ignores the error code | low | rejected | Spec asks for one message |

## Verification

**Commands:**
- `npm run check` -- expected: lint, unit tests and lint-rule tests pass (rules tests need the Firestore emulator; run when its port is free)

**Manual checks:**
- `UX check`: run the app, open the dialog from the menu and from Entry edit at 360, 768, 1280 px, in en and it; check scrim, focus ring on Cancel, error state.
