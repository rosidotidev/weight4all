---
title: 'Story 4.2: See each Dimension on its own chart with dashed gaps'
type: 'feature'
created: '2026-10-21'
status: 'review'
baseline_commit: 'e3c687d'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md', '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/DESIGN.md', '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/EXPERIENCE.md', '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-bmad612_home-2026-10-19/ARCHITECTURE-SPINE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Report shows Statistics but no picture of how Weight, Mood and Sleep move over the Range. A Day with no value must never look like a value.

**Approach:** One line chart per registry Dimension, drawn by Chart.js 4.5.1 through ng2-charts and loaded with the Report route. A pure series per Dimension gives one value or `null` per Day, and one `chartDataset` helper turns it into a line: solid between consecutive Real entries, dashed over any Gap, a marker at every Real entry in the Dimension's token color.

## Boundaries & Constraints

**Always:** A Day without a Real value is `null`, never 0. Segments are solid between consecutive Real entries and dashed when a Gap lies between them; a Gap in one Dimension dashes only that Dimension's line. Markers: circle for Weight, square for Mood, triangle for Sleep, filled with the `--w4a-chart-*` token of the Dimension. Chart colors are read from those tokens at render time and never derive from the accent. Axis unit comes from the registry. Only `features/` imports `chart.js` or `ng2-charts`; Chart.js is registered inside the Report route, so it stays out of the initial chunk. Text through `strings.ts` in both Languages. Only `core/data` touches Firebase. Charts use `animation: false`.

**Never:** The combined chart (Story 4.3). Report-wide empty, sparse and error copy beyond the per-Dimension empty text in this story (Story 4.4). The "Show data as table" alternative, the compact and medium/expanded layout (Story 4.5). Color literals in components or domain code.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Gap in Weight | Weight on 2 Days with 3 Days between them, 30 d | Weight line: two markers, dashed over the Days between them; `bridgedFromPrev` true on the later point | N/A |
| Consecutive Days | Weight on 2 adjacent Days | Solid segment, `bridgedFromPrev` false | N/A |
| Missing Sleep on one Day | Sleep on Days 1 and 3, Day 2 Entry has no Sleep | Sleep dashed over Day 2 and 3; Weight and Mood unaffected | N/A |
| Missing Entry added | Day 2 Entry saved after the Day 2 gap | Store emits; series recomputes; the segment is solid | N/A |
| Single Real entry | One Mood value in the Range | One marker, no segment, no error | N/A |
| Dimension with no Real value | No Sleep in the Range | No canvas and no empty axes; text "No data in this Range" in the card | N/A |
| Range bounds | Entries on the first and last Day of the Range | Both included; days outside excluded | N/A |
| Axis bounds | Weight 70.0 to 72.0 | Axis from a little below 70.0 to a little above 72.0, never outside 20 to 400 kg | N/A |

## Code Map

- `src/app/domain/series.ts` -- new: `SeriesPoint`, `buildSeries(entries, from, to, dimension)` (one point per Day via `enumerateDays`, `bridgedFromPrev` on the point that ends a Gap), `axisBounds(dimension, series)` (clamped to the registry range, rounded to its step).
- `src/app/domain/series.spec.ts` -- new: gaps, adjacent Days, boundaries, single value, no value, axis bounds.
- `src/app/features/report/chart-config.ts` -- new: `chartDataset(dimension, series, options)` (`spanGaps: true`, `segment.borderDash` via `segmentDash`), `segmentDash(series, p1DataIndex)`, `lineOptions(bounds, ...)`.
- `src/app/features/report/chart-config.spec.ts` -- new: dataset values, `spanGaps`, `p0DataIndex` and `p1DataIndex` passed to the dash callback, colors from the passed token values.
- `src/app/features/report/dimension-chart.component.{ts,html,scss}` -- new: one ng2-charts `BaseChartDirective` line chart per Dimension, fixed height, `maintainAspectRatio: false`.
- `src/app/features/report/report.component.{ts,html}` -- provides Chart.js registerables via `provideCharts`; builds one series per Dimension from the Range; renders the charts between the chips and the Statistics cards.
- `src/app/shared/strings.ts` -- chart axis, aria label and "No data in this Range" text in en and it.
- `src/styles/_tokens.scss` -- read only: `--w4a-chart-weight`, `--w4a-chart-mood`, `--w4a-chart-sleep`, `--w4a-surface`, `--w4a-surface-variant`, `--w4a-on-surface-variant`.
- `_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/mockups/mock-04-report.svg` -- visual reference for chart placement; full compositions come in 4.5.

## Tasks & Acceptance

**Execution:**
- [ ] `src/app/domain/series.ts` and `series.spec.ts` -- `buildSeries` and `axisBounds`, pure, Real entries only.
- [ ] `src/app/features/report/chart-config.ts` and `chart-config.spec.ts` -- `chartDataset`, `segmentDash`, `lineOptions`; colors are parameters, so no DOM in the helper.
- [ ] `src/app/shared/strings.ts` -- add keys in en and it.
- [ ] `src/app/features/report/dimension-chart.component.*` -- ng2-charts line chart per Dimension: labeled value axis with the unit, marker per Real entry, token colors read through `getComputedStyle` on `:root` when rendering.
- [ ] `src/app/features/report/report.component.*` -- one series per Dimension for the Range; charts above the Statistics cards; per-Dimension empty text instead of a canvas when no Real value.

**Acceptance Criteria:**
- Given Chart.js 4.5.1 with ng2-charts loaded lazily with the Report route, when the Report opens, then one chart per registry Dimension is generated, each with a labeled value axis in its unit and a marker at every Real entry in its token color.
- Given `buildSeries` output with `value: number | null` per Day and `bridgedFromPrev` on the segment-ending point, when `chartDataset` builds a dataset with `spanGaps: true`, then segments between consecutive Real entries are solid and segments over a Gap are dashed.
- Given an Entry that lacks Sleep, when the charts draw, then only the sleep line is dashed over that Day and the other lines stay solid.
- Given the missing Entry is added and saved, when the store emits, then the dashed segment becomes solid.
- Given a series with null gaps, when the unit test runs, then it asserts the `p0DataIndex` and `p1DataIndex` the dash callback receives.
- Given the chart colors, when the accent changes, then the chart colors do not change (colors come only from the `--w4a-chart-*` tokens).

## Implementation Notes

Decisions made at planning (not visible in the frozen intent):
- Axis bounds: `axisBounds` takes the data span, pads it by 10 % or one registry step (whichever is larger), rounds to the registry `step` and clamps to the registry `min`/`max`. Reason: the literal full registry range (Weight 20 to 400 kg) would flatten every line. Story 4.3 reuses the same function, so the combined and the per-Dimension charts agree for the same series. `[ASSUMPTION]`.
- Axis title: the registry `unit` when present ("kg", "h"); Mood has none, so its axis title is the Dimension name.
- Markers: `pointStyle` circle, rect (square) and triangle; marker radius 4 at Real entries and 0 at Gaps; marker stroke uses `--w4a-surface` (1.5 px) so markers separate from lines.
- `segment.borderDash` returns `[6, 4]` when the point at `p1DataIndex` has `bridgedFromPrev`, else `undefined`.
- `animation: false` on every chart: no animation to freeze on a year of data and nothing to animate for reduced motion.
- The Report keeps the chips, then the charts, then the Statistics cards. Story 4.5 sets the final layout.
- Per-Dimension empty text is built per Dimension in strings.ts; the Report-level states are Story 4.4.
- Not done here: the combined chart, the table alternative, the Report-level empty and error states.

## Verification

**Commands:**
- `npm run lint` -- expected: no errors.
- `npx ng test --watch=false` -- expected: all tests pass, including `series.spec.ts` and `chart-config.spec.ts`.
- `npm run test:lint` -- expected: all pass (no color literals in components, layer rules).
- `npm run build` -- expected: build succeeds; `chart.js` appears in a lazy chunk, not the initial chunk.

**Manual checks (if no CLI):**
- Report with Weight entries on non-adjacent Days: the line is dashed between them and solid between adjacent ones.
- Italian Language: axis titles and empty text come from `strings.ts`.
