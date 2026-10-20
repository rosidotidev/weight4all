---
title: '3-1 Record my mood with a face'
type: 'feature'
created: '2026-10-20'
baseline_commit: '5462c2d449f2770987215e99ea592a1889928735'
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

**Problem:** Bob cannot log his mood; the Entry only holds Weight (FR-15, UX-DR6).

**Approach:** Add `mood` to the Dimension registry and a Mood card to the one Entry form: ten drawn faces as a radio group, one tap to select, a second tap to clear. The form, History rows, This week card and store pick it up through the registry; the rules already accept `mood`.

## Boundaries & Constraints

**Always:** Registry entry `mood`: key and field `mood`, `input: 'faces'`, min 1, max 10, step 1, decimals 0, integer, `required: false`, `clearable: true`, `defaultValue: null`, `chartToken: '--w4a-chart-mood'`, unit `''`. Widen the registry's string-key types (label, missing, range, hint keys) so a Dimension without a stepper needs no stepper keys (make those optional); `PRIMARY` stays Weight. New `shared/mood-faces.component` (`.ts`, `.html`, `.scss`, spec) renders the group; `EntryFormComponent` renders it when `dimension.input === 'faces'`, in the same `@for`, with no Dimension named in the form. The card follows `mock-01-today.svg`, `tablet-01-today.svg`, `desktop-01-today.svg` and DESIGN.md "Mood card": label "Mood", an outlined "optional" tag, hint "1 sad … 10 happy" at the right; `role="radiogroup"` named by the label; ten `role="radio"` faces, each with a 34 px drawn face (fill `--w4a-mood-face-fill`, stroke and features `--w4a-mood-face-stroke`, two eyes, a mouth curve from deep frown at 1 to wide smile at 10: control point y = center - 15 + (level - 1) * 4.9 for a 19 px face, as in the mockup SVGs) and its number under it, hit area at least 44 px, accessible name "Mood N of 10" (it: "Umore N su 10"), `aria-checked`. Selected face: 50 px ring in `--w4a-primary` (3.5 px) on a `--w4a-primary-container` disc and the number bold in `--w4a-on-primary-container`. Layout: two rows of five on compact, one row of ten on medium and expanded (use `LayoutService.windowClass()`). Behavior: a tap selects; a tap on the selected face clears; roving tabindex (selected face, else the first, is the tab stop); arrow keys move focus (wrapping is not required), Space toggles the focused face. Typed state lives in `DraftStore` like Weight (text `'7'`, cleared = empty text, so a cleared Mood survives Tab switches and failed saves). Validation reuses `validateValue` (`''` is `missing`, skipped for an optional Dimension; `0`, `11`, `7.5` are `range`); the `range` message for Mood is "Choose a mood from 1 to 10." (it: "Scegli un umore da 1 a 10."), shown in the card's message region. An Entry saved without Mood has no `mood` field in the document (already how `EntryStore.toDoc` works). Editing a stored Entry shows its Mood selected. History rows and This week already iterate the registry; an absent Mood shows the em dash and a present one its plain number. Pure client vectors: `validation.spec.ts` runs the same Mood lists as `tests/rules/vectors.ts` (valid 1, 5, 7, 10; invalid 0, 11, 7.5, -1). All text in `strings.ts` en/it; no color literal outside `src/styles/`.

**Never:** No Sleep, no faces in History rows or the Entry list (Story 3.3 owns showing Mood as a face everywhere), no change to `EntryStore`, `DraftStore`, `firestore.rules`, the Happy effect or the shell, no Dimension named outside the registry, rules and tests.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Select | Tap face 7 | 7 selected, others not, saved Entry has `mood: 7` | N/A |
| Clear | Tap the selected face | None selected, saved Entry has no `mood` field | N/A |
| Change | Tap 3 while 7 selected | 3 selected | N/A |
| Skip | Mood untouched on a new Day | Entry saves with Weight only; History shows an em dash for Mood | N/A |
| Keyboard | Focus a face, Right/Left, Space | Focus moves; Space selects or clears the focused face | N/A |
| Edit stored | Entry with `mood: 4` | Face 4 is selected in Entry edit | N/A |
| Cleared stored | Open an Entry with Mood, clear it, save | Document rewritten without `mood` | N/A |
| Draft | Pick a face, switch Tab, come back | Selection kept | N/A |
| Invalid value | Value 0, 11 or 7.5 reaches the validator | `range` error with the Mood message, focus on the group | Nothing saved |
| Layout | 360 px / 768 px and up | Two rows of five / one row of ten | N/A |
| Italian | Language `it` | "Umore", "facoltativo", "1 triste … 10 felice", "Umore 7 su 10" | N/A |

</frozen-after-approval>

## Code Map

- `src/app/domain/dimensions.ts` (+ spec) -- add `mood`; widen the key types; keep `PRIMARY`. `DIMENSIONS.map` users (`entry.store.ts` `fromDoc`/`toDoc`, `history.component.ts` `cells`, `week-card`, `recent-entries`) are registry-driven and need no change except where a stepper key is read.
- `src/app/shared/entry-form.component.{ts,html,scss}` (+ spec) -- render the faces input for `input === 'faces'`; the optional-tag, hint and `range` message come from Dimension keys; `submit` already skips a blank optional field; stepper-only code (`step`, `key`, hint with last value) must not run for faces.
- `src/app/shared/mood-faces.component.*` (+ spec) -- new; inputs `value: number | null`, `labelledBy`, output `changed(number | null)`.
- `src/app/domain/validation.ts` + spec -- unchanged logic, add Mood vectors.
- `src/app/shared/strings.ts` + spec -- `dimensionMood`, `moodOptional`, `moodHint`, `moodRange`, `moodFace({n})`.
- `src/app/domain/entry.ts` -- `initialDraft` unchanged (default `null`).
- Leave alone: `entry.store.ts`, `draft.store.ts`, `firestore.rules`, `tests/rules`, `happy-effect*`, shell, `history*`.
- UX: `mockups/mock-01-today.svg`, `tablet-01-today.svg`, `desktop-01-today.svg`; DESIGN.md "Mood card", Colors (mood faces); EXPERIENCE.md "Mood card", Accessibility.

## Tasks & Acceptance

**Execution:**
- [ ] `domain/dimensions.ts`, `domain/validation.spec.ts`, `shared/strings.ts` + specs -- registry entry, Mood vectors, copy en/it -- AC1, AC3
- [ ] `shared/mood-faces.component.*` + spec -- faces, radio semantics, toggle, keyboard, layout -- AC1, AC2
- [ ] `shared/entry-form.component.*` + spec -- Mood card in the form, draft, save without `mood` when cleared; matrix audit; then `UX check` -- AC1-AC3

**Acceptance Criteria:**
- Given the registry has `mood`, when Today or Entry edit renders, then the Mood card shows ten distinct faces as a radio group with numbers and the name "Mood N of 10", in one row on medium and up.
- Given a face is selected, when it is tapped again, then Mood clears; arrows move and Space toggles.
- Given an Entry saved with no Mood, then the `mood` field is absent and History shows an em dash.
- Given the Mood vectors, then the client validator accepts 1 and 10 and rejects 0, 11 and 7.5, as the rules tests already do in the emulator.

## Implementation Notes

Mood as a face in History rows, the recent list and the card averages belongs to Story 3.3; here those views show the plain number or an em dash through the registry.

## Spec Change Log

## Review Triage Log

| Layer | Finding | Verdict | Route | Evidence |
|-------|---------|---------|-------|----------|
| edge | Mood cell renders "7 " (empty unit leaves a trailing space) in History, recent list, week card | medium | patch | Space added only when the unit is non-empty |
| gap | Mood round-trip through `EntryStore` untested | medium | patch | Two store specs added |
| edge | `selected()` hardcodes 1..10 and uses `Number()` | low | patch | Uses the Dimension range and `parseDecimal` |
| gap | Mood display in History/recent/week unasserted | low | deferred to story 3.3 | 3.3 owns showing Mood everywhere |
| edge | `MoodFacesComponent.focus()` unused | low | rejected | Harmless; the form focuses the roving stop by selector |
| blind | Home/End, wrap, arrows select | low | rejected | Spec: arrows move focus, Space toggles |
| blind | `aria-describedby` on a plain div, no forced-colors, no hover state | low | rejected | Polish; message region is `aria-live` |
| blind | Hardcoded 10 in faces and `moodFace` string | low | rejected | Spec fixes ten faces and "of 10" |
| blind | Message targeting `index === 0` | low | rejected | Pre-existing behavior for save results |
| blind | Optional keys widen types, casts | low | rejected | Spec asked to make stepper keys optional |
| edge | Two quick taps on stale value | false | rejected | The input signal updates synchronously within the change cycle |
| edge | Mouth curve formula differs from spec | false | rejected | Matches the mockup SVGs the spec cites |

## Verification

**Commands:**
- `npm run check` -- expected: lint, unit tests and lint-rule tests pass (rules tests need the Firestore emulator; run when its port is free)

**Manual checks:**
- `UX check`: run the app, compare the Mood card with the three Today mockups at 360, 768 and 1280 px in en and it; pick, clear and re-pick a face, save, reload.
