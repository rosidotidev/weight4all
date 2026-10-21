---
title: 'Story 4.3: Compare the three Dimensions on one chart'
type: 'feature'
created: '2026-10-21'
status: 'review'
baseline_commit: '91e4693'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md', '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/DESIGN.md', '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/EXPERIENCE.md', '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-bmad612_home-2026-10-19/ARCHITECTURE-SPINE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Bob sees each Dimension on its own chart, but cannot see Weight, Mood and Sleep together to spot links between them.

**Approach:** One combined line chart above the per-Dimension charts. Each Dimension keeps its own value axis with real values (no normalization), its own color, marker and dash behavior, and its own legend entry; the same series and the same `chartDataset` helper as Story 4.2 build every line, so the combined and the per-Dimension charts agree.

## Boundaries & Constraints

**Always:** One independent y axis per Dimension with the registry unit, real values and no normalization. Axis bounds come from `axisBounds` for the same series, so the combined and the per-Dimension charts give the same bounds for a Dimension. Legend entries read "Weight (kg)", "Mood (1–10)", "Sleep (h)" in English and "Peso (kg)", "Umore (1–10)", "Sonno (h)" in Italian, built from the registry unit or range and the name in `strings.ts`. The footnote "Each line uses its own scale. Dashed = days without an entry." appears under the chart in both Languages. Lines differ without color by marker and by dash. A Gap in one Dimension dashes only that line. Chart colors come from the `--w4a-chart-*` tokens only.

**Never:** Normalizing values onto one scale. Report-level empty or error states (Story 4.4). The "Show data as table" alternative and the medium/expanded layout (Story 4.5). An annotation "no entries · bridged" (EXPERIENCE.md mentions it; not in the Story 4.3 acceptance criteria, deferred). Color literals in components.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| All three present | Weight, Mood and Sleep on the same Days, 30 d | Three lines, three axes, three legend entries, footnote | N/A |
| Gap in one Dimension | Sleep missing on Day 2, Weight and Mood present | Only the Sleep line dashed over Day 2 | N/A |
| Only Weight in Range | Weight present, Mood and Sleep none | Weight line drawn; Mood and Sleep datasets have no values and no bounds | N/A |
| Legend labels | Language English / Italian | "Weight (kg)" ... / "Peso (kg)" ... | N/A |
| Bounds agree | Same Range and series | Combined axis bounds equal the per-Dimension chart bounds | N/A |

## Code Map

- `src/app/features/report/chart-config.ts` -- add `legendLabel(name, dimension)` ("Name (unit)"; a Dimension without unit shows its registry range with an en dash).
- `src/app/features/report/chart-config.spec.ts` -- test `legendLabel` for a unit, a range and the separator.
- `src/app/features/report/combined-chart.component.{ts,html,scss}` -- new: one ng2-charts line chart with one linear axis per line: first on the left with gridlines, the others on the right.
- `src/app/features/report/report.component.{ts,html,scss}` -- builds the combined lines from the same `charts()` series and bounds; places the combined card above the per-Dimension charts with the footnote.
- `src/app/shared/strings.ts` -- footnote and the combined chart aria label in en and it.
- `src/app/domain/series.ts` -- read only (`axisBounds`, `buildSeries`).

## Tasks & Acceptance

**Execution:**
- [ ] `chart-config.ts` and `chart-config.spec.ts` -- `legendLabel`.
- [ ] `combined-chart.component.*` -- one chart, one dataset per Dimension via `chartDataset` with `yAxisID`, one axis per Dimension, legend on, footnote below it.
- [ ] `report.component.*` -- combined card first, with the same bounds and series as the per-Dimension charts.
- [ ] `strings.ts` -- footnote and aria label in en and it.

**Acceptance Criteria:**
- Given the combined chart, when it renders, then it uses one independent y axis per Dimension with real values, each line has its color, marker and legend entry ("Weight (kg) · Mood (1–10) · Sleep (h)" in the Dimension order), and the footnote "Each line uses its own scale. Dashed = days without an entry." is shown.
- Given the same `chartDataset` helper, when the combined and the per-Dimension charts are built, then their axis bounds come from the same `axisBounds` for the same series, so they agree.
- Given the chart legend and lines, when viewed without color, then lines remain distinguishable by marker and dashes.
- Given a Gap in one Dimension, when the combined chart draws, then only that line is dashed over the Day.

## Implementation Notes

Decisions made at planning (not visible in the frozen intent):
- Legend text is generated from the registry: `${name} (${unit})`, and for a Dimension with no unit `${min}–${max}`. Weight reads "Weight (kg)", Sleep "Sleep (h)", Mood "Mood (1–10)". No Dimension name appears in code, which keeps AD-3.
- Each y axis title is the registry unit, or the Dimension name when it has none (same rule as Story 4.2). `[ASSUMPTION]`.
- Axes: the first Dimension on the left with gridlines, the others on the right without gridlines. Chart.js stacks same-side axes; no custom offset.
- The combined chart uses the same `ChartCard` series and `axisBounds` results as the per-Dimension charts (built once in the Report), which makes "the bounds agree" true by construction.
- Legend uses Chart.js legend with `usePointStyle`, so the legend keeps the marker shapes.
- The combined card sits above the per-Dimension charts; Story 4.5 sets the final layout.
- Not done here: the annotation "no entries · bridged" (see Never) and the table alternative.

## Verification

**Commands:**
- `npm run lint` -- expected: no errors.
- `npx ng test --watch=false` -- expected: all tests pass, including the `legendLabel` tests.
- `npm run test:lint` -- expected: all pass.
- `npm run build` -- expected: build succeeds; Chart.js stays in the Report lazy chunk.

**Manual checks (if no CLI):**
- Report with Weight, Mood and Sleep on the same Days: three lines with distinct markers; the footnote shows below the chart.
- Switch to Italian: legend reads "Peso (kg) · Umore (1–10) · Sonno (h)" and the footnote is in Italian.
