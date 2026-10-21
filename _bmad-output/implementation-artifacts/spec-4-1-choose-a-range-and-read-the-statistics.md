---
title: 'Story 4.1: Choose a Range and read the Statistics'
type: 'feature'
created: '2026-10-21'
status: 'review'
baseline_commit: '654ce2e76ab2f18e49054f8f8f8466452c7b86f3'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md', '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/DESIGN.md', '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/EXPERIENCE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Report tab is a placeholder. Bob cannot pick how far back to look or read Weight, Mood and Sleep numbers for a period.

**Approach:** Replace the placeholder with a Range selector (7 d, 30 d, 90 d, 1 y, All; default 30 d) and one Statistics card per registry Dimension (Average, Min, Max, Change) computed only from Real entries inside the Range. The Range drives the Statistics and, in later stories, every chart.

## Boundaries & Constraints

**Always:** Real entries only (a value present for that Dimension) feed every Statistic. A Dimension with no Real entry in the Range shows "No data", never 0. One decimal everywhere. Minus sign U+2212 in deltas. Range resolution goes through `resolveRange`. Dimensions come from the registry in `domain/dimensions.ts`; adding one must not change the card's code. All UI text comes from `strings.ts` in both Languages. Only `core/data` touches Firebase.

**Never:** Charts (Chart.js, combined or per-Dimension, dashed Gaps) — Stories 4.2 and 4.3. Empty-state and sparse-state copy beyond "No data" per Statistic — Story 4.4. Phone, tablet and desktop layout verification — Story 4.5. Custom start and end Day (FR-18 note). Persisting the chosen Range across sessions.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Default | Report opens, no chip touched | 30 d selected; Statistics cover the 30 Days ending today | N/A |
| Gap in Range | Weight logged on 2 Days, Mood on 1 Day in 30 d | Weight average uses only its 2 values; Mood uses its 1 value | N/A |
| Single Real entry | One Entry with Mood only | Mood Average = Min = Max = that value, Change = 0.0; Weight and Sleep "No data" | N/A |
| No entries | No Entry in the Range | All Statistics "No data" | N/A |
| All | Entries from 2026-01-05, today 2026-10-20 | Range 2026-01-05 to 2026-10-20; first Entry boundary included | With no Entry at all, Range is today only |
| Boundary | Entry exactly 7 Days ago and one 8 Days ago, 7 d chosen | 8-Days-ago Entry excluded | N/A |

## Code Map

- `src/app/domain/day.ts` -- `resolveRange`, `enumerateDays`, `RangeId` already exist; reuse, do not change.
- `src/app/domain/stats.ts` -- holds `average`; extend with `minimum`, `maximum`, `change` and `formatStat`, and a per-Dimension Statistics function over Entries in a Range.
- `src/app/domain/stats.spec.ts` -- extend with gaps, single entry, no entries and Range boundaries including `all`.
- `src/app/domain/dimensions.ts` -- `DIMENSIONS` registry (key, unit, decimals, labelKey, chartToken); the card iterates it.
- `src/app/core/data/entry.store.ts` -- `entries` signal (`Record<DayKey, Entry>`), read only.
- `src/app/core/state/clock.service.ts` -- `today` signal.
- `src/app/features/report/report.component.{ts,html,scss}` -- replace the placeholder; owns the selected Range signal and renders chips and Statistics cards. Reference: `features/today/week-card.component.*` for card styling and `average` usage.
- `src/app/shared/strings.ts` -- remove `reportPlaceholder` (only used by the placeholder); add Range chip labels, "last N days", "all time", stat captions and "No data" in en and it.
- `src/styles/_tokens.scss` -- `--w4a-chart-weight` (circle), `--w4a-chart-mood` (square), `--w4a-chart-sleep` (triangle) for stat markers; surface and primary-container tokens for chips.
- `_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/mockups/mock-04-report.svg` and `tablet-02-report.svg` / `desktop-02-report.svg` -- visual reference: chips row, three Statistics cards in a row on tablet and desktop. The combined chart and mini charts in these mockups are owned by Story 4.2 and 4.3, which this story leaves out.
- DESIGN.md `components.range-chip`, `components.range-chip-selected`, `components.stat-card`; EXPERIENCE.md Range and Statistics rules.

## Tasks & Acceptance

**Execution:**
- [ ] `src/app/domain/stats.ts` -- add `minimum`, `maximum`, `change` (last minus first, 0 for one value, null for none), `formatStat` (one decimal, unit when given, U+2212 for negative, "+" for positive change) and `dimensionStatistics(entries, from, to, dimension)` -- pure functions, Real entries only.
- [ ] `src/app/domain/stats.spec.ts` -- unit tests for the functions above covering gaps, single Real entry, no entries, and Range boundaries including `all`.
- [ ] `src/app/shared/strings.ts` -- add keys in en and it; remove `reportPlaceholder`.
- [ ] `src/app/features/report/report.component.ts` -- `range` signal default `'30d'`; `from`/`to` via `resolveRange(range, clock.today(), firstDay)` where `firstDay` is the smallest Entry key or `null`; computed Statistics per registry Dimension.
- [ ] `src/app/features/report/report.component.html` -- radiogroup of five chips (check mark on selected); one Statistics card per Dimension with marker, name, "last N days" or "all time" caption, and four columns.
- [ ] `src/app/features/report/report.component.scss` -- chips and cards with tokens; cards stack on compact and sit in a row from medium up.

**Acceptance Criteria:**
- Given the Report opens, when nothing is chosen, then the 30 d chip is selected and the Statistics cover the last 30 Days ending today.
- Given a chip is tapped, when the Range changes, then every Statistic recomputes and only the chosen chip shows the check mark.
- Given the window is resized or rotated, when the layout changes, then the selected Range is kept.
- Given a Dimension with no Real entry in the Range, when its card renders, then each of its four values reads "No data".
- Given `all`, when there are Entries, then the Range starts at the earliest Entry's Day and ends today.
- Given the Language is Italian, when the Report renders, then chip labels, captions and "No data" are Italian from `strings.ts`.

## Implementation Notes

Decisions made at planning (not visible in the frozen intent):
- Change with one Real entry is 0; shown as "0.0" (no sign).
- Statistics show one decimal for every Dimension, including mood. The mockup's "Min 5" for mood is read against the epic's "one decimal everywhere" AC; the AC wins.
- Unit: Sleep values carry "h" in Average, Min and Max; Weight and Mood values carry no unit; Change carries the unit where the Dimension has one (kg, h). This follows the mockup.
- Caption: 7 d, 30 d, 90 d, 1 y read "last 7 days" ... "last 365 days"; All reads "all time". `[ASSUMPTION]` 1 y reads "last 365 days" rather than "last year".
- Italian chips: "7 g", "30 g", "90 g", "1 a", "Tutto". `[ASSUMPTION]` pending user confirmation, as the spine notes for Italian wording.
- Statistics read Entries from the store with no extra query; `EntryStore` is already loaded once (AD-5).
- Implementation deviation: the unit is shown on all four columns from the registry (e.g. "72.6 kg" for Weight Average), not the mockup's bare "72.6". Reason: the mockup rule needs a per-Dimension flag, and adding it to `dimensions.ts` breaks existing `toEqual` tests. Consistent with the This week card ("Avg weight 72.6 kg"). `[ASSUMPTION]` to confirm; at 375 px the value may wrap.
- 7 d boundary: `resolveRange('7d')` is today minus 6 Days through today, so an Entry 7 Days ago is excluded. Matrix row read accordingly.
- Not done: visual check against the mockups and the step-04 review loop.

## Verification

**Commands:**
- `npm run lint` -- expected: no errors.
- `npx ng test --watch=false` -- expected: all tests pass, including new stats tests.
- `npm run build` -- expected: build succeeds.

**Manual checks (if no CLI):**
- Report at 375 px width: chips and cards fit without horizontal scroll; the 30 d chip shows the check mark by default.
- Switching chips updates the four values on each card; a Dimension with no data shows "No data".
- Italian Language: chips and captions read in Italian.
- UX check: compare against `mock-04-report.svg` (phone) and `tablet-02-report.svg`: chip row order and labels, card column layout; chart area intentionally absent until Stories 4.2 and 4.3.
