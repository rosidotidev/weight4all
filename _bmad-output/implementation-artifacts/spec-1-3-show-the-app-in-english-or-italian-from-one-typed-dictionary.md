---
title: '1-3 Show the app in English or Italian from one typed dictionary'
type: 'feature'
created: '2026-10-20'
status: 'done'
baseline_commit: '7c31652feda2fa344b42d28df531eb282a14f0a4'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-bmad612_home-2026-10-19/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The app has no text mechanism. Without one typed dictionary and one Language signal, labels get hard-coded, one Language gets forgotten, and later screens cannot switch Language without a reload (AD-7).

**Approach:** Add `shared/strings.ts` (each key requires `it` and `en`, enforced by the compiler), a Language signal in a minimal `PreferencesStore`, `<html lang>` and Material `*Intl` labels that follow it, and a template scan test that rejects literal user-visible text.

## Boundaries & Constraints

**Always:** English is the default Language (no choice made, login screen included). Switching is instant: no reload, typed input kept. Parameterised text is a function `(params) => string`. Voice: warm, never shaming, no streaks or guilt copy, "Saved!" is the only exclamation (English and Italian). Language maps to one locale (`it-IT`, `en-GB`). The Language signal lives in `PreferencesStore` (`core/data`) with a `localStorage` cache read at startup to avoid a wrong-language flash; every `localStorage` access is guarded (try/catch, falls back to English). Standalone, signals, OnPush, selector prefix `w4a-`.

**Never:** No translation library. No Firestore read/write of preferences, no Settings UI, no language switch control (Story 1.9). No accent/theme (1.4). No number or date formatting (`domain/number.ts`, `domain/day.ts` belong to later stories). No literal UI text in templates or components.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Missing translation | A `strings.ts` key lacks `it` or `en` | Compilation fails | Type test with `@ts-expect-error` proves it |
| First start | No cache, no choice | Language `en`, `<html lang="en">`, Material labels English | N/A |
| Cached choice | Cache holds `it` | Language `it` from first render, `<html lang="it">` | N/A |
| Bad cache | Cache holds `fr`, empty, or `localStorage` throws | Language `en` | Silent fallback |
| Switch | Language set to `it` while a screen shows | Texts, `<html lang>` and Material labels change at once, input kept | N/A |
| Parameterised text | Key taking params | Both Languages return a string for the same params | N/A |
| Literal template text | A template has visible text, e.g. `<p>Hello</p>` | Scan test fails | Message names the file |
| Allowed template content | Class, id, role, other attribute values, `strings.ts` key reads like `{{ t().key }}` | Scan test passes | N/A |

</frozen-after-approval>

## Code Map

- `src/app/shared/strings.ts` -- new; typed dictionary plus the `Language` type (`'it' | 'en'`), `LOCALES`, a seed of keys (`appName`, `saved` = "Saved!"/"Salvato!", datepicker labels). Seed only what existing code and tests need; later stories add keys.
- `src/app/core/data/preferences.store.ts` -- new, minimal; `language` signal, `setLanguage`, guarded `localStorage` cache. No `firebase/*` import yet. Story 1.9 extends it (Firestore, accent).
- `src/app/shared/` (i18n helper) -- new; a `t` computed over `strings` and the Language signal for templates; Material `*Intl` providers (at least `MatDatepickerIntl`, later stories add the components they use) updating when the signal changes.
- `src/app/app.ts`, `src/app/app.config.ts` -- sets `document.documentElement.lang` from the signal (effect); registers the Intl providers.
- `tests/lint/template-text.spec.ts` -- new; runs under `vitest.config.mts` (node), scans `src/**/*.html` and inline `template:` strings; follow the 1.1 lint-test pattern.
- `eslint.config.js`, `domain/`, `core/state` -- do not change; layer rules already allow `shared -> core/*` and `features -> shared`.
- `src/index.html` -- keeps `lang="en"` (default).

## Tasks & Acceptance

**Execution:**
- [x] `src/app/shared/strings.ts` + spec -- typed dictionary; type-level test that a missing language fails compile; runtime test that every key has non-empty `it` and `en`, functions return strings, and no `!` appears except in the `saved` key -- AC1, AC2
- [x] `src/app/core/data/preferences.store.ts` + spec -- default `en`, cache read/write, invalid/throwing cache falls back to `en` -- I/O rows
- [x] `src/app/shared/` i18n helper + Material Intl providers + spec -- `t` follows the signal; Intl labels switch -- AC3, AC4
- [x] `src/app/app.ts`, `app.config.ts` + spec -- `<html lang>` follows the signal, no reload, typed input in a test field survives a switch -- AC3, AC4
- [x] `tests/lint/template-text.spec.ts` + fixtures (inline strings) -- fails on literal text, passes on allowed content; scans the real `src` tree -- AC5

**Acceptance Criteria:**
- Given a key without `it` or `en`, when compiling, then it fails.
- Given no choice made, when the app starts (login included), then Language, `<html lang>` and Material labels are English.
- Given Language set to Italian while a screen shows, when it changes, then texts, labels and `<html lang>` change at once without reload or lost input.
- Given a template with literal visible text, when `npm run check` runs, then the scan test fails.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| `provideMaterialIntl()` in `appConfig` not covered by any test (VG, EC claim) | medium | patch | Removing it from `app.config.ts` keeps every test green; `i18n.spec.ts` supplies its own provider. |
| `<html lang>` set in an effect, so first render may carry `en` for cached `it` (EC, BH) | low | rejected | The bootstrap tick flushes the component effect before first paint; fix would only move one line. |
| `@ts-expect-error` proofs may not be type-checked (EC) | false | rejected | Probe: a type error in a spec file made `ng test` fail with TS2322. |
| Attribute text (`placeholder`, `aria-label`, `title`) not scanned (BH) | low | rejected | Spec says attribute values are ignored; stricter scan is a spec change. |
| Inline-template regex gaps, entities, `@` in text, split heuristics, unrelated `template:` props (BH, EC) | low | rejected | Heuristic scan; no false pass shown on real templates; fixes add complexity. |
| Parameterised strings called with undefined params in `strings.spec.ts` (EC, BH) | low | rejected | No parameterised key exists yet; the test is revisited when the first one lands. |
| `setLanguage` accepts invalid value at runtime (EC, BH) | low | rejected | Typed to the `Language` union; cache reads are validated. |
| No `storage` listener, no SSR token, no `navigator.language` detection (BH, EC) | low | rejected | Not in the spec; English default is a stated decision. |
| Language constants duplicated across files (BH) | low | rejected | `domain/language.ts` is the source; re-exports are deliberate for the layer rules. |
| `I18n.t` typing looseness (BH) | low | rejected | No unsound use exists today. |
| Only datepicker Intl wired; `locale` unused; no switch UI or template using `t()` (BH, EC) | low | rejected | Switch UI is out of scope (Story 1.9); later stories add Intl classes as they use components. |

## Design Notes

`PreferencesStore` owns the signal from this story so Story 1.9 only adds persistence and the Settings control. Pattern for the dictionary: `const strings = { saved: { en: 'Saved!', it: 'Salvato!' } } satisfies Record<string, { [L in Language]: string | ((p: never) => string) }>` is one option; any shape works if a missing language fails compilation.

## Verification

**Commands:**
- `npm run check` -- expected: exit 0
- `npx ng build` -- expected: build succeeds
