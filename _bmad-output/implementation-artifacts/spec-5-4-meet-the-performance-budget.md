---
title: 'Story 5.4: Meet the performance budget'
type: 'feature'
created: '2026-10-21'
status: 'review'
baseline_commit: '6695f27'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Nothing measures whether the app opens fast on a phone, stays quick on the Report with a year of Entries, and scrolls smoothly in History. Chart.js must also stay out of the first bundle.

**Approach:** A Playwright suite in Chromium, against the emulators, measures four budgets with the Chrome DevTools Protocol: CPU slowed 4x and a mobile network for Today; the time from a Range click to the Report's Statistics caption for 365 Entries; long tasks during a History scroll with 365 Entries; and the initial bundle. The measured numbers and the method are recorded in this spec. A miss is fixed or recorded as a known miss.

## Boundaries & Constraints

**Always:** Seed data only on the local Firestore emulator, with the batch write endpoint. Measure after sign-in, so the sign-in cost is not in the Today number. Use the same throttling for every run and record it.

**Never:** Change the budgets to pass. Run `npm run deploy`. Claim a measurement that was not run in this session.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Today opens on a mid-range phone | Signed in, CPU 4x slower, mobile network | Weight field is enabled within 3000 ms of the navigation | Test fails with the measured time |
| Range switch on Report | 365 Entries, switch from 30 d to 1 y | Statistics caption shows the new Range within 1000 ms | Test fails with the measured time |
| History scroll | 365 Entries, scroll through the list | No long task over 50 ms during the scroll | Test fails with the longest task |
| Chart.js in the first bundle | Production build | Chart.js is only in the Report's lazy chunk | Check fails with the chunk found |

## Code Map

- `e2e/performance.spec.ts` -- new: the four measurements, with CDP throttling and long-task observation.
- `e2e/support.ts` -- add a `seedEntriesBatch` helper that uses the Firestore `:batchWrite` endpoint for 365 Entries in one request.
- `src/app/app.routes.ts:49-53` -- the Report route is lazy (`loadComponent`); Chart.js registers inside `report.component.ts` (`provideCharts`).
- `dist/weight4all/browser` -- build output: the Report chunk holds Chart.js; the initial bundle does not.

</frozen-after-approval>

## Tasks & Acceptance

**Execution:**
- [ ] `e2e/support.ts` -- add `seedEntriesBatch` (365 Entries in batches of 500 or fewer).
- [ ] `e2e/performance.spec.ts` -- the four measurements with their method; print the numbers.
- [ ] Measure and record the numbers under Measured Results.
- [ ] Fix any miss with the smallest change, rerun, and record the new numbers.

**Acceptance Criteria:**
- Given a mid-range phone profile over a typical mobile connection, when a signed-in visitor opens the app, then Today is interactive within 3 seconds and Chart.js is not in the initial bundle.
- Given 365 seeded Entries, when a Range is switched on the Report, then every chart and Statistic updates within 1 second.
- Given 365 seeded Entries, when History is scrolled, then there is no visible jank (no long task over 50 ms during the scroll).
- Given the measurements, when the story completes, then the results and the method are recorded, and any miss is fixed or documented.

## Measured Results

**Method** (`e2e/performance.spec.ts`, Chromium, local emulators, 390 x 844 viewport, dev server on 4200, production build for the bundle check):
- Today: a fresh account is signed in first; then CDP `Network.emulateNetworkConditions` (latency 150 ms, download 1600 kbit/s, upload 750 kbit/s) and `Emulation.setCPUThrottlingRate` 4x are applied; then `/today` is reloaded. An init script records `performance.now()` (ms since navigation start) on the first frame where `#w4a-field-weight` exists and is not disabled. Budget 3000 ms.
- Report: 365 Entries seeded with `seedEntriesBatch` (one `:batchWrite`, days -364 to 0). Signed in, `/report` at the default 30 d, then the "1 y" chip clicked (no throttling). Time from the click event (capture phase) to the first moment `.card .caption` reads "last 365 days". Budget 1000 ms.
- History: 365 Entries seeded, `/history` shown, a PerformanceObserver on `longtask` installed, then 60 mouse-wheel steps of 400 px (50 ms apart) over the virtual list, then 300 ms more. Longest long task among those that started during the scroll. Budget 50 ms.
- Build: `npm run build`, then the files in `dist/weight4all/browser` are searched for Chart.js-only property names (`setDatasetVisibility`, `tooltipPosition`, `borderCapStyle`); the files `index.html` loads up front (`main-*.js`, `chunk-Bm0vVwaL.js`) must not contain them.

**Run 1 and Run 2** (`npx playwright test e2e/performance.spec.ts`):

| Measurement | Run 1 | Run 2 | Budget | Result |
|---|---|---|---|---|
| Today, Weight input enabled | 3715 ms | 3726 ms | 3000 ms | **MISSED** (both runs) |
| Report, 1 y click to caption | 148 ms | 134 ms | 1000 ms | pass |
| History, longest long task during scroll (0 of over 50 ms) | 0 ms | 0 ms | 50 ms | pass |
| Build, Chart.js in initial bundle | no (only `chunk-BTMPzbhs.js`, the Report chunk) | same | none | pass |

The Today budget is missed in both runs by about 0.7 s. Per the run instructions the budget is unchanged and no fix was made; the miss is open. The History scroll covered 24,000 px (scrollTop) in about 4.6 to 4.7 s. Note: `npm run build` prints an Angular warning that the initial bundle exceeds the 500 kB budget in `angular.json` (raw 1.10 MB, 597 kB over); the Chart.js check passes, but this warning was not addressed.

## Verification

**Commands:**
- `npx playwright test e2e/performance.spec.ts` -- expected: all four measurements pass, numbers printed.
- `npm run build` -- expected: Chart.js only in the Report chunk.
- `npm run lint` -- expected: no errors.
- `npx ng test --watch=false` -- expected: all pass.

**Manual checks (if no CLI):**
- None. The measurements are automated.

## Known Miss

- Today: 3715 ms and 3726 ms in two runs, and 4080 ms in a third run, against the 3000 ms budget. Missed by 0.7 to 1.1 s.
- Likely cause, not measured separately: the initial bundle is 1.10 MB raw (main 711 kB, a 335 kB chunk) and already exceeds the 500 kB Angular budget (the warning shown by `npm run build`). At 1600 kbit/s with 4x CPU slowdown, parsing and starting that bundle dominates. Chart.js is not in it, so it is not the cause of the miss.
- Decision: documented, not fixed in this story. The fix is to split the initial bundle (Firebase and Material pieces used only after sign-in) and is a separate story. The Playwright test is marked as an expected failure (`test.fail`) so the suite stays green and the miss stays visible; remove that line when the budget is met.
- Network throttling applies to the Today measurement only, as the Approach states. Report and History use the 390 px viewport only.
