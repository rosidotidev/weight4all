---
title: '2-7 Browse my history'
type: 'feature'
created: '2026-10-20'
baseline_commit: 'd5803d26d8dcefed352b54b03900657fffe205ec'
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

**Problem:** The History tab is a placeholder, so Bob cannot see past Entries or the Days he missed (FR-11, UX-DR9).

**Approach:** Build the History list from the loaded Entries: newest first, a dashed "no entry · + Add" row for each gap, em dash for absent values, virtual scrolling, plus empty, loading and load-error states. Row building is pure code in `domain/history.ts`.

## Boundaries & Constraints

**Always:** Read only `EntryStore.entries()` and `status()`; no new store or Firestore call. `buildHistoryRows(entries, today)` returns rows newest first from the first Entry's Day to the last Entry's Day, capped at `today`: an `entry` row per Entry, a `missing` row per Day without one in between; future Days and future Entries never appear; no rows when there are none. `recentEntries(entries, n)` returns the n newest Entries (Story 2.10 and Today's side column reuse it). Row cells come from the `DIMENSIONS` registry (today only Weight): value via `formatNumber` with the Dimension's decimals and unit ("72.4 kg", comma in Italian), absent value is "—" in `outline` color, never 0. Rows are 62 px high with 8 px between them (item size 70), radius md, `surface-container`; the missing row has a dashed `outline` border, text "Mon 13 Oct — no entry" (`formatDay`) and a primary-container "+ Add" pill. Use CDK virtual scroll with fixed item size; the list fills the area under the app bar and scrolls inside it. A tapped Entry row and "+ Add" are links to the existing `/history/:dayKey` route (Story 2.8 builds the edit screen there); targets are at least 44 px high, rows and pills have accessible names. Heading "Entries · newest first" above the list. Empty (no Entries, status ready): "Nothing here yet. Your first log starts on Today." Loading: skeleton cards and a polite status message, as on Today. Load error: inline message with a Retry button (calls `store.retry()`); when rows already exist they stay below it. All copy in `strings.ts` en/it, warm and non-judgmental, no red or warning color on missing rows.

**Never:** No edit, delete, swipe reveal or overflow menu (Stories 2.8 and 2.9), no Happy effect, no "This week", no range chips. No change to `EntryStore`, `DraftStore`, the shell or Today. No `Date` math outside `domain/day.ts`, no number formatting outside `domain/number.ts`, no color literal outside `src/styles/`, no literal UI text in templates, no Dimension named outside the registry.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Contiguous | Entries 18, 19 Oct | Two rows, 19 first | N/A |
| Gap | Entries 12 and 14 Oct | 14 Oct, dashed 13 Oct "+ Add", 12 Oct | N/A |
| Long gap | Entries 1 Oct and 20 Oct | Every Day between has a dashed row | N/A |
| Future Entry | Entry dated after today | Not listed; no future gap rows | N/A |
| Trailing days | Last Entry 18 Oct, today 20 Oct | No rows for 19 and 20 Oct | N/A |
| One Entry | A single Entry | One row, no dashed rows | N/A |
| Year of Entries | 365 Entries | Only visible rows in the DOM; scrolls smoothly | N/A |
| Absent value | Entry without a Dimension value | "—", never 0 | N/A |
| No Entries | status ready, none | Empty message pointing to Today | N/A |
| Loading | status loading | Skeleton, polite status text | N/A |
| Load failure | status error | Inline message and Retry; existing rows stay | Retry reloads |
| Italian | Language `it` | Italian copy, comma decimals, Italian dates | N/A |

</frozen-after-approval>

## Code Map

- `src/app/domain/history.ts` + `history.spec.ts` -- has `previousEntry`; add `HistoryRow` type, `buildHistoryRows`, `recentEntries`. Reuse `enumerateDays`/`addDays` from `domain/day.ts`; keep `previousEntry` unchanged.
- `src/app/features/history/history.component.ts` (+ new spec) -- replace the placeholder; realizes `mockups/mock-03-history.svg`, DESIGN.md `history-row`, `history-row-missing`, History row component, with `ScrollingModule` (`@angular/cdk/scrolling`, already installed), `RouterLink`, `EntryStore`, `ClockService.today`, `I18n`. Loading, error and Retry markup mirrors `features/today/today.component.ts`.
- `src/app/features/history/history-day.component.ts` -- route target for rows; leave as is.
- `src/app/app.routes.ts` -- routes already exist; no change.
- `src/app/shared/strings.ts` + `strings.spec.ts` -- replace `historyPlaceholder` (used only by `history.component.ts`) with heading, "{date} — no entry", "+ Add", add-for-date accessible name, empty, loading, load-error, retry. EXPERIENCE.md has the en/it text.
- `src/styles/_tokens.scss` -- `--w4a-rounded-md`, `--w4a-type-row-value-*`, `--w4a-space-*`, `outline`, `primary-container` exist; add a row-height token only if needed.
- Mockup details owned elsewhere: overflow dots and swipe-reveal Edit (Stories 2.8/2.9), mood face and sleep cells (Epic 3, via the registry), the top app bar title (shell).

## Tasks & Acceptance

**Execution:**
- [x] `domain/history.ts` + spec -- `buildHistoryRows`, `recentEntries` -- AC1, AC2
- [x] `shared/strings.ts` + spec -- History copy en/it, drop the placeholder -- AC4, AC5
- [x] `features/history/history.component.ts` + spec -- list with virtual scroll, dashed rows, states, links; matrix audit (every row covered by a test that ran); then `UX check` against `mock-03-history.svg` -- AC1-AC5

**Acceptance Criteria:**
- Given Entries, when History opens, then rows are newest first with the Day and values, and an em dash for absent values.
- Given Days without an Entry between the first and last Entry, then each is a dashed "no entry · + Add" row, and no future Day appears.
- Given 365 Entries, when the user scrolls, then CDK virtual scroll with a fixed row height renders only visible rows.
- Given no Entries, then "Nothing here yet. Your first log starts on Today." shows.
- Given a failed load, then an inline message with Retry shows and any rows already shown stay.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Layer | Finding | Verdict | Route | Evidence |
|-------|---------|---------|-------|----------|
| edge | Malformed or unpadded key loops forever or throws in `buildHistoryRows` | false | rejected | `EntryStore.read` keeps only documents whose id passes `parseDayKey`; the store cannot hold such a key |
| edge | null or NaN value shows "null kg" | false | rejected | `fromDoc` copies only `typeof number` fields, null never reaches a row |
| edge | Very old first Entry builds tens of thousands of rows | low | rejected | Needs a decades-old Entry the app cannot create yet; the fix adds guards |
| edge | `recentEntries` lists future Entries | low | rejected | Spec defines it as the n newest Entries; the caller (2.10) owns the cut-off |
| edge | status error with no Entries shows only the alert | false | rejected | Intended: spec asks for message and Retry only |
| edge | Viewport may collapse if the parent has no definite height | maybe-false | settled by UX check | Needs a browser run |
| edge | strings spec not updated | low | patch | Added a History copy test in `strings.spec.ts` |
| edge | `enumerateDays` not reused | false | rejected | Descending walk needs `addDays`; Code Map said "reuse" without requiring both |
| blind | Row height 62 may clip wrapped text; fixed date width | low | rejected | Speculative; fix needs layout branches |
| blind | `getBoundingClientRect` mock never restored | low | patch | Added `afterEach(vi.restoreAllMocks)` |
| blind | Virtual scroll test does not scroll | low | rejected | jsdom has no layout; render cap is asserted |
| blind | `cells()`/`summary()` recomputed per pass; cast on `values` | low | rejected | Cost is negligible for the visible rows; cast mirrors `EntryStore` |
| blind | `recentEntries` unused | false | rejected | Spec requires it for Story 2.10 |
| blind | No list roles, no scroll restore, `historyDash` key | low | rejected | Larger changes for a cosmetic gain; the key is forced by the template-text lint rule |
| blind | Links land on the placeholder Day screen | false | rejected | Spec names Story 2.8 as owner |
| gap | No verification gaps | n/a | n/a | n/a |

## Verification

**Commands:**
- `npm run check` -- expected: lint, unit tests, lint-rule tests and rules tests pass

**Manual checks:**
- `UX check`: run the app, open History on compact and expanded widths, compare with `mock-03-history.svg` (row height 62, 8 px gap, date, bold weight, dashed missing row with "+ Add" pill, heading), in en and it.
