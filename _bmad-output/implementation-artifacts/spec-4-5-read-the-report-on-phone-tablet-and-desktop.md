---
title: 'Story 4.5: Read the Report on phone, tablet and desktop'
type: 'feature'
created: '2026-10-21'
status: 'review'
baseline_commit: '4541a4f'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md', '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/DESIGN.md', '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/EXPERIENCE.md', '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-bmad612_home-2026-10-19/ARCHITECTURE-SPINE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Report has the right parts but no window-size layout, and a chart's numbers can only be read from the picture. Bob needs the Report readable on a phone, a tablet and a desktop, and every chart needs a text alternative.

**Approach:** Compact stacks chips, the combined chart, the per-Dimension charts and then the Statistics. Medium and expanded put the Statistics beside the combined chart (about two thirds and one third on expanded) with the three per-Dimension charts in a row below. Each chart has a "Show data as table" control that lists the Days and values built from the same series.

## Boundaries & Constraints

**Always:** Layout by the window classes from `window-class.ts` thresholds (600 px and 840 px) through media queries that use the same values. The selected Range is kept on resize. The table is built from the same `SeriesPoint`s as the chart, with an em dash for a Day without a value. The table toggle is a button with `aria-expanded` and `aria-controls`, the table scroll region is keyboard focusable and has a label, and each control is at least 44 px high. Colors only from tokens. No horizontal page scroll at 360, 768 and 1280 px. Text from `strings.ts` in both Languages.

**Never:** Changing the chart colors, the marker shapes, or the dash rule. Recomputing anything per chart point in the template (values come from the series). A second data load. A custom Range. Row tap-to-highlight (deferred per EXPERIENCE.md).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Compact, 360 px | Any Range with data | Single column: chips, combined card, the three chart cards, then the three Statistics cards; no horizontal scroll | N/A |
| Medium, 768 px | Any Range with data | Chips on top; combined chart (3/5) with the Statistics cards beside it (2/5); three charts in a row below | N/A |
| Expanded, 1280 px | Any Range with data | Combined chart (2/3) with Statistics (1/3) beside it; charts in a row below | N/A |
| Resize across a class | Range 90 d chosen, window resized | Layout changes; Range stays 90 d | N/A |
| Show data as table | Table toggle pressed on the combined chart | Table with a Day column and one column per Dimension; em dash for Days without a value; `aria-expanded` true | N/A |
| Table for a Dimension | Toggle on Sleep chart | One value column; rows match the chart's Days | N/A |
| No data for a Dimension | Sleep none in Range | Sleep card shows its text; its table row values are em dashes | N/A |
| Year of Entries | 1 y Range, Entries every day | Table toggle works; Range switch recomputes without an obvious freeze | N/A |

## Code Map

- `src/app/domain/series.ts` -- add `tableCells(series, format, emptyText)`: one string per Day, the formatted value or the empty text.
- `src/app/domain/series.spec.ts` -- `tableCells` tests (values, em dash for a Gap, every Day listed).
- `src/app/features/report/data-table.component.{ts,html,scss}` -- new: "Show data as table" toggle and the table (Day plus one column per Dimension), keyboard operable.
- `src/app/features/report/report.component.{ts,html,scss}` -- layout wrapper; the table data for the combined and per-Dimension charts; media queries for the three window classes.
- `src/app/shared/strings.ts` -- "Show data as table", "Hide table", "Day" and the empty-value text in en and it.
- `src/styles/_tokens.scss` -- read only.
- `_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/mockups/mock-04-report.svg`, `tablet-02-report.svg`, `desktop-02-report.svg` -- visual reference for placement; the mockups' tablet "three Statistics in a row" is superseded by the epic AC recorded below.

## Tasks & Acceptance

**Execution:**
- [ ] `domain/series.ts` and `series.spec.ts` -- `tableCells` and its tests.
- [ ] `strings.ts` -- add keys in en and it.
- [ ] `data-table.component.*` -- toggle and table, keyboard operable.
- [ ] `report.component.*` -- the layout wrapper, the Statistics and chart placement per window class, and a table on the combined chart and on each per-Dimension chart.

**Acceptance Criteria:**
- Given compact windows, when the Report shows, then everything stacks: chips, combined chart, per-Dimension charts, then Statistics.
- Given medium and expanded windows, when the Report shows, then chips sit on top, the combined chart has the Statistics cards beside it (about two thirds and one third on expanded), and the three charts sit in a row below.
- Given widths of 360, 768 and 1280 px, when the Report is loaded, then all charts and Statistics are fully visible, axis labels are legible and no horizontal page scrolling is needed.
- Given each chart, when "Show data as table" is used, then a table of Days and values built from the same series is shown and keyboard operable.
- Given a year of Entries, when the Report renders and a Range is switched, then it does not visibly freeze.

## Implementation Notes

Decisions made at planning (not visible in the frozen intent):
- Superseded line from Story 4.1 Tasks: the Statistics cards are no longer "in a row from medium up". The 4.5 acceptance criterion puts them beside the combined chart on medium and expanded, so from medium up they form a single column to the right of the combined chart, and each card shows its four values in a 2 by 2 grid there. On compact they stack in one column after the charts.
- Split: medium uses 3 fr for the combined chart and 2 fr for the Statistics; expanded uses 2 fr and 1 fr. `[ASSUMPTION]` medium's exact split, the epic gives only expanded's. At 600 to 700 px the Statistics column is narrow; values may wrap onto two lines (`overflow-wrap: anywhere`).
- The layout is one grid with explicit placement (combined in column 1, Statistics in column 2, the chart row across both columns). It is a plain stack when the Report has no data (the empty message), so the Statistics do not sit beside nothing.
- The per-Dimension charts use three columns from medium up, one column on compact.
- Table: a `button` toggle with `aria-expanded` and `aria-controls`; the table lives in a `div` with `tabindex="0"`, a label and `max-height` so long Ranges scroll inside the card, not the page. Values use `formatStat` with the Dimension unit, the same rule as the Statistics, and an em dash for Days without a value.
- Chart.js `animation: false` remains (Story 4.2): no animation to freeze on a year of Entries.
- Verification: the layout and the table were checked by reading the CSS and template against the acceptance criteria; the app was not run in a browser (Firebase sign-in and emulators are not available in this environment). Browser checks at 360, 768 and 1280 px are still required.
- Not done here: row tap-to-highlight (deferred per EXPERIENCE.md) and any change to the Statistics values.

## Verification

**Commands:**
- `npm run lint` -- expected: no errors.
- `npx ng test --watch=false` -- expected: all tests pass, including the `tableCells` tests.
- `npm run test:lint` -- expected: all pass (no color literals in the new component or its styles).
- `npm run build` -- expected: build succeeds; Chart.js stays in the Report lazy chunk.

**Manual checks (if no CLI):**
- Browser at 360 px, 768 px and 1280 px: chips, charts and Statistics fully visible; no horizontal scroll; layout matches the criteria above.
- "Show data as table" on the combined chart and on one per-Dimension chart: Days and values match the chart; keyboard reaches the toggle and the table.
- Italian Language: toggle, table headers and the empty value read in Italian.
