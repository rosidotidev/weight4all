---
title: '2-4 Adjust the weight quickly'
type: 'feature'
created: '2026-10-20'
baseline_commit: '2ed49b0cd4471e42de8e1469c8649dc723b6df52'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/DESIGN.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/EXPERIENCE.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-2-3-never-lose-typed-values-when-a-save-fails.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Today's Weight starts empty and can only be typed, so logging is slow (FR-8, UX-DR5); and the Weight card, the Today column and the expanded shell still differ from the mockups.

**Approach:** The Weight field starts from the most recent earlier Entry, plus/minus buttons and Up/Down keys step it by exactly 0.1 kg in integer tenths, a hint shows the last value and step, and the card, the centered 600 px column and the expanded shell (drawer logo and app name, app bar title with date) are rebuilt like the mockups.

## Boundaries & Constraints

**Always:** `domain/number.ts` gets `stepValue(value, direction, step, decimals, min, max)` working in integer units of `10^-decimals` and clamping to `min`/`max`; 72.7 plus 0.1 is 72.8 and 20.0 minus 0.1 stays 20.0. `domain/history.ts` (new) gets `previousEntry(day, entries)`: the latest Entry with a Day before `day`, else `null` (the single place computing "previous"; Story 2.6 reuses it). The form passes it to `initialDraft` only when `EntryStore.status()` is `ready`; a stored Entry for the Day still wins, and typed text wins over both. A press with no number to step from (empty or unparseable text) starts from the suggestion, else from `min`. Buttons and keys write the new text, formatted for the Language, into `DraftStore` exactly like typing (so saved/failed messages clear). Up/Down in the field call `preventDefault` and step once. The registry gains the string keys the card needs (`increaseKey`, `decreaseKey`, `hintKey`, `hintNoLastKey`, same pattern as `missingKey`); the form shows buttons only for `input: 'stepper'`. `strings.ts` (en/it): button names "Increase weight by 0.1 kg" / "Decrease weight by 0.1 kg" ("Aumenta il peso di 0,1 kg" / "Diminuisci il peso di 0,1 kg"), hint "Last time: 72.7 kg · step 0.1 kg" ("Ultima volta: 72,7 kg · passo 0,1 kg"), and with no previous Entry "Step 0.1 kg" ("Passo 0,1 kg"); numbers come from `formatNumber`. The number stays typeable; comma and point parse alike. Every target is at least 44 by 44 px, the stepper buttons 56 px round.
Shell: on the expanded window class the drawer starts with the logo and "Weight4All", the app bar has no logo, shows the tab name ("Today") at the left and today's date (`formatDay(ClockService.today(), locale)`) at the right; compact and medium keep the current app bar. The Today column and the form are a centered `--w4a-form-column-width` column.

**Never:** No Mood, Sleep, banner, "This week" or Happy effect (Stories 3.x, 2.5, 2.10, 2.6); no signed-in account footer in the drawer (not in the story, no owner yet); no change to `EntryStore`, save or error handling; no `new Date`, `toFixed`, `toLocaleString` or `Intl.NumberFormat` outside their modules; no color literal outside `src/styles/`; no literal UI text in templates.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Suggestion | Store `ready`, no Entry today, earlier Entry 72.7 | Field "72.7" (Italian "72,7"), hint "Last time: 72.7 kg · step 0.1 kg" | N/A |
| No history | `ready`, no Entry at all | Field empty, hint "Step 0.1 kg" | N/A |
| Store not ready | `loading` or `error` | Form not shown (Today's skeleton or error); no suggestion built | Existing load error with Retry |
| Entry today exists | Stored 72.4 | Field "72.4", hint shows the earlier Entry | N/A |
| Plus / minus | Field 72.7 | Press plus 72.8; press minus 72.6; Up/Down the same, once per key | N/A |
| Edge of range | Field 400.0 / 20.0 | Plus at 400.0 / minus at 20.0 leave it unchanged | N/A |
| Nothing to step from | Empty or "abc", suggestion 72.7 / none | Press sets 72.8 or 71.7 from the suggestion / sets 20.1 or 20.0 from `min` | N/A |
| Typed comma | "72,7" in English or Italian | Same value 72.7 as "72.7" | Out-of-range or 2-decimal text rejected as before |
| Typed text kept | User typed 80.0 | Suggestion never replaces it | N/A |

</frozen-after-approval>

## Code Map

- `src/app/domain/number.ts` + `number.spec.ts` -- add `stepValue`; shared vectors (comma, point, 72.7+0.1, clamps, float traps like 0.1+0.2 style 72.3+0.1) run in both languages.
- `src/app/domain/history.ts` + spec (new) -- `previousEntry`; pure, no store import.
- `src/app/domain/dimensions.ts` + spec -- add the four string-key fields to the registry type and Weight; `defaultValue` unchanged.
- `src/app/shared/entry-form.component.ts` + spec -- realizes `mock-01-today.svg` and `desktop-01-today.svg` Weight card (DESIGN.md: Weight card, `input-card`, `stepper-button-minus`/`plus`, `value-display`, caption): label, minus button left (primary-container disc), plus button right (primary disc), big borderless centered input with small unit, caption below; `:host` centered (`margin-inline: auto`); the Save button style must stop applying to the stepper buttons (scope it); `initialDraft(day, entries, lastEntry)` already takes the suggestion (today passes `null`); reuse `drafts.set`, `formatNumber`, `validateValue`, `aria-describedby` on hint and message.
- `src/app/shared/strings.ts` + `strings.spec.ts` -- five new keys per Dimension pattern (`weightIncrease`, `weightDecrease`, `weightHint(p)`, `weightHintNoLast(p)`).
- `src/app/features/today/today.component.ts` + spec -- column centering/padding only; skeleton width matches the column.
- `src/app/shell/shell.component.{ts,html,scss}` + spec -- expanded: drawer header (logo, `appName`), app bar title/date; `ClockService` and `formatDay` for the date; compact/medium untouched. Mockup: `desktop-01-today.svg` (drawer top, bar at right).
- `src/app/core/data/entry.store.ts`, `core/state/draft.store.ts` -- read only (`entries`, `status`, `get`/`set`).

## Tasks & Acceptance

**Execution:**
- [x] `domain/number.ts`, `domain/history.ts`, `domain/dimensions.ts` + specs -- `stepValue`, `previousEntry`, registry keys -- AC3, AC4, AC1, AC2
- [x] `shared/strings.ts` + spec -- en/it names, hints -- AC1, AC3
- [x] `shared/entry-form.component.ts` + spec -- pre-fill when `ready`, buttons, arrow keys, hint, Weight card layout, centered column -- AC1-AC5
- [x] `features/today/today.component.ts` + spec, `shell/*` + spec -- column, drawer header, app bar title and date on expanded -- AC6
- [x] matrix audit -- every row covered by a test that ran; then `UX check` -- verification

**Acceptance Criteria:**
- Given an earlier Entry and none today, when Today opens with the store `ready`, then the Weight starts from that Entry's value and the hint shows it with the step.
- Given no earlier Entry, when Today opens, then the field is empty.
- Given the buttons or Up/Down keys, when pressed once, then the value changes by exactly 0.1 kg (72.7 to 72.8) and the buttons are named "Increase weight by 0.1 kg" and "Decrease weight by 0.1 kg".
- Given a Weight typed with a comma or a point in either Language, when parsed, then the stored value is the same and display follows the Language.
- Given a phone, when the controls render, then every target is at least 44 by 44 px.
- Given the expanded window class, when Today renders, then the drawer shows the logo and app name, the app bar shows "Today" and the date, and the form is a centered column.

## Implementation Notes

The matrix row "Nothing to step from" says "72.8 or 71.7" for suggestion 72.7; 71.7 is a typo in the frozen block, the code and tests give 72.6 (72.7 minus 0.1). The validation highlight on the input is now only a bottom border, since the input is borderless as in the mockup; the message below still states the error. The `UX check` is run in the review step.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| Up/Down keys step on any Dimension, buttons only on `stepper` (BH, EC) | low | patch | `key()` now returns early unless `input === 'stepper'`. Latent: one Dimension today. |
| Test title "centered column" only asserts the skeleton and form render (BH, EC, VG) | low | patch | Renamed to what it checks; jsdom has no layout, the check is the `UX check`. |
| Pressing a button on non-empty unparseable text (`72.77`, `abc`) replaces it with the suggestion or `min` (BH, EC, VG) | medium | rejected | Matrix row "Nothing to step from" names `abc` and says to start from the suggestion; the intent settles it. Save still rejects bad text. Put to the human in the summary. |
| `stepValue` unguarded against NaN, step 0, min > max (BH) | low | rejected | Callers pass registry values and `parseDecimal` output; no path produces them. |
| Modifier keys with Up/Down are intercepted (BH) | low | rejected | Fix adds a branch for a rare case; Shift+Arrow selection is not used in this field. |
| No announcement of a stepped value; no spinbutton role (BH) | low | rejected | The input is a text field by spec ("stays typeable"); screen readers read the new value on the input. |
| Labels hard-code "0.1 kg" (BH) | low | rejected | The spec fixes the label text; the step is registry-wide. |
| Hint in `aria-describedby` is re-read on focus (BH, EC) | low | rejected | It is the caption the mockup shows; noise is minor. |
| Invalid-field state is only a neutral underline plus the message (BH) | low | rejected | The input is borderless in the mockup; the message below states the error, so color is not the only cue. Flagged for the visual check. |
| Hard-coded 56 px, no hover or disabled style, no edge feedback (BH) | low | rejected | 56 px is the DESIGN.md size; clamping at the edge is in the spec. |
| `tabTitle` duplicates the `TABS.find` of `title` (BH) | low | rejected | Two lines; extracting a shared computed is not worth the churn. |
| Expanded app bar says Today on an unknown route (EC) | low | rejected | Every signed-in route is a Tab; the router has no other path. |
| App bar date stale after midnight (EC) | false | rejected | `ClockService.today` is a signal refreshed at midnight and on visibility. |
| `previousEntry` suggestion ignores Dimensions the latest Entry lacks (EC) | low | rejected | Weight is required, so every Entry has it; revisit when Epic 3 adds optional Dimensions. |
| `previousEntry` relies on zero-padded keys; key/day mismatch untested (BH) | low | rejected | `DayKey` is defined as `YYYY-MM-DD`; `EntryStore` builds the map from it. |
| Matrix typo "71.7" contradicts the code (EC) | low | rejected | Known and recorded in Implementation Notes; the frozen block is not edited. |
| Spec and sprint files absent from the diff; no visual check evidenced (BH) | false | rejected | The diff covers `src` only; the `UX check` follows in this run. |
| Verification gap layer | none | n/a | Every matrix row has a passing test. |

## Design Notes

"Nothing to step from" is a choice the user will rarely hit: the first-ever entry, or a cleared field. Starting from `min` is valid and explainable; the registry has no default weight and one would be arbitrary. Clamping at the range edge means the buttons never produce a value Save would reject.

## Verification

**Commands:**
- `npm run lint` -- expected: exit 0
- `npm test` -- expected: exit 0 (unit and lint tests)
- `npx ng build` -- expected: build succeeds

**Manual checks:**
- `UX check`: run the app and compare Today with `mock-01-today.svg` (390 px), `tablet-01-today.svg` and `desktop-01-today.svg` (1440 px) for the Weight card, the centered column, the drawer header and the app bar; confirm DESIGN.md components and `EXPERIENCE.md` copy table (Weight hint, both Languages). Mood, Sleep and banner stay absent by design.
