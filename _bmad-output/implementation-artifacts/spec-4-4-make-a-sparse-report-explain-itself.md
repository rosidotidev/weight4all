---
title: 'Story 4.4: Make a sparse Report explain itself'
type: 'feature'
created: '2026-10-21'
status: 'review'
baseline_commit: '1be28a7'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md', '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/DESIGN.md', '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/EXPERIENCE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A Report with little or no data shows empty axes or broken charts, and a failed load looks like an empty account.

**Approach:** The Report explains each sparse state in words: no Entries at all gets a friendly message with a link to Today and no charts; a Dimension or a whole Range without Real values gets its text instead of a chart; one Real entry draws its point; a failed load shows an inline message with Retry while earlier data stays on screen.

## Boundaries & Constraints

**Always:** The empty-Report message is shown only once the Entries have loaded (status `ready`), never while loading, so it cannot flash. With no Entries at all, the charts are not drawn; Statistics still show "No data" per Dimension, as Story 4.1 requires. A Dimension with no Real value in the Range shows its friendly text instead of a canvas. A single Real entry draws its marker and Statistics without error. A failed load shows an `alert` with a Retry button that calls the store's `retry()`, and it keeps every Entry already loaded. Text comes from `strings.ts` in both Languages. The state decision is a pure function in `domain/`.

**Never:** Empty or error copy inside a chart canvas. Any Firebase call outside `core/data`. Clearing the Entries when a load fails. A new load path or a cache. Layout changes (Story 4.5).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| No Entries at all | Status ready, 0 Entries | "No data yet. Log a day on Today and your chart appears here." with an "Open Today" link; no charts; Statistics "No data" | N/A |
| Still loading | Status loading | Visually hidden status text "Loading your days"; no empty message, no charts | N/A |
| Entries, none in Range | Entries exist, none in the 7 d Range | Combined card shows "No data in this Range"; each chart card shows the same text; Statistics "No data" | N/A |
| Single Real entry | One Mood value in the Range | Its marker shows; Statistics show the value and change 0.0 | N/A |
| One Dimension empty | Sleep none in the Range, Weight present | Sleep card shows "No data in this Range"; Weight chart draws | N/A |
| Load fails with no Entries | Status error, 0 Entries | Alert "Entries could not be loaded." with "Try again"; no empty message | Retry calls `retry()` |
| Load fails with earlier Entries | Status error, Entries from the last load | Alert with "Try again" above the charts; charts and Statistics still show the earlier data | Retry calls `retry()` |
| Retry succeeds | Status goes to ready | Alert disappears; charts show the loaded data | N/A |

## Code Map

- `src/app/domain/series.ts` -- add `isEmptyReport(status, entryCount)`: true only when status is `ready` and there are no Entries.
- `src/app/domain/series.spec.ts` -- tests for `isEmptyReport` and a single Real value in a series.
- `src/app/features/report/report.component.{ts,html,scss}` -- injects the store's `status` and `retry`; computes the empty, loading, error and range-has-data states; renders the messages, the Retry button and the Today link.
- `src/app/shared/strings.ts` -- empty message, "Open Today", loading, error and "Try again" text in en and it.
- `src/app/app.routes.ts` -- read only: the Today route path is `today`.
- `src/app/core/data/entry.store.ts` -- read only: `status`, `entries`, `retry()`.

## Tasks & Acceptance

**Execution:**
- [ ] `domain/series.ts` and `series.spec.ts` -- `isEmptyReport` and a single-value series test.
- [ ] `strings.ts` -- add keys in en and it.
- [ ] `report.component.*` -- states and messages as in the matrix; Today link via `routerLink`.

**Acceptance Criteria:**
- Given no Entries, when the Report opens, then "No data yet. Log a day on Today and your chart appears here." is shown with a link to Today, and no empty axes are drawn.
- Given a single Real entry in the Range, when the Report renders, then its point and its Statistics show without error.
- Given a Dimension with no Real entry in the Range, when it renders, then its Statistics read "No data" and its chart shows the friendly state.
- Given the load fails, when the Report opens, then an inline message with Retry is shown and earlier data stays.

## Implementation Notes

Decisions made at planning (not visible in the frozen intent):
- The empty Report keeps the Statistics cards, which read "No data" for every Dimension, because Story 4.1 requires that for a Range with no Entries. Only the charts are replaced by the message.
- The message's link text is "Open Today" (en) and "Apri Oggi" (it). `[ASSUMPTION]` pending wording review, as the spine notes for Italian copy.
- The loading state shows only the visually hidden status text, not Statistics, so the Report never shows "No data" before the first load completes. `[ASSUMPTION]` the loading skeleton in EXPERIENCE.md is left to Story 5.x polish.
- The error alert text: "Entries could not be loaded." (en), "Non è stato possibile caricare le registrazioni." (it).
- The combined card keeps its footnote only when there is data to read it against.
- Not done here: the Report-level skeleton and any change to the store.

## Verification

**Commands:**
- `npm run lint` -- expected: no errors.
- `npx ng test --watch=false` -- expected: all tests pass, including `isEmptyReport` and the single-value series tests.
- `npm run test:lint` -- expected: all pass.
- `npm run build` -- expected: build succeeds.

**Manual checks (if no CLI):**
- Account with no Entries: the message and the Today link show, no axes.
- Account with Entries only outside the Range: "No data in this Range" on each chart card.
- Simulated load failure: the alert and Try again show; the charts keep the earlier data.
