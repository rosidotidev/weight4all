---
title: 'History rows: keep weight, mood and sleep in the same columns'
type: 'bugfix'
created: '2026-10-23'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** In History, the values inside each entry row are flex items sized by their content, so a row with "72.4 kg" and "7.5 h" puts the mood and sleep values at different x positions than a row with "100.25 kg" or "8 h". The columns do not line up down the list.

**Approach:** Lay out each entry row as a grid with one fixed date track and one equal track per registry Dimension, so every row shares the same column edges. Values never wrap or push neighbouring columns.

## Boundaries & Constraints

**Always:** Columns come from the `DIMENSIONS` registry, one track per Dimension in registry order. Keep the date, the overflow button, the Edit swipe action, the 62 px row height and the missing-day row unchanged. Keep the mockup `mock-03-history.svg` as the visual reference.

**Never:** Do not change `entryCells`, the store, or the Today recent list. Do not add a fixed pixel width per value that would break the 360 px phone width.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Mixed digits | Rows with "72.4 kg" and "100.25 kg" | Mood and sleep values start at the same x in every row | N/A |
| Absent value | An Entry with no sleep | Dash sits in the sleep column, others unchanged | N/A |
| Narrow phone | 360 px wide | Columns still aligned; long values do not overlap neighbours | Text is clipped with ellipsis, never wraps |

</frozen-after-approval>

## Implementation Notes

- First attempt (`80px repeat(3, minmax(0, 1fr))`) aligned the columns but left 48 px per value on a 360 px phone (row content is 248 px after the overflow button and padding), so "87.0 kg" was clipped. Replaced by fixed tracks per input kind (`COLUMN` in `history.component.ts`): date 5rem, stepper 4rem, faces 3.25rem, slider 2.5rem, each `minmax(0, …)` so a narrower screen shrinks every row the same way. Sum plus 3 × 4 px gaps = 248 px, exactly the 360 px row; gap grows to 16 px from 600 px.
- Widths measured in the running app: "400.0 kg" 16 px bold = 63.2 px, face 26 + 8 + "10" 14 px medium = 49.6 px, "23.5 h" 14 px = 38.9 px, widest date "Mon 30 Nov" = 78.2 px.
- Mockup alignment on the same screen: only Weight uses `row-value` (16 px bold); mood number is 14 px medium and sleep 14 px regular (`mock-03-history.svg`). Before this change all values were 16 px bold; now they follow the mockup, which is also what lets the three columns fit at 360 px.
- Tracks are keyed by `DimensionInput`, not by Dimension name, to keep the registry the only place that names Dimensions (AD-3). Weight is styled through `.date + .value` for the same reason.
- Files: `history.component.{ts,html,scss,spec.ts}`. Today's recent list (`recent-entries.component.scss`) has the same flex layout and was left alone.
- Verified in the browser (signed in, emulator) via same-origin iframes at 360, 768 and 1280 px with cloned rows holding "87.0 kg / 7 / 6 h", "100.0 kg / 10 / 23.5 h", "400.0 kg / 1 / 7.5 h" and absent values: identical x per column in every row, no clipping. The real browser window could not be resized (innerWidth stayed 1536). No data was written.

- Deviation from the frozen Intent: it says "one equal track per registry Dimension"; equal tracks clipped values at 360 px (the user said the problem is mainly on mobile), so tracks are per input kind instead. Columns still line up on every row. Needs the human's confirmation.

## Review Triage Log

- Date can spill into the weight column (no ellipsis on `.date`) — low, patched: `.date` now clips with ellipsis.
- Mood cell (inline-flex) clips without ellipsis when squeezed — low, rejected: fits at 360 px (49.6 of 52 px); only below 360 px, and the fix needs restructuring the cell.
- Code contradicts the frozen Intent (unequal tracks) — real, recorded above for the human; not editable here.
- New spec test only checks a copied constant — low, patched: now checks rows share the template, track count is 1 + Dimensions, one child per track, with a 400 kg value.
- Adding a Dimension breaks the 360 px budget — low/future, deferred.
- Rem tracks vs large root font size — maybe-false (medium if true), deferred with the check that would settle it.
- 600 px breakpoint is viewport-based — false: at 600 px with the nav rail the row content is still ~450 px, far above the 248 px the tracks need.
- Font changes not explained — false: documented in Implementation Notes (mockup `mock-03-history.svg`).
- Headline via `.date + .value` depends on order — low, rejected: registry order is fixed with Weight first, and naming the Dimension would break AD-3.
- Inline style repeated per row — low, rejected: a constant string per rendered row in a virtual list; negligible.
- Verification not recorded — false at finalize: results below.

## Verification

**Results (2026-10-23):** history specs 84/84 pass; `npm run test:lint` 146/146; eslint clean; `ng build` succeeds (initial-bundle budget warning, 597 kB over 500 kB, not touched by this change). Browser check at 360/768/1280 px: see Implementation Notes. Italian not checked in the browser; "100,0 kg" measured the same width as "100.0 kg".

**Commands:**
- `npm run test:lint` and `npx ng test --watch=false --include src/app/features/history/**` -- expected: pass
- `npm run build` -- expected: success

**Manual checks (if no CLI):**
- History at 360, 768 and 1280 px: values in each column start at the same x for rows with different digit counts, in en and it. Compare with `mock-03-history.svg`.
- UX check: as on step-oneshot's On Complete instructions.
