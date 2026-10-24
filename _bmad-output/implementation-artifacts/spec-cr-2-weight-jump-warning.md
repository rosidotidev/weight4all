---
title: 'CR-2 Weight jump warning'
type: 'feature'
created: '2026-10-24'
status: 'in-review'
route: 'dispatch'
baseline_commit: 'ee697c81719f72f17851317231d0ae8a280e4e23'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A large day-to-day weight increase is not flagged to the user, so nothing reminds them to watch what they eat.

**Approach:** When a saved weight is more than 1% above the most recent earlier Entry, the Happy effect's calm gain card also shows a warning line (IT and EN) telling the user to pay attention to what they eat. The save still succeeds. Decreases, equal values, a missing earlier Entry and a 1% change or less show nothing new.

## Boundaries & Constraints

**Always:** The threshold is exact: a change of exactly 1% is not a warning; just above 1% is. Compare in integer units of 10^-decimals (never float percentages). The warning is informational, never an error, and uses the existing Happy card paragraph pattern. All new text lives in `src/app/shared/strings.ts` with both `en` and `it`.

**Decision (human, second request, 2026-10-24):** A jump must be more evident than today's calm warning line: a more visible message and an invented choreography, comparable in emphasis to the loss confetti, but not the same confetti. **Decision (human, 2026-10-24):** option A. A jump uses a warm amber halo that pulses around the card's icon and a bolder warning message in a pill. No confetti, no red. DESIGN.md is amended to allow this amber visual for a jump only.

**Decision (human, third request, 2026-10-24):** Option 3 of the proposed choreography. The jump warning is a solid pill (`--w4a-banner-dot` background, `--w4a-on-banner-container` text) that slides up once with a small bounce and then stays still. On a jump, the icon is replaced by a slightly angry face in the style of the Inside Out emotions: angled brows, a flat mouth, round eyes. It appears once with a short pop and then stays, with no loop. The halo pulse from the previous decision is replaced by the face. Reduced motion shows the pill and the face at once, without motion. **Colour (human, 2026-10-24):** option A, an amber-orange face on `--w4a-banner-dot`, no red.

**Never:** No change to save, validation, error handling or the loss/same/welcome behaviour. No new screen or dialog. No change to how the comparison picks the previous Entry (`previousEntry`).

**Decision (human, 2026-10-24):** The warning applies to every confirmed save, including edits and added days in History. Today keeps the warning line in the Happy card. A past Day has no card (the History dialog closes on save), so its warning is a snackbar with the same IT/EN text, shown after the dialog closes, using the snackbar pattern already used for save errors but without error styling, with a dismiss action and a timeout of about 6 s.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Exactly 1% up | previous 70.0, saved 70.7 | gain card, no warning line | N/A |
| Just above 1% | previous 70.0, saved 70.8 | gain card with warning line | N/A |
| Small rise | previous 70.0, saved 70.1 | gain card, no warning line | N/A |
| Decrease | previous 70.8, saved 70.0 | loss card exactly as today, no warning | N/A |
| No earlier Entry | no previous, saved 70.8 | welcome card, no warning | N/A |
| Same value | previous 70.0, saved 70.0 | same card, no warning | N/A |

</frozen-after-approval>

## Code Map

- `_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/mockups/mock-02-happy-effect.svg` -- mockup of the Happy effect card (gain variant) that gains the warning line; DESIGN.md component: Happy effect card. The snackbar for past Days uses the existing snackbar component from DESIGN.md.
- `_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/DESIGN.md` -- lines 263 (confetti only for loss) and 330 (no warning visuals for gain): the rules a jump visual must reconcile with (Open Question 1).
- `src/app/features/today/happy-effect.component.scss` -- loss confetti `fall` keyframes (line 173) and the reduced-motion block (line 189): the motion vocabulary and the reduced-motion rule a jump visual must follow.
- `src/app/domain/happy-effect.ts` -- `happyEffect()` builds the gain variant; add a `jump` flag to the `gain` kind from an integer-unit check against `PRIMARY.decimals`. Reuse `decimalDifference` from `number.ts`.
- `src/app/domain/happy-effect.spec.ts` -- existing `happyEffect` tests; add the threshold cases (exactly 1%, just above, decrease, no earlier Entry).
- `src/app/features/today/happy-effect.component.ts` -- `view` computed builds the message; add a `warning` string when `effect.jump`.
- `src/app/features/today/happy-effect.component.html` -- card template; add one `<p class="warning">` after `.message`, using the existing paragraph pattern.
- `src/app/features/today/happy-effect.component.scss` -- style `.warning` with existing tokens only.
- `src/app/features/today/happy-effect.component.spec.ts` -- render tests: warning shown on a jump, hidden otherwise.
- `src/app/shared/strings.ts` -- add `effectJumpWarning` (EN/IT); `strings.spec.ts` already checks both languages exist.
- `src/app/features/today/today.component.ts` -- unchanged; it already passes `happyEffect(...)` to the card.
- `src/app/features/history/history-day.component.ts` -- `onConfirmed()` closes the dialog for past Days; for a past-Day save with a jump, open the warning snackbar (MatSnackBar, lazy-loaded like `entry-form.component.ts`) before closing.
- `src/app/features/history/history-day.component.spec.ts` -- tests: past-Day jump opens the snackbar with the warning text; no jump, no snackbar.
- `src/app/shared/entry-form.component.ts` -- reference for the snackbar pattern (`MatSnackBar`, `snackbarDismiss`); no change expected.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/shared/strings.ts` -- add `effectJumpWarning` with EN and IT text about paying attention to what you eat -- single strings file rule.
- [x] `src/app/domain/happy-effect.ts` -- add `jump` to the gain variant, true when the rise is strictly more than 1% of the previous value -- the threshold lives in the domain.
- [x] `src/app/domain/happy-effect.spec.ts` -- unit tests for exactly 1% (no), just above (yes), decrease (no), no earlier Entry (welcome) -- threshold coverage.
- [x] `src/app/features/today/happy-effect.component.ts` and `.html` -- show the warning paragraph when `jump` is true -- visible feedback.
- [x] `src/app/features/today/happy-effect.component.scss` -- style the warning line -- consistent with the card.
- [x] `src/app/features/today/happy-effect.component.spec.ts` -- render tests for shown and hidden warning -- UI behaviour.
- [x] `src/app/features/history/history-day.component.ts` -- on a past-Day save with a jump, show the warning snackbar after closing; no change for other saves -- the second feedback surface decided by the human.
- [x] `src/app/features/history/history-day.component.spec.ts` -- tests for the snackbar on jump, none otherwise -- coverage of the decision.

- [x] `_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/DESIGN.md` -- lines 263 and 330: allow the amber jump visual (halo and pill, no confetti) and keep confetti for the loss only -- the decided DESIGN.md amendment.
- [x] `src/app/features/today/happy-effect.component.ts` and `.html` -- when `jump` is true, add a `jump` class to the card and render the warning inside a pill beside a halo around the icon -- the jump visual.
- [x] `src/app/features/today/happy-effect.component.scss` -- amber halo keyframes (`--w4a-banner-dot` and `--w4a-banner-container` tokens, two pulses then still) and the pill style; both disabled under `prefers-reduced-motion` -- choreography with reduced motion respected.
- [x] `src/app/features/today/happy-effect.component.spec.ts` -- jump card has the `jump` class and the pill; no halo animation under reduced motion -- coverage.

- [x] `src/app/features/today/happy-effect.component.html` -- on a jump, render an angry-face SVG in place of the check icon (brows, flat mouth, round eyes), with the pill and the entry animation -- the new face.
- [x] `src/app/features/today/happy-effect.component.scss` -- solid pill (`--w4a-banner-dot` background, `--w4a-on-banner-container` text) with one slide-up-and-bounce entry; face pop-in once; remove the halo pulse; all motion disabled under `prefers-reduced-motion` -- option 3 choreography.
- [x] `src/app/features/today/happy-effect.component.spec.ts` -- jump card renders the face and the solid pill; no looping animation; reduced-motion rule in the styles -- coverage.
- [x] `_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/DESIGN.md` -- describe the angry face and the solid pill for a jump (colour per Open Question 1) -- keep the design reference in step.

**Acceptance Criteria:**
- Given an earlier Entry of 70.0 kg, when today is saved as 70.7 kg, then the card shows no warning.
- Given an earlier Entry of 70.0 kg, when today is saved as 70.8 kg, then the card shows the warning in the current language and the save succeeds.
- Given an earlier Entry of 70.8 kg, when today is saved as 70.0 kg, then the loss card appears unchanged with no warning.
- Given no earlier Entry, when today is saved, then the welcome card shows with no warning.
- Given the app is in Italian, when the warning shows, then its text is the Italian string.
- Given an earlier Entry of 70.0 kg, when a past Day is edited and saved as 70.8 kg from History, then the dialog closes and a snackbar shows the warning; the save still succeeds.
- Given an earlier Entry of 70.0 kg, when a past Day is saved as 70.7 kg or lower-than-previous, then no snackbar shows.

## Verification

**Commands:**
- `npx ng test --watch=false` -- expected: all tests pass, including the new threshold tests.
- `npx ng lint` (or the project's lint script) -- expected: no new findings.

**Manual checks (if no CLI):**
- On Today, save a weight 1% above the previous Entry: the warning line appears under the gain message, in the selected language.

**UX check:** compare the gain card with the warning line against `mock-02-happy-effect.svg` and DESIGN.md (Happy effect card): the warning must not break card spacing or the confetti-free calm layout on compact, medium and expanded windows, in IT and EN.

## Review Triage Log

Pass 1 (blind, edge-case, verification-gap; 2026-10-24):
- patch — The History jump snackbar waited for the lazy chunk before closing the dialog. Now the dialog closes at once and the snackbar opens afterwards from the root injector (fixed).
- patch — No Today-level test for the warning. Added 70.8 (shown) and 70.7 (not shown) through the real save path (fixed).
- patch — No Italian snackbar test. Added one for the `it` text and `Chiudi` (fixed).
- false — `close()` differs from a direct navigate: `close()` only calls `router.navigate(['/history'])`, so behaviour is identical.
- false — Silent `catch` around the lazy import: same pattern as `entry-form.component.ts`; the save has already succeeded.
- false — Negative snackbar tests pass vacuously: the no-jump branch calls `close()` synchronously, so nothing async is pending.
- false — strings spec does not cover `effectJumpWarning`: the loop checks every key in both languages.
- false — Unhandled rejection from `router.navigate`: navigation is no longer awaited on the warning path.
- false — Gain variant type-check: `tsc --noEmit` passes for the app and spec configs.
- false — Domain matrix gaps (83.3 to 84.2, other decimals, zero previous): the integer check is correct for these; decimals are fixed by `PRIMARY`.
- false — SCSS uses px, not tokens: the rest of `happy-effect.component.scss` uses px literals too.
- defer — Warning paragraph has no live region: the save is already announced. Add to deferred-work if wanted.
- defer — No automated layout check at each width with Italian text: covered by the manual UX check.
- decision for the human — Warning copy sits under "Bodies fluctuate…" and can read as alarming for a 1% rise; the Italian line uses "tu". Wording needs confirmation.

Verification after patches: `npx ng test --watch=false` 46 files, 781 tests passed; `npm run lint` clean; `tsc --noEmit` clean for app and spec configs.

## Implementation Notes (jump choreography, 2026-10-24)

- Done: amber halo pulse (two pulses, then still) on the icon, bolder warning pill, DESIGN.md amended (no confetti for a jump). Reduced motion stops the halo.
- Done (option 3, 2026-10-24): the halo is replaced by an angry face (amber disc, dark features) that pops in once; the warning is a solid `--w4a-banner-dot` pill that slides up once with a small bounce. No loop. Reduced motion shows both at once.
- Verification (option 3): `npx ng test --watch=false` 46 files and 786 tests passed; `npm run lint` clean; `tsc --noEmit` clean for app and spec configs.
- Formatting-only hunks outside CR-2 were reverted in `history-day.component.ts` and `history-day.component.spec.ts`.
- Verification: `npx ng test --watch=false` 46 files and 784 tests passed; `npm run lint` clean; `tsc --noEmit` clean for app and spec configs.
- Not run: the visual check against `mock-02-happy-effect.svg` and the layout check at compact, medium and expanded widths in IT and EN. Contrast of the pill is set by tokens, not measured.
- Open: the warning copy and the Italian "tu" form still need the human's confirmation.
