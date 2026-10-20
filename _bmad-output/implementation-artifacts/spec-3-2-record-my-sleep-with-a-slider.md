---
title: '3-2 Record my sleep with a slider'
type: 'feature'
created: '2026-10-20'
status: 'done'
baseline_commit: 'ae009b1d559b3dcae33beed257cf0fc69f615405'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/DESIGN.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Bob cannot log his hours of sleep; the Entry holds only Weight and Mood (FR-16, UX-DR7).

**Approach:** Add `sleep` to the Dimension registry and a Sleep card to the one Entry form: a 0 to 24 h slider in half-hour steps that starts at 6.0 h, a live value, and an "x" button that clears it. The form, History rows, This week card and store pick it up through the registry; the rules already accept `sleep`.

## Boundaries & Constraints

**Always:** Registry entry `sleep`: key and field `sleep`, `input: 'slider'`, unit `h`, min 0, max 24, step 0.5, decimals 1, `required: false`, `clearable: true`, `defaultValue: 6`, `chartToken: '--w4a-chart-sleep'`, label "Sleep" (it "Sonno"), range message "Choose sleep from 0 to 24 hours in half-hour steps." (it equivalent), no stepper keys. Widen the key unions. Order: Weight, Mood, Sleep. `validateValue` also rejects a value that is not a multiple of `step` (compared in integer units of 10^-decimals): 6.3 and 24.5 are `range`, 0, 6, 6.5, 24 are valid. Untouched slider on a new Day (Today, or "+ Add" on a past Day) starts at 6.0 and saves `sleep: 6`; `initialDraft` already does this from `defaultValue`. New `shared/sleep-slider.component` (`.ts`, `.html`, `.scss`, spec): native `input[type=range]` min 0, max 24, step 0.5, inputs `value: number | null`, `labelledBy`, output `changed(number | null)`; `aria-valuetext` "7.5 hours" (it "7,5 ore"), or "No sleep value" (it "Nessun valore di sonno") when cleared; end labels "0 h" and "24 h"; a 40 px round clear button (`--w4a-sleep-clear-size`, fill `--w4a-surface-variant`, "x" glyph with 2 px round strokes in `--w4a-on-surface-variant`) named "Clear sleep" (it "Cancella sonno") on every window class, touch target at least 44 px. Cleared: the handle stays at 6.0 position, the slider is dimmed and the value is an em dash; any touch or arrow key sets a value (first touch on the handle sets 6.0). Look from `mock-01-today.svg`, `tablet-01-today.svg`, `desktop-01-today.svg` and DESIGN.md "Sleep card": label, outlined "optional" tag (reuse `moodOptional` renamed to a shared `optional` string), value 22 px right aligned in the head ("6.0 h"; Italian "6,0 h") on compact and expanded, and on medium the value large (`value-display`) centered with an "h" unit and the Weight and Sleep cards side by side with Mood on its own full row below; 6 px track `--w4a-surface-variant`, active part and 22 px handle `--w4a-primary`. Typed state lives in `DraftStore` as text (`'7.5'`, cleared = `''`), so a cleared Sleep survives Tab switches and failed saves. Entry edit shows the stored Sleep, or the cleared state when absent. A cleared Sleep saves without the `sleep` field. Form code names no Dimension; stepper-only and faces-only code does not run for a slider. All text in `strings.ts` en/it; no color literal outside `src/styles/`. Pure client vectors in `validation.spec.ts` match `tests/rules/vectors.ts` plus 6.3, -1, 24.5.

**Never:** No change to `EntryStore`, `DraftStore`, `firestore.rules`, the Happy effect or the shell; no Sleep-specific History or This week code (Story 3.3 audits them); no chart.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Default | New Day, untouched | Slider at 6.0 h, saved Entry has `sleep: 6` | N/A |
| Slide | Move to 7.5 | Value "7.5 h", saved `sleep: 7.5` | N/A |
| Clear | Press "x" | Value "—", dimmed, saved without `sleep` | N/A |
| Re-set | Touch the slider after clearing | Value set, not dimmed | N/A |
| Edit stored | Entry with `sleep: 8` / without sleep | 8.0 h / cleared state | N/A |
| Draft | Slide, switch Tab, return | Value kept | N/A |
| Invalid | 24.5, -1 or 6.3 reaches the validator | `range` error with the Sleep message | Nothing saved |
| Italian | Language `it` | "Sonno", "6,0 h", "Cancella sonno" | N/A |

</frozen-after-approval>

## Code Map

- `src/app/domain/dimensions.ts` (+ spec) -- add `sleep`, widen `key`, `labelKey`, `rangeKey`, `hintKey` (optional for sleep).
- `src/app/domain/validation.ts` (+ spec) -- step check.
- `src/app/shared/entry-form.component.{ts,html,scss}` (+ spec) -- render the slider for `input === 'slider'`; card head shows the value; layout grid for medium via `LayoutService.windowClass()`; follows the faces branch (`mood-faces.component`) as pattern. `initialDraft` in `domain/entry.ts` unchanged.
- `src/app/shared/sleep-slider.component.*` (+ spec) -- new.
- `src/app/shared/strings.ts` (+ spec) -- `dimensionSleep`, `sleepRange`, `sleepValueText`, `sleepNone`, `sleepClear`, `sleepEnd` labels; shared `optional`.
- Registry-driven, no change expected: `entry.store.ts`, `history.component.ts`, `week-card.component.ts`, `recent-entries.component.ts`.
- UX: `mockups/mock-01-today.svg`, `tablet-01-today.svg`, `desktop-01-today.svg`; DESIGN.md "Sleep card", "Sleep clear icon-button"; EXPERIENCE.md "Sleep card", Accessibility.

## Tasks & Acceptance

**Execution:**
- [ ] `domain/dimensions.ts`, `domain/validation.ts`, `shared/strings.ts` + specs -- registry entry, step check, vectors, copy en/it -- AC1, AC3, AC5
- [ ] `shared/sleep-slider.component.*` + spec -- slider, value text, clear, cleared look, keyboard -- AC1-AC3
- [ ] `shared/entry-form.component.*` + spec -- Sleep card, draft, layout, save without `sleep`; matrix audit; then `UX check` -- AC1-AC4

**Acceptance Criteria:**
- Given a Day without an Entry, when Today opens, then the slider is at 6.0 h with the live value and saving untouched stores `sleep: 6`.
- Given the "x" button, when pressed, then the value is an em dash, the Day saves without `sleep`, and touching the slider sets a value.
- Given invalid values, then they are not accepted; value text is "7.5 hours", the button "Clear sleep", the cleared slider "No sleep value".
- Given "+ Add" on a past Day, then Sleep starts at 6.0 h.
- Given the Sleep vectors, then the client accepts 0, 6, 6.5, 24 and rejects 24.5, -1, 6.3.

## Implementation Notes

Showing Sleep in History, the recent list and This week (decimal comma, em dash, averages) is registry-driven; Story 3.3 audits and tests it.

## Spec Change Log

## Review Triage Log

| Layer | Finding | Verdict | Route | Evidence |
|-------|---------|---------|-------|----------|
| blind | Slider wired to `setMood` | low | patch | Renamed to `setValue` |
| blind | Sleep default pre-fills 6 | false | rejected | Spec decision (AD-12, FR-16) |
| blind | Slider named for Sleep, strings Sleep-specific | low | rejected | Only one slider Dimension exists; spec names the component |
| edge | Range message showed "0.0 to 24.0" | medium | patch | Slider bounds formatted as whole hours; test updated |
| edge | Out-of-range draft showed a value while slider read cleared | low | patch | Display shows an em dash outside the range |
| edge | Right-click or stray press commits 6 | low | patch | Only the primary button sets the value |
| edge | First arrow key on a cleared slider moves from 6 | medium | patch | Arrow key sets the shown value first |
| edge | Modulo with step finer than decimals; step anchored at 0 | low | rejected | Not reachable with the registry; min is 0 |
| edge | Slider editable while saving | low | rejected | Same as the other cards |
| edge | Clear-size token unused | low | rejected | 40 px comes from SVG geometry inside a 44 px target |
| gap | Medium layout untested | medium | patch | Test added with a medium `LayoutService` |
| gap | `toDoc`/`fromDoc` Sleep untested | low | patch | Store test added |
| gap | History and week card Sleep fixtures | low | deferred to story 3.3 | 3.3 audits and tests them |
| blind | Hard-coded colors, RTL gradient, hover states | low | rejected | Polish, no named harm |

## Verification

**Commands:**
- `npm run check` -- expected: lint, unit tests and lint-rule tests pass (rules tests need the Firestore emulator)

**Manual checks:**
- `UX check`: run the app, compare the Sleep card with the three Today mockups at 360, 768 and 1280 px in en and it; slide, clear, re-set, save, reload.
