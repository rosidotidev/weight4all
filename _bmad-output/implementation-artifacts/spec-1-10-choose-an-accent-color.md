---
title: '1-10 Choose an accent color'
type: 'feature'
created: '2026-10-20'
baseline_commit: 'e69665d0ff3bad633b431100be7d14597719c0f3'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-bmad612_home-2026-10-19/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/DESIGN.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-1-9-choose-the-language-in-settings-and-keep-it-for-my-account.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The app is always violet: only one theme class exists, the `--w4a-*` role colors are fixed on `:root`, and Settings has no accent choice (FR-6, UX-DR1, UX-DR14).

**Approach:** Generate the five missing accent palettes, make the theme class drive the `--w4a-*` role colors, give `PreferencesStore` an `accent` signal saved with the same rollback and late-load rules as the Language, and add a six-swatch single select to Settings, with a per-accent contrast test as the gate.

## Boundaries & Constraints

**Always:** Accent ids and seeds: `violet` #5A46D6 (default), `teal` #0B8A7B, `orange` #D9480F, `magenta` #C2287A, `blue` #2F5BD8, `green` #3C7D22 (DESIGN.md). Each non-violet palette is generated with the Material `theme-color` schematic from its seed into `src/styles/_<id>-palette.scss` like `_violet-palette.scss`, and `$accents` in `_theme.scss` gets one entry per id; a seed token `--w4a-accent-<id>` for each id is added to `:root` in `_tokens.scss`. In each `.theme-<id>` block the role tokens `--w4a-primary`, `--w4a-on-primary`, `--w4a-primary-container`, `--w4a-on-primary-container` are set to the matching `--mat-sys-*` variables, so components change with no style edits and no color literals; the `:root` values stay as the pre-theme fallback. Chart tokens stay on `:root` only. `PreferencesStore` exposes `accent` (readonly signal, default `violet`) and `accentSaveError`, and `setAccent(accent)`: it applies at once, caches in `localStorage` (`w4a.accent`, read at startup, invalid or missing gives `violet`), then saves the full document `{ accent, language }` (current Language) with the 10 s timeout; failure or timeout restores the previous accent and cache and sets `accentSaveError`, unless a later accent choice or a session change happened. Language saves write the current `accent`, not a remembered copy. Accent and Language each keep their own choice counter, so a late load or rollback of one never discards the other; `load` applies and caches a valid `accent` unless an accent choice was made after the load started or the session changed. Choosing the accent already applied writes nothing. `reset()` leaves accent and Language and their caches untouched (Login keeps the last look) and clears both error signals. `App` keeps exactly one `theme-<id>` class on `<html>` following `accent()` (replacing the fixed `DEFAULT_THEME_CLASS`). Settings gets a swatch row in a fieldset with a legend: six native radio inputs (`name="accent"`), each a circle filled by binding `background` to `var(--w4a-accent-<id>)`, 38 px visual in a 44 px target, an accessible name from `strings.ts` (Violet, Teal, Orange, Magenta, Blue, Green / Viola, Verde acqua, Arancione, Magenta, Blu, Verde), the checked one marked by a 3 px ring and a check mark (not color alone), visible focus, and an `aria-live="polite"` error region kept rendered. Single select by arrow keys, one tab stop. All text in `strings.ts` (`it` and `en`, warm, no exclamation marks).

**Never:** No change to chart colors, `firestore.rules`, `firebase.ts`, `eslint.config.js`, or component styles other than the new swatch row. No color literal outside `src/styles/`. No dark theme. Accent never touches stored Entries.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Choose an accent | Signed in, save succeeds | `<html>` gets `theme-<id>` at once; cache updated; document `{accent, language}` written | N/A |
| Save fails or times out | `setDoc` rejects or no answer in 10 s | Previous accent, class and cache restored; message shown | `accentSaveError` set |
| Late load | Load starts, user picks an accent, load returns another | The user's pick stays; its Language still comes from the load | Accent from load discarded |
| Normal load | Document says `teal`, cache said `violet` | Teal applied and cached | N/A |
| Cold start | Cache `orange` / missing / `pink` | Orange class before load / violet / violet | N/A |
| Same accent chosen | Pick the current one | No write | N/A |
| Language save | Accent is `teal` | Document written with `teal` | N/A |
| Session change in flight | Logout or other user during load or save | Result discarded, no rollback | N/A |
| Contrast, every accent | Resolved theme tokens | Text pairs (on-primary on primary, on-primary-container on primary-container, primary on surface) at least 4.5:1; graphics (primary on surface, white check on each seed, each seed on surface-container) at least 3:1; otherwise the test fails | Build fails |
| Theme classes | Compiled CSS | One `.theme-<id>` per domain accent id, no more, no fewer | Test fails |
| Chart tokens | Any accent | `--w4a-chart-*` appear only on `:root` | Test fails |

</frozen-after-approval>

## Code Map

- `src/styles/_theme.scss` -- extend `$accents`, add the four role-token lines inside `.theme-#{$id}`; `@use` each new palette. `src/styles/_violet-palette.scss` is the generated pattern (do not edit it). `src/styles/_tokens.scss` -- add `--w4a-accent-*` seeds to the first `:root` block.
- `src/styles/_<id>-palette.scss` (new, five) -- from `ng generate @angular/material:theme-color` with the seed as `primaryColor` and `--directory src/styles`; rename to match. If the schematic cannot run, stop and report rather than hand-writing palettes.
- `src/app/domain/accent.ts` -- fix the stale comment (all six are themed); `ACCENT_NAMES` stays in `strings.ts` keys, not here.
- `src/app/core/data/preferences.store.ts` + spec -- add `accent`, `accentSaveError`, `setAccent`, per-key counters; share one private save helper with `setLanguage` (spec modules mock `firebase/firestore` with `vi.resetModules()` and dynamic imports; keep that pattern). The existing `reset`, `load` and Language tests must keep passing.
- `src/app/app.ts` + `app.spec.ts` -- accent-driven class effect replaces `DEFAULT_THEME_CLASS`; update its users.
- `src/app/features/settings/settings.component.ts` + spec -- swatch fieldset beside the Language one; reuse the radio-inside-label pattern already there.
- `src/app/shared/strings.ts` + `strings.spec.ts` -- `settingsAccentLegend`, six `accent*` names, `settingsAccentSaveError`.
- `tests/lint/theme.spec.ts` -- replace `ACCENTS = ['violet']` with the six ids, compare them to the emitted `.theme-*` selectors and to `src/app/domain/accent.ts`, run the contrast pairs against `.theme-<id>` `--mat-sys-*` values and `:root` seeds (the existing `:root`-only `describe.each` ignores its argument: fix it); keep the chart-token and touch-target checks per accent.
- `tests/rules/*`, `firestore.rules` -- already allow the six ids; do not edit.

## Tasks & Acceptance

**Execution:**
- [x] `src/styles/` palettes, `_theme.scss`, `_tokens.scss` -- five palettes, role-token mapping, seed tokens -- AC1, AC3
- [x] `tests/lint/theme.spec.ts` -- per-accent contrast, class set, chart isolation -- AC2, AC4
- [x] `preferences.store.ts` + spec -- accent signal, save, rollback, cache, per-key guards, reset -- AC1, AC5
- [x] `app.ts` + spec -- one theme class follows `accent()` -- AC1
- [x] `strings.ts` -- accent keys in `it` and `en` -- AC1, AC5
- [x] `settings.component.ts` + spec -- swatch select, error region -- AC1, AC5
- [x] matrix audit -- every I/O row covered by a test that ran -- verification

**Acceptance Criteria:**
- Given six swatches, when one is tapped, then the accent applies at once through its theme class, is saved to `preferences/app` and persists across sessions and devices.
- Given the six seeds and the resolved token pairs, when the unit test runs, then contrast is at least 4.5:1 for text and 3:1 for graphics for every accent, or the build fails.
- Given the theme from Story 1.4, when an accent is added, then only a seed, a palette and a `$accents` entry change, with no component style change and no color literal.
- Given the accent changes, when the charts' colors are read, then the chart tokens did not change.
- Given a failed save, when an accent is chosen, then the choice rolls back with a visible error.

## Implementation Notes

Palettes came from the Material `theme-color` schematic (headers match the seeds). The swatches were not looked at in a browser. `npm run test:rules` could not run (port 8080 held by a local emulator); rules are unchanged.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| A save writes the full document from live signals, so a Language save during a pending accent save (or a save before the load returns) persists the other key's unconfirmed or cached value (BH, EC) | medium (unverified) | defer | The spec mandates full-document writes of the current value; fix is a merge write or serialized saves. Rare: needs two fast choices or a choice within milliseconds of sign-in. |
| `reset()` keeps accent, so an Account with no saved accent inherits the previous user's accent and the next save writes it (BH, EC) | medium (unverified) | defer | Deliberate in the spec (Login keeps the last look), same as Language; reconsider when a shared device matters. |
| Rollback to an intermediate unsaved accent; timed-out write commits later (BH, EC) | low | rejected | Same pattern accepted for Language in Story 1.9; already deferred there. |
| Radio `[checked]` desync after rollback (BH, EC) | low | rejected | Rollback lands in a later change-detection pass. |
| First paint shows the fallback accent before the class is added (BH, EC) | low | rejected | The `App` effect runs in the first change-detection pass, before the first paint. |
| Contrast pair for the swatch check, forced-colors ring, regex-based CSS checks, `theme-*` class cleanup, accent name strings cast, runtime `isAccent` guard, palette-to-seed link, fieldset order (BH, EC) | low | rejected | `--w4a-on-primary` is white in every accent and white on each seed is tested; palette headers match the seeds; the rest are cosmetic or type-enforced with no demonstrated failure. |
| Verification gap layer | none | n/a | Every matrix row has a passing test. |

## Verification

**Commands:**
- `npm run check` -- expected: exit 0 (`test:rules` needs port 8080 free; rules are unchanged)
- `npx ng build` -- expected: build succeeds
