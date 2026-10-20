---
title: '2-8 Edit an entry or add a forgotten day'
type: 'feature'
created: '2026-10-20'
baseline_commit: '065c989e940b28a6a0bea6f6b85e210d0834e742'
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

**Problem:** History rows link to a placeholder, so Bob cannot correct an Entry or add a Day he forgot (FR-12, UX-DR10, UX-DR19).

**Approach:** Make `/history/:dayKey` the Entry edit screen: the shared Entry form for that Day, full screen on compact and a dialog over the list on medium and expanded. Rows gain a swipe-left Edit action (touch) and an overflow menu with Edit.

## Boundaries & Constraints

**Always:** `:dayKey` is a child route of `history`, so the list stays mounted behind the dialog and keeps its scroll. A guard on the child redirects a malformed key (not round-tripping through `parseDayKey`/`dayKey`) or a key after `ClockService.today()` to `/history`. The screen uses `EntryFormComponent` unchanged for the Day (`DraftStore`, validation and save flow as on Today) and renders it only when `EntryStore.status()` is `ready`; while `loading` it shows skeleton cards, on `error` a message with Retry. Title: "Add entry for Mon 13 Oct" when the Day has no Entry, "Edit entry for Mon 13 Oct" otherwise (`formatDay`). Cancel, Esc, and a click on the dialog scrim drop the Day's draft and return to `/history`. A confirmed save of a past Day closes at once with no Happy effect; a confirmed save of today's Entry shows the existing Happy effect card, and closing it returns to `/history`. The dialog is `role="dialog"` `aria-modal`, labelled by the title, focus trapped (`cdkTrapFocus`), focus returns to the opener on close. Overflow button and "Edit" action are at least 44 px, with accessible names. Swipe applies to touch pointers only and keeps vertical scrolling; revealing is per Day and one row at a time. Window class comes from `LayoutService`. All copy in `strings.ts` en/it.

**Never:** No Delete, no confirmation dialog (Story 2.9). No change to `EntryStore`, `DraftStore`, `EntryFormComponent`, `domain/entry.ts` or the shell. No creating future Days. Mood and Sleep cards (Epic 3). No `Date` math outside `domain/day.ts`, no color literal outside `src/styles/`, no literal UI text in templates, no Dimension named outside the registry.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Edit existing | Tap row of 14 Oct | Form shows its stored weight, title "Edit entry for Tue 14 Oct" | N/A |
| Add missing | "+ Add" on 13 Oct | Registry defaults plus the form's last-Entry suggestion, title "Add entry for Mon 13 Oct" | N/A |
| Malformed key | `/history/abc`, `/history/2026-13-40` | Redirect to `/history` | N/A |
| Future key | `/history/<tomorrow>` | Redirect to `/history` | N/A |
| Save past Day | Valid weight, confirmed | Closes to `/history`; row shows the new value; no Happy effect | Failed save keeps dialog and typed values |
| Save today | Edit today's Entry, confirmed | Happy effect shows; Done returns to `/history` | N/A |
| Cancel | Cancel, Esc or scrim | Draft for the Day dropped, back to `/history` | N/A |
| Tab switch | Type, leave via a Tab, reopen the Day | Typed value is still there | N/A |
| Store not ready | status loading / error | Skeleton / message with Retry, no form | Retry reloads |
| Swipe | Touch drag left over 48 px | Row slides, "Edit" action shows; tapping it opens edit | Drag right or another row hides it |
| Overflow | Menu button on a row | Menu with "Edit"; Esc closes | N/A |
| Compact vs wide | Window class | Full screen under 600 px; centered dialog with scrim from 600 px | N/A |

</frozen-after-approval>

## Code Map

- `src/app/app.routes.ts` -- make `history/:dayKey` a child of a `history` route; add the guard (new `features/history/day.guard.ts`, `CanActivateFn` using `parseDayKey`, `dayKey`, `ClockService`, `Router.createUrlTree(['/history'])`).
- `src/app/features/history/history-day.component.ts` (+ spec) -- replace the placeholder with the Entry edit screen; realizes DESIGN.md Entry edit / dialog patterns and EXPERIENCE.md "Entry edit", "Missing Day, past". Reuse `HappyEffectComponent` (`features/today`), `happyEffect(day, value, entries)` from `domain/happy-effect.ts`, `EntryFormComponent` `confirmed` output, `DraftStore.drop`, `A11yModule` from `@angular/cdk/a11y`.
- `src/app/features/history/history.component.ts` (+ spec) -- add `RouterOutlet`; each row becomes a wrapper with the link plus overflow button; one shared `mat-menu` (`@angular/material/menu`) with `matMenuTriggerData`; swipe-reveal via pointer events; realizes `mockups/mock-03-history.svg` (three dots at x 358, swiped row with 84 px "Edit" tile, `primary` fill). Keep row height 62 / item size 70.
- `src/app/shared/strings.ts` + `strings.spec.ts` -- replace `historyDayPlaceholder`; add edit/add titles, Cancel, Edit, row menu button name, Edit action name. EXPERIENCE.md has "Swipe action Edit / Modifica", the add title; Italian for the rest is drafted here.
- Leave alone: `entry-form.component.ts`, `entry.store.ts`, `draft.store.ts`, shell.
- Mockup details owned elsewhere: Delete item in the menu (2.9), Mood and Sleep (Epic 3), top app bar title (shell).

## Tasks & Acceptance

**Execution:**
- [x] `features/history/day.guard.ts` + spec -- redirect malformed and future keys -- AC2
- [x] `app.routes.ts` -- nest `:dayKey` under `history` -- AC1
- [x] `shared/strings.ts` + spec -- new copy en/it -- AC1
- [x] `features/history/history-day.component.ts` + spec -- dialog/full-screen edit, title, states, cancel, save, Happy effect only for today; matrix audit -- AC1-AC6
- [x] `features/history/history.component.ts` + spec -- outlet, overflow menu, swipe reveal; then `UX check` -- AC1

**Acceptance Criteria:**
- Given a row tap, swipe-then-Edit, overflow Edit, or "+ Add", then Entry edit opens for that Day, full screen on compact and as a dialog on medium and expanded.
- Given a malformed or future `:dayKey`, then the guard redirects to `/history`.
- Given the store is ready, then an existing Entry shows its values and a missing Day shows the registry defaults.
- Given a confirmed save of a past Day, then History updates at once and no Happy effect shows; of today's Entry, then the Happy effect runs.
- Given Cancel, a confirmed save or Esc, then the Day's draft is dropped; typed values survive a failed save and a Tab switch.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Layer | Finding | Verdict | Route | Evidence |
|-------|---------|---------|-------|----------|
| gap | No test for focus return to the opener | low | patch | Added two `restoreFocus` tests |
| gap | Swipe tests use synthetic events; no `pointercancel` test | low | rejected | Every gesture starts with a new `pointerdown`; fix adds test scaffolding only |
| edge | Revealed row stays open after tapping the row link or "+ Add" | medium | patch | `remember()` now clears `revealed`; test added |
| blind | Italian prepositions differ between `historyEditFor` and `entryEditTitle` | low | patch | Both use "per" |
| blind | Esc closes the screen while a `mat-menu` is open | false | rejected | The menu's Esc handler calls `preventDefault`, and `onEscape` returns on `defaultPrevented` |
| blind | Guard does not re-run when only the param changes | false | rejected | Angular re-runs guards on `paramsChange` by default |
| edge | Cancel, Esc or scrim during an in-flight save | low | rejected | Needs a `saving` output on `EntryFormComponent`, which the spec forbids changing; the save still completes and History shows it |
| edge | Happy card stays when the param changes in place | low | rejected | Only reachable by editing the URL by hand; fix adds an effect |
| edge | Revealed row does not hide on scroll or outside tap; pen not supported | low | rejected | Cosmetic; fix adds handlers |
| edge | Opener recycled by the virtual scroll, focus falls to body | low | rejected | `restoreFocus` guards `isConnected`; a fallback target adds structure |
| edge | List behind the dialog not `inert` | low | rejected | `aria-modal` and a focus trap are in place; `inert` needs a wider change |
| edge | Midnight rollover, session change while the dialog is open | low | rejected | Rare; the dialog closes on the next navigation and the store resets drafts on session change |
| blind | Cancel, scrim discard typed text; no lower bound on year; duplicated styles; row sizes hard-coded | low | rejected | By spec (Cancel drops the draft); other points cosmetic |

## Verification

**Commands:**
- `npm run check` -- expected: lint, unit tests, lint-rule tests and rules tests pass

**Manual checks:**
- `UX check`: run the app, open History on compact and expanded widths; compare with `mock-03-history.svg` (overflow dots, swiped row with the 84 px Edit tile); open Entry edit for an existing and a missing Day and check the dialog and full-screen presentations, in en and it.
