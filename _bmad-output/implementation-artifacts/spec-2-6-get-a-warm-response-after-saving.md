---
title: '2-6 Get a warm response after saving'
type: 'feature'
created: '2026-10-20'
baseline_commit: '96619c942f83f35c31710439dd93cc36dbbddb47'
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

**Problem:** Saving today's Weight gives only a plain "Saved!" line, so logging feels flat and gives no sense of progress (FR-9, UX-DR8).

**Approach:** After a confirmed save of today's Entry, Today shows the Happy effect card: a celebratory card with confetti for a loss, a calm card for a gain or no change, a welcome when there is no earlier Entry. The comparison is a pure function in `domain/happy-effect.ts` built on `previousEntry`.

## Boundaries & Constraints

**Always:** The effect appears only after `EntryStore.save` returns ok, never on failure or while saving. `EntryFormComponent` reports the confirmed Entry through a `confirmed` output; Today decides to show the card, so Story 2.8 can reuse the form for past Days without an effect. Compare with `previousEntry(day, entries)` (most recent earlier Entry); name its date with `formatDay` as "vs 14 Oct" when it is not the previous calendar Day, else "vs yesterday". Delta is exact to one decimal (no float noise), shown with a real minus sign (−) or "+", unit kg, in `effect-delta` type. Loss: gradient card (`happy-effect-loss`, rounded xxl), gold star, confetti, "Saved!", delta, comparison, divider at 35% white, "Nice! Another step, your way.", "72.4 kg logged for today." Gain or no change: `happy-effect-gain` card, white circle with check, soft wavy line, same layout, no confetti, no red or warning color; no change shows "0.0 kg" without a sign and the gain message. No earlier Entry: "Welcome! Your first log is in." replaces delta and comparison, calm card. Below the card: a filled Done button and a text Dismiss button. Focus moves to Done when the card opens; Done, Dismiss and Esc close it and return focus to the element focused before (the Save button), falling back to Today. The card is inline above the form (not modal, nothing is blocked); confetti ignores pointer events, plays at most 3 s, then is gone. With `prefers-reduced-motion: reduce` the confetti pieces are static (as in the mockup) and no transitions move. Loss colors derive from `--w4a-primary`, gain from `--w4a-primary-container`, so they follow the accent; white text on the gradient keeps AA contrast. All copy in `strings.ts` en/it per EXPERIENCE.md; confetti colors become `--w4a-confetti-*` tokens in `src/styles/_tokens.scss`.

**Never:** No effect on edit of a past Day (Story 2.8 wires the form there), no History, no delete, no "This week". No color literal outside `src/styles/`, no literal UI text in templates, no `Date` math outside `domain/day.ts`, no number formatting outside `domain/number.ts`, no confetti library, no change to `EntryStore` or `DraftStore`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Loss vs yesterday | Saved 72.4, yesterday 72.7 | Loss card, "−0.3 kg", "vs yesterday", confetti | N/A |
| Loss vs older Entry | Previous Entry 4 days ago | "vs <that date>", date by locale | N/A |
| Gain | Saved 72.8, previous 72.6 | Calm card "+0.2 kg", gain message, no confetti | N/A |
| No change | Same as previous | Calm card "0.0 kg", gain message | N/A |
| First Entry | No earlier Entry | Calm card with welcome, no delta | N/A |
| Later Entry only | Entries exist only after today | Welcome (none earlier) | N/A |
| Save fails | `save` returns error | No card; existing error flow | Existing |
| Close | Done, Dismiss or Esc | Card removed, focus back on Save | N/A |
| Reduced motion | `prefers-reduced-motion` | Static confetti, no movement | N/A |
| Italian | Language `it` | Italian copy, comma decimals | N/A |
| Accent change | Another accent | Card colors follow it | N/A |

</frozen-after-approval>

## Code Map

- `src/app/domain/happy-effect.ts` + spec (new) -- `happyEffect(day, weight, entries)` returns `{ kind: 'welcome' } | { kind: 'loss' | 'gain' | 'same', delta, since, yesterday }`. Reuse `previousEntry` (`domain/history.ts`), `addDays` (`domain/day.ts`). Delta via a new exact-tenths helper in `domain/number.ts` + spec (that file owns number math).
- `src/app/shared/entry-form.component.ts` + spec -- add `confirmed = output<Entry>()` emitted in the ok branch of `submit` (around line 327); the `Saved!` inline message stays. Do not change the save flow.
- `src/app/features/today/happy-effect.component.ts` + spec (new) -- realizes `mock-02-happy-effect.svg`, DESIGN.md `happy-effect-loss`, `happy-effect-gain`, Happy effect card: presentational card from an effect result and weight, with `closed` output, Esc handling, confetti list, SVG star, check, wave. Reuse `formatNumber`, `formatDay`, `I18n`.
- `src/app/features/today/today.component.ts` + spec -- hold `effect` signal; on `confirmed`, compute it from `store.entries()` and show the card above the form (below the banner slot); remember `document.activeElement`, restore on close. Today's banner and skeleton stay as they are.
- `src/app/shared/strings.ts` + spec -- effect strings (loss, gain, welcome, "vs yesterday", "vs {date}", "{value} kg logged for today.", Done, Dismiss, accessible names); `saved` exists.
- `src/styles/_tokens.scss` -- add `--w4a-confetti-*` (gold, pink, mint, orange, sky) and celebration gradient tokens derived from `--w4a-primary`; `--w4a-rounded-xxl` and `--w4a-type-effect-delta-*` exist.

## Tasks & Acceptance

**Execution:**
- [x] `domain/happy-effect.ts`, `domain/number.ts` + specs -- comparison and exact delta -- AC1
- [x] `shared/strings.ts` + spec, `styles/_tokens.scss` -- copy en/it and tokens -- AC2-AC4
- [x] `shared/entry-form.component.ts` + spec -- `confirmed` output, only on ok -- AC1
- [x] `features/today/happy-effect.component.ts` + spec -- three card variants, focus, Esc, reduced motion -- AC2-AC5
- [x] `features/today/today.component.ts` + spec -- wire the card; matrix audit (every row covered by a test that ran); then `UX check` -- AC1-AC6

**Acceptance Criteria:**
- Given a confirmed save of today's Entry, when the effect shows, then it compares with the most recent earlier Entry and names its date when it is not yesterday.
- Given a loss, then a celebratory card with confetti for at most 3 seconds and "Nice! Another step, your way." shows.
- Given a gain or no change, then a calm card with no confetti and no red or warning visuals shows.
- Given no earlier Entry, then the welcome replaces the comparison.
- Given the card is open, when Done, Dismiss or Esc is used, then it closes and focus returns to Today; with reduced motion nothing moves.
- Given the accent changes, then the effect colors follow it.

## Implementation Notes

- `formatDay` gained an optional `weekday` flag for "vs 14 Oct"; the strings spec allows `!` in the loss and welcome copy; the gradient stops derive from the accent, so they approximate the mockup.
- The card is recreated per save (Today `@for` over a one-item list).

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| Second save with the card open reuses it: no confetti, no focus on Done (BH, EC) | medium | patch | The card is non-modal, so a second save is reachable; Today now recreates the card per save and keeps the first opener. Tests added. |
| Esc closes the card even when another overlay already handled it (BH, EC) | low | patch | One-line `defaultPrevented` guard; test added. |
| Session change or midnight leaves the card open (EC) | low | rejected | Today is unmounted on logout; midnight with the card open is cosmetic and needs a new guard. |
| Save confirmed after midnight shows no card (BH, EC) | low | rejected | Rare, and the inline Saved line still confirms. |
| Opener disabled when closing (EC) | false | rejected | `saving` is false before `confirmed` emits, so Save is enabled. |
| Fixed id, reduced-motion read once, static confetti stays (BH, EC) | low | rejected | One instance exists; static confetti is the spec and the mockup. |
| Earlier Entry without a weight gives welcome (EC) | false | rejected | Weight is required, so every Entry has one. |
| NaN or extra decimals in `decimalDifference` (EC) | false | rejected | Inputs are validated one-decimal values. |
| `formatDay` without weekday orders day then month (BH, EC) | low | rejected | Matches the spec copy for en and it; the app has those two locales. |
| Gendered "Benvenuto!", hardcoded kg in `effectLogged` (BH) | low | rejected | Copy is from the EXPERIENCE.md table; `weightHint` also names kg in strings. |
| No live announcement of the card (BH, EC) | low | rejected | The form's polite "Saved!" line already announces the save. |
| AA across accents unchecked (BH, EC) | false | rejected | The implementer computed at least 5.0:1 for all six accent seeds. |
| Hardcoded layout px (BH) | low | rejected | Values come from the mockup, as in the other cards. |
| Artifact notes empty, sprint status differs (BH) | low | rejected | Updated at step 5. |
| Verification gap layer | none | n/a | No gaps filed. |

## Verification

**Commands:**
- `npm run lint` -- expected: exit 0
- `npm test` -- expected: exit 0
- `npx ng build` -- expected: build succeeds

**Manual checks:**
- `UX check`: run the app, save a lower, higher and equal weight and a first Entry, and compare with `mock-02-happy-effect.svg` (card 358x370 at 390 px, star, confetti, delta 58 px, divider, Done and Dismiss), including the tablet and desktop widths and the Italian copy against the EXPERIENCE.md table; check another accent and `prefers-reduced-motion`.
