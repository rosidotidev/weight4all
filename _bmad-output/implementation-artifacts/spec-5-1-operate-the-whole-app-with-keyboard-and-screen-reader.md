---
title: 'Story 5.1: Operate the whole app with keyboard and screen reader'
type: 'feature'
created: '2026-10-21'
status: 'in-review'
baseline_commit: '54b1f15'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md', '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/EXPERIENCE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Keyboard and screen reader users cannot see where focus is on every control (no global focus rule), a saved or deleted Entry is not announced, and only the confetti of the Happy effect respects `prefers-reduced-motion`.

**Approach:** Add one global focus-visible rule and one global reduced-motion guard. Add a polite live region that announces "Saved" and "Deleted" in the current Language. Mark decorative icons hidden from assistive technology. Keep the existing dialog, Esc and form-focus behaviour, which already meets the epic.

## Boundaries & Constraints

**Always:** Keep the existing dialog, Happy effect and form behaviour unchanged. Text comes from `shared/strings.ts` in both Languages. Colors come from `--w4a-*` tokens only (no color literals). The announcement region is always in the DOM. The live region announces through `role="status"` with `aria-live="polite"`.

**Never:** Refactor the focus calls in login, register, reset, today and history into a shared helper (not required by any criterion). Change the copy or visuals of the Happy effect. Claim browser verification: the 200% zoom and phone-width checks need a signed-in session and are reported as not run.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Save succeeds | An Entry is saved from Today or History | The live region reads "Saved" (Italian: "Salvato") | N/A |
| Delete succeeds | An Entry is deleted in History | The live region reads "Deleted" (Italian: "Eliminato") | N/A |
| Save fails | The save returns an error | No "Saved" announcement; the existing field message and snackbar stay | Existing error display |
| Reduced motion | `prefers-reduced-motion: reduce` | Swipe reveal and Happy confetti do not move; no animation runs | N/A |
| Keyboard focus | Tab to any button, link or control | A 2 px outline in the primary token is visible | N/A |
| Language changes | Language switched to Italian | `<html lang>` is `it` and announcements use Italian | N/A |

## Code Map

- `src/styles.scss` -- add the global `:focus-visible` rule and the `prefers-reduced-motion` guard for transitions and animations; `.visually-hidden` already lives here.
- `src/app/features/today/happy-effect.component.scss` -- reference only: its `.piece` animation is already disabled under reduced motion.
- `src/app/features/history/history.component.scss` -- the swipe reveal transition (line ~50) is covered by the global guard; no edit here.
- `src/app/shared/strings.ts` -- new keys `announceSaved` and `announceDeleted` with en and it values.
- `src/app/shared/live-announcer.ts` -- new: an injectable service with a `message` signal and `say(text)`; each call sets the text so a repeat is announced again.
- `src/app/app.html` (or the root component template, located by the implementer) -- render `<div role="status" aria-live="polite" class="visually-hidden">{{ message() }}</div>` once.
- `src/app/features/today/today.component.ts` and `src/app/features/history/history-day.component.ts` -- call the announcer after a confirmed save (`onConfirmed`), using `announceSaved`.
- `src/app/features/history/history.component.ts` -- call the announcer with `announceDeleted` after a successful delete (near lines 83-102).
- `src/app/features/today/week-card.component.html` -- line 11 decorative svg: add `aria-hidden="true"`.
- `src/app/shared/entry-form.component.ts` -- reference only: first-invalid focus and per-field `aria-live` already exist.

## Tasks & Acceptance

**Execution:**
- [x] `src/styles.scss` -- global `:focus-visible` (2 px outline, primary token, 2 px offset) and reduced-motion guard -- one rule covers every control without per-component duplication.
- [x] `src/app/shared/strings.ts` -- add `announceSaved` and `announceDeleted` in en and it.
- [x] `src/app/shared/live-announcer.ts` -- new service and its spec -- a single polite region for save and delete outcomes.
- [x] Root template -- render the one live region -- always present for screen readers.
- [x] `today.component.ts`, `history-day.component.ts` -- announce "Saved" after a confirmed save.
- [x] `history.component.ts` -- announce "Deleted" after a successful delete.
- [x] `week-card.component.html` -- `aria-hidden` on the decorative svg.

**Acceptance Criteria:**
- Given the whole app on desktop, when only the keyboard is used, then every control shows a visible focus ring, Esc closes dialogs and the Happy effect, and dialogs trap and restore focus (existing behaviour, verified by the existing specs).
- Given a save or delete finishes, when it succeeds, then the outcome is announced through the polite live region in the current Language.
- Given `prefers-reduced-motion`, when the Happy effect plays or the swipe reveal runs, then nothing moves.
- Given `<html lang>`, when the Language changes, then it follows the Language (existing, covered by app.spec).

## Design Notes

Focus and announcement are kept global on purpose: one focus rule and one live region are less code than one per screen, and they cover controls that have no rule of their own today (for example the week card).

## Verification

**Commands:**
- `npm run lint` -- expected: no errors.
- `npm run test:lint` -- expected: all pass (no color literals in the new styles or service).
- `npx ng test --watch=false` -- expected: all tests pass, including the live-announcer spec and the matrix rows covered by the save and delete specs.
- `npm run build` -- expected: build succeeds (the initial-bundle warning already exists).

**Manual checks (if no CLI):**
- Browser at 200% zoom and at 360 px: no content hidden, no horizontal scroll. Not run in this session (needs a signed-in browser session).
- Tab through Today and History: focus ring visible on every control. Not run in this session.


## Implementation Notes

- Focus and reduced motion are global in `src/styles.scss`: one `:focus-visible` rule (2 px `--w4a-primary`, 2 px offset) and one `prefers-reduced-motion` guard that sets `animation` and `transition` to `none` on every element. The component-level focus rules in auth, the delete dialog and Entry edit already use the same values and were left as they are.
- `LiveAnnouncer` (`src/app/shared/live-announcer.ts`) clears the message and writes the new text 100 ms later, so a repeated "Saved" or "Deleted" is announced again. A second call within the gap replaces the first. The region is rendered once in `app.html` and is always in the DOM.
- Today announces "Saved" at the top of `showEffect`, before its past-Day early return, so every confirmed save is announced, not only today's. Entry edit (`history-day.component.ts`) announces in `onConfirmed`. Failed saves never reach `confirmed`, so they announce nothing.
- Deleting: the History list now routes the dialog's `deleted` output to `onDeleted()`, which announces "Deleted" and then closes as before. Cancel still only closes. The Code Map named only `history.component.ts`; Entry edit's delete (`history-day.component.ts` `onDeleted`) also announces, because the criterion covers any successful delete.
- `week-card.component.html`: the decorative check svg has `aria-hidden="true"`.
- Strings: `announceSaved` (Saved / Salvato) and `announceDeleted` (Deleted / Eliminato) in `strings.ts`.
- Tests added: `live-announcer.spec.ts` (empty start, delayed write, repeat, latest wins); Today spec (Saved after a confirmed save, nothing on failure); Entry edit spec (Saved on confirmed save, nothing on failure, Deleted on confirmed delete); History spec (Deleted after a confirmed delete, nothing on Cancel).
- Verification run: `npm run lint` clean; `npm run test:lint` 146 passed; `npx ng test --watch=false` 742 passed in 47 files; `npm run build` succeeds (the existing initial-bundle budget warning remains).
- Not run: the 200% zoom and 360 px checks, and a browser Tab walk through Today and History. Both need a signed-in session, so the focus ring and reflow are verified by rule only, not in a browser.

## Browser Check Results

Run in Chrome, signed in as the test account, against `localhost:4200`:
- Focus ring: Tab on Today shows the 2 px primary outline on the Report drawer item. Checked on one control only; a full Tab sweep of Today and History is still to do.
- 360 px (frame): single column, chips wrap, no horizontal scroll (scrollWidth 360).
- 768 px (frame): chart and Statistics side by side, three charts in a row below, no horizontal scroll.
- 200% zoom: checked as a 768 px CSS viewport, because `zoom` on the root element does not change the media-query width. Same result as 768 px.
- Known deviations (recorded in `deferred-work.md`): axis titles overlap tick labels on the combined chart at 360 and 768 px.
