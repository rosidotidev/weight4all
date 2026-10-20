---
title: '3-3 See and edit all three values everywhere'
type: 'feature'
created: '2026-10-20'
status: 'done'
baseline_commit: '4376c367dab4cd426f9fbc3157ee44ae2cb11100'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/DESIGN.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Weight, Mood and Sleep are in the registry, but History rows and the Today "Last entries" list show Mood as a bare number where the mockups show a face, Sleep as "8.0 h" where they show "8 h", and nothing proves that all three values show, edit and average correctly (FR-17, FR-29).

**Approach:** Make the two row lists share one cell builder that draws Mood as a small face with its number, then audit with tests, without changing the form, the store or the This week card's code.

## Boundaries & Constraints

**Always:** New `shared/entry-cells.ts` (`entryCells(entry, locale)` returning `{ key, text, face }[]` for every registry Dimension, `face` = the Mood number for an `input: 'faces'` Dimension, else `null`) replaces the duplicated `cells` in `history.component.ts` and `recent-entries.component.ts`; the History row's accessible summary keeps using `text`. New `shared/mood-face.component` (26 px drawn face, same colors and mouth curve as `mood-faces`, no ring; the mouth curve helper is shared with `mood-faces.component`). Row look from `mock-03-history.svg`, `desktop-01-today.svg` and DESIGN.md "History row": face then its number in the row value weight; an absent value is an em dash in `--w4a-outline`, never 0. A Dimension whose registry entry has `rowMinDecimals` (Sleep: 0) shows `8 h` and `7.5 h` in rows, while the Entry form keeps "6.0 h"; Italian uses the decimal comma (`7,5 h`, `72,4 kg`). Entry edit (`history-day`) already uses the one form: it must show and save all three values, Weight stays required, Mood and Sleep can be added, changed or cleared, and an Entry without Sleep opens with the cleared slider, not 6.0. The This week card keeps iterating the registry: averages from Real entries only, "No data" for none. Add `rowMinDecimals?: number` to `Dimension` and `formatNumber` gets an optional minimum-decimals argument. Colors only from tokens.

**Never:** No change to `EntryStore`, `DraftStore`, the form, `week-card.component.ts`, `firestore.rules` or the shell; no chart; no Mood face in the Entry form beyond what 3.1 built.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Full row | Entry 72.4 kg, mood 7, sleep 7.5 | History and Last entries show "72.4 kg", face 7 with "7", "7.5 h" | N/A |
| Weight only | Entry 72.9 kg | Mood and Sleep are em dashes, never 0 | N/A |
| Whole hours | sleep 8 | Row shows "8 h"; the form shows "8.0 h" | N/A |
| Italian | sleep 7.5, weight 72.4 | "7,5 h", "72,4 kg" | N/A |
| Edit, no Sleep | Open Entry without sleep | Slider cleared; save keeps no `sleep` | N/A |
| Edit, add values | Weight-only Entry, add mood 4 and sleep 7 | Saved Entry has all three | N/A |
| Edit, clear | Entry with mood and sleep, clear both | Saved without them; Weight stays required | N/A |
| This week | Entries with and without Mood and Sleep | Averages from Real values only; "No data" when none | N/A |

</frozen-after-approval>

## Code Map

- `src/app/shared/entry-cells.ts` (+ spec) -- new; extracted from `history.component.ts` `cells` and `recent-entries.component.ts` `cells`.
- `src/app/shared/mood-face.component.*` (+ spec) -- new; share the mouth helper with `mood-faces.component.ts`.
- `src/app/features/history/history.component.{ts,html,scss}`, `src/app/features/today/recent-entries.component.{ts,html,scss}` (+ specs) -- use the builder, draw the face.
- `src/app/domain/number.ts`, `domain/dimensions.ts` (+ specs) -- `minDecimals`, `rowMinDecimals`.
- `src/app/features/history/history-day.component.spec.ts`, `features/today/week-card.component.spec.ts` -- audit tests only.
- UX: `mock-03-history.svg`, `desktop-01-today.svg`; DESIGN.md "History row".

## Tasks & Acceptance

**Execution:**
- [ ] `domain/number.ts`, `domain/dimensions.ts`, `shared/entry-cells.ts` + specs -- minimum decimals, shared builder
- [ ] `shared/mood-face.component.*`, `mood-faces.component.ts` + spec -- small face
- [ ] History and recent-entries -- use builder and face; tests for the matrix rows
- [ ] `history-day`, `week-card` specs -- Edit and This week audit; matrix audit, then `UX check`

**Acceptance Criteria:**
- Given an Entry with all three values, when History or Last entries shows it, then Weight, the Mood face with its number and Sleep show.
- Given a Weight-only Entry, then Mood and Sleep are em dashes and never 0.
- Given an existing Entry, when edited, then Mood and Sleep can be added, changed or cleared; Weight cannot be cleared; no Sleep opens the cleared slider.
- Given Mood and Sleep in the registry, then This week shows their averages or "No data" with no change to the card's code.
- Given Italian, then Weight and Sleep use the decimal comma.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Layer | Finding | Verdict | Route | Evidence |
|-------|---------|---------|-------|----------|
| blind | Face color tokens may be out of scope in lists | false | rejected | `--w4a-mood-face-*` are global in `_tokens.scss` |
| blind | Sleep formatted three ways (row, form, average) | low | rejected | Rows follow the mockups ("8 h"); form and averages keep one decimal by design |
| blind | Out-of-range or null values in `entryCells` and `mouthPath` | low | rejected | Rules and `EntryStore.fromDoc` only let valid numbers through |
| blind | Duplicated cell markup in two lists | low | rejected | Two small templates; the logic is shared in `entryCells` |
| blind | Casts in `entryCells` | low | rejected | Same pattern as the code it replaced |
| edge | `rowMinDecimals` above `decimals` throws | low | rejected | Not reachable with the registry |
| edge | Stored mood outside 1 to 10 draws a bad face | low | rejected | Rules and `fromDoc` prevent it |
| gap | "Changed" leg of Mood and Sleep edit untested | medium | patch | Test added in `history-day` |
| gap | Exact mouth geometry unpinned | low | rejected | Same helper as the 3.1 faces, whose spec checks ten distinct mouths |
| gap | Weight-cleared and "No data" assertions loose | low | rejected | Enough for the rule they prove |

## Verification

**Commands:**
- `npm run check` -- expected: lint, unit tests and lint-rule tests pass

**Manual checks:**
- `UX check`: compare History and Last entries rows with `mock-03-history.svg` and `desktop-01-today.svg`.
