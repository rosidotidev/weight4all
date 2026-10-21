---
title: 'Story 5.2: Never rely on color alone'
type: 'feature'
created: '2026-10-21'
status: 'done'
baseline_commit: 'cb25a0b'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md', '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/DESIGN.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Mood faces, chips, the Language segments, the accent swatches and the charts must carry meaning without color, for readers with low vision or color blindness. Nothing checks this today.

**Approach:** Audit each named control in the code, record what already carries a non-color cue with file and line, and fix any gap. Verify in grayscale: a Playwright run in Chromium applies a CSS grayscale filter to each screen and saves a screenshot, which is then checked by eye. The accent contrast is covered by the existing AD-10 test in `tests/lint/theme.spec.ts`.

## Boundaries & Constraints

**Always:** Each cue is a shape, a number or a check mark, not a color change. The accent contrast test is not weakened. Screenshots are saved outside the repository.

**Never:** Change a color value or a palette to make the grayscale pass. Mark a screen as checked without its screenshot. Commit screenshots.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Mood faces in grayscale | Mood with a value selected | Every face shows its number; the selected face has a ring | N/A |
| Report chips in grayscale | Range 30 d selected | Selected chip shows a check mark | N/A |
| Language segments in grayscale | Language segment selected | Selected segment shows a check mark | N/A |
| Accent swatches in grayscale | An accent selected | Selected swatch shows a check mark | N/A |
| Charts in grayscale | Weight, Mood and Sleep with a Gap | Lines carry different markers; Gaps are dashed; the table is present | N/A |
| Accent contrast | Each of the six accents | AA holds for text and essential graphics | Existing AD-10 test fails the build |

## Code Map

- `src/app/shared/mood-faces.component.html:26` -- the number inside each face, `aria-hidden` because the value is also in the radio name; `:8` `aria-checked`; `mood-faces.component.scss` -- the selected ring.
- `src/app/features/report/report.component.html:14-15` -- the check mark on the selected Range chip.
- `src/app/features/settings/settings.component.html:27-41` -- the Language segmented control; `settings.component.scss:68-69` -- the check mark on the selected segment.
- `src/app/features/settings/settings.component.scss:110-117` -- the check mark on the selected swatch.
- `src/app/features/report/chart-config.ts:23,34,61-63` -- the dash for a Gap (`GAP_DASH`, `segmentDash`) and the marker per Dimension (`pointStyle`).
- `src/app/features/report/data-table.component.html:12-13` -- the table alternative with a caption.
- `tests/lint/theme.spec.ts:120-133` -- the AD-10 contrast test for each accent.
- `e2e/grayscale.spec.ts` -- new: applies `filter: grayscale(1)` to `html`, visits Today, Report and Settings, and saves one screenshot per screen to the scratch folder.

## Tasks & Acceptance

**Execution:**
- [ ] Audit: confirm each control in the Code Map carries a non-color cue; record any gap in Implementation Notes.
- [ ] `e2e/grayscale.spec.ts` -- new grayscale run, saves screenshots to the scratch folder.
- [ ] Grayscale review: view each screenshot and record the result per control in the spec.
- [ ] Fix any gap found, with the smallest change, then rerun the affected checks.

**Acceptance Criteria:**
- Given the Mood faces, chips, the segmented control and the swatches in grayscale, when viewed, then faces carry numbers and selected chips, segments and swatches carry a check mark.
- Given the charts in grayscale, when viewed, then lines carry markers, Gaps carry dashes and each chart's data is available as a table.
- Given each of the six accents, when the contrast audit runs, then text and essential graphics meet AA (existing AD-10 test).

## Verification

**Commands:**
- `npx playwright test e2e/grayscale.spec.ts` -- expected: the run passes and saves the screenshots.
- `npm run test:lint` -- expected: all pass, including the AD-10 contrast tests.
- `npm run lint` -- expected: no errors.
- `npx ng test --watch=false` -- expected: all pass.
- `npm run build` -- expected: build succeeds.

**Manual checks (if no CLI):**
- Each saved screenshot viewed: the cues listed in the I/O matrix are visible without color.

## Grayscale Review Results

Run: `npx playwright test e2e/grayscale.spec.ts` (Chromium, 390 px, English): 1 passed. Screenshots in the scratch folder, not in the repository:
- `today-mood-grayscale.png`: every Mood face shows its number; the selected face (7) has a ring. Pass.
- `report-chart-grayscale.png`: the selected chip "30 d" has a check mark; the three lines carry three different markers (circle, square, triangle); Gaps are dashed; the "Show data as table" control is present. Pass.
- `settings-grayscale.png`: the selected Language segment "English" has a check mark; the selected accent swatch has a check mark. Pass.

Known limit, not a gap in the criteria: in grayscale the five unselected swatches look identical. Each swatch's accent name is its accessible label (`aria-label`), so a screen reader user gets it; a sighted low-vision user identifies the accents only by color, which is inherent to a color picker.

AD-10 contrast: covered by `tests/lint/theme.spec.ts` (existing, unchanged).
