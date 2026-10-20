---
title: '2-10 See "This week" on wide screens'
type: 'feature'
created: '2026-10-20'
baseline_commit: 'ba11f44650316794890d6b8bf66b2d4aac2570d6'
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

**Problem:** On a desktop Bob has no view of how the week is going next to the form (FR-29, UX-DR17).

**Approach:** On the expanded window class only, Today shows a right column: a "This week" card (the last 7 Days ending today) and the last 5 Entries. A new `domain/stats.ts` provides `average`.

## Boundaries & Constraints

**Always:** `domain/stats.ts` (+ spec) exports `average(values: readonly number[]): number | null` (`null` when empty). Two new components in `features/today/` (`.ts`, `.html`, `.scss`, spec): `week-card.component` and `recent-entries.component`. Both read `EntryStore.entries()` and `ClockService.today()`, so any confirmed save, edit or delete updates them with no extra code. Today renders them only when `LayoutService.windowClass() === 'expanded'` and the store is `ready`; the form column stays 600 px (`--w4a-form-column-width`) and the right column is 320 px, side by side and centered as a group (gap 32 px); compact and medium are unchanged. The card follows `desktop-01-today.svg`: title "This week", a range caption (`formatDay` without weekday, e.g. "12 Oct – 18 Oct"), a row of 7 day dots (weekday initial under each; filled primary dot with a white check when the Day has an Entry, outlined dot otherwise), the caption "N of 7 days logged", a divider, then one column per Dimension of the registry (caption from a `weekAverage` string taking the Dimension label: "Avg weight" / "Peso medio") with the average of real values only, formatted with `formatNumber` using `max(decimals, 1)` decimals and the unit; "No data" when `average` is `null`, never 0. The 7 Days come from `resolveRange('7d', today, null)` and `enumerateDays`. The card iterates `DIMENSIONS`; nothing names a Dimension. "Last entries · newest first" caption, then `recentEntries(entries, 5)` as compact non-interactive rows (`surface-container`, 52 px, rounded-md): date (`formatDay`), then one cell per registry Dimension with an em dash (`historyDash`) for an absent value, never 0. Card region has an accessible name; all text from `strings.ts` en/it; no color literal outside `src/styles/`; targets irrelevant (nothing is interactive).

**Never:** No change to `EntryStore`, `EntryFormComponent`, `DraftStore` or the shell; no new color or spacing literal; no Dimension named outside the registry; no per-day navigation from the list rows (History owns that); no chart.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Expanded, week with data | 6 Entries in the last 7 Days | "6 of 7 days logged", weight average of those 6, 6 filled dots | N/A |
| No Entry in the week | Entries only older | "0 of 7 days logged", "No data" for each Dimension, never 0 | N/A |
| No Entries at all | Empty store, `ready` | Card with "No data"; recent list shows the empty hint "Nothing logged yet." | N/A |
| Compact or medium | Width below 1024 | Neither card nor list rendered | N/A |
| Save, edit, delete | Confirmed store change | Card and list update | N/A |
| Future-dated Entry | Entry after today | Ignored by the card (only the 7 Days count) | N/A |
| Loading or load error | Store not `ready` | No right column | N/A |
| Italian | Language `it` | "Questa settimana", "6 giorni su 7 registrati", "Peso medio", "Nessun dato", comma decimals | N/A |

</frozen-after-approval>

## Code Map

- `src/app/domain/stats.ts` (+ spec) -- new; `average`. Epic 4 story 4.1 extends this file.
- `src/app/features/today/week-card.component.*` (+ spec) -- new; uses `resolveRange`/`enumerateDays`/`formatDay` (`domain/day.ts`), `DIMENSIONS`, `formatNumber` (`domain/number.ts`), `average`.
- `src/app/features/today/recent-entries.component.*` (+ spec) -- new; uses `recentEntries` (`domain/history.ts`), mirrors `history.component.ts` `cells()` for the per-Dimension text.
- `src/app/features/today/today.component.{ts,html,scss}` (+ spec) -- inject `LayoutService`; wrap form and aside in a flex group on expanded; banner stays above the form column.
- `src/app/shared/strings.ts` + spec -- week title, caption, count, `weekAverage`, no-data, recent heading and empty text.
- Leave alone: `entry.store.ts`, `entry-form.component.*`, `draft.store.ts`, shell, `domain/history.ts`.
- UX: `mockups/desktop-01-today.svg` (right column), DESIGN.md "This week card" and "History row" (compact style), EXPERIENCE.md "This week card".

## Tasks & Acceptance

**Execution:**
- [ ] `domain/stats.ts` + spec -- `average` -- AC2
- [ ] `shared/strings.ts` + spec -- en/it copy -- AC1-AC3
- [ ] `features/today/week-card.component.*` + spec -- card, dots, averages, "No data"; matrix audit -- AC2-AC5
- [ ] `features/today/recent-entries.component.*` + spec -- last 5 rows -- AC1
- [ ] `features/today/today.component.*` + spec -- expanded-only right column; then `UX check` -- AC1

**Acceptance Criteria:**
- Given an expanded window, when Today opens, then the card and last 5 Entries show on the right; on compact and medium they do not.
- Given `average`, then it returns the mean of the values, or `null` when there are none.
- Given the 7 Days ending today, then the card shows how many have an Entry and, per registry Dimension, the average of real values or "No data".
- Given an Entry is saved, edited or deleted, then the card and list update.
- Given a Dimension is added to the registry, then it appears without changing the card's code.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Layer | Finding | Verdict | Route | Evidence |
|-------|---------|---------|-------|----------|
| edge | `.logged` paragraph selector also styles `.dot.logged` | medium | patch | Paragraph renamed `.count` |
| edge | Aside fixed at 320 px squeezes the form between 840 and ~1200 px | medium | patch | Layout wraps; form keeps at least 360 px |
| edge | Recent list not bounded by today | low | patch | Filtered to Days up to today; test added |
| gap | Weekday initials never asserted | low | patch | en and it test added |
| blind | Italian "medio" gender, lowercase label in en | low | rejected | Only Weight exists; copy is per spec |
| blind | Count and average can disagree for an Entry with no values | false | rejected | Entries always carry the required weight |
| blind | Duplicated cast and unit formatting with History | low | rejected | Fix needs a new shared helper; not worth the surface now |
| blind | `max(decimals,1)` rule undocumented | low | rejected | Mockup shows one decimal for every average |
| blind | Dots `aria-hidden`; em dash has no text | low | rejected | The count caption carries the meaning; rows are informational |
| blind | Fixed 52 px row / 80 px date width | low | rejected | Mockup sizes; one Dimension today |
| blind | Identical `weekRange`, string count | false | rejected | Params are strings by project convention |
| edge | Weekday initial via charAt | low | rejected | Correct for en and it |
| edge | `days` empty guard | false | rejected | `resolveRange('7d')` always yields 7 Days |
| gap | Real LayoutService mapping untested here | low | rejected | Covered by `layout.service.spec.ts` |

## Verification

**Commands:**
- `npm run check` -- expected: lint, unit tests and lint-rule tests pass (rules tests need the Firestore emulator; run when its port is free)

**Manual checks:**
- `UX check`: run the app at 1280 px, compare with `desktop-01-today.svg` in en and it; confirm compact (360) and medium (768) show no right column.
