---
title: '1-4 Set up the Material 3 theme and design tokens'
type: 'feature'
created: '2026-10-20'
status: 'done'
baseline_commit: '757b13e138f0194b7af0b7682e5017233b8cb712'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/DESIGN.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-bmad612_home-2026-10-19/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** No theme or tokens exist. Without them every screen from login onwards would invent colors, shapes and spacing, and adding the five other accents later would mean touching component styles (AD-10).

**Approach:** Add an Angular Material 22 M3 light theme with the default violet accent applied through a theme class derived from its seed color, plus the `DESIGN.md` tokens (colors, type, shapes, spacing, amber Missing-entry, independent Dimension chart colors) as CSS custom properties, and tests that enforce no color literals and AA contrast.

## Boundaries & Constraints

**Always:** Light theme only. Values come from the `DESIGN.md` frontmatter (`colors`, `typography`, `rounded`, `spacing`, `components`); M3 defaults are inherited, not redefined. Default accent violet `#5A46D6`, class named from the accent id (`theme-violet`; ids `violet, teal, orange, magenta, blue, green` as in Story 1.2), applied to `<html>` at startup. Chart tokens (`weight #2F5BD8` circle, `mood #D9480F` square, `sleep #0B8A7B` triangle) are a separate token set that never reads the accent, resolvable with `getComputedStyle`. Touch target token `44px` via Material density/min-size. Roboto with Arial fallback. Standalone, OnPush, prefix `w4a-`. Token CSS custom properties are prefixed `--w4a-`.

**Never:** No accent switching, swatches or persistence (Story 1.10); only the violet theme class exists, built so adding an accent adds a seed and a class only. No dark theme. No screens, navigation or feature components. No color literals (hex, `rgb()`, `hsl()`, named colors) in component styles, templates or TypeScript; literals live only in the token and theme files. No new routes or demo pages in the shipped app.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Startup | App starts, no accent chosen | `<html>` carries `theme-violet`; `--w4a-*` color, shape, spacing tokens resolve | N/A |
| Chart tokens | Accent class changes (test swaps it) | `--w4a-chart-*` values unchanged | N/A |
| Contrast | Default accent text/graphic token pairs | Text pairs >= 4.5:1, essential graphics >= 3:1 | Test fails the build below threshold |
| Color literal | Hex or `rgb()` in a component `.scss`, `.html` or `.ts` outside token/theme files | Scan test fails and names the file | N/A |
| Allowed literal | Same literal inside the token or theme files | Scan passes | N/A |
| Touch target | Button, input, chip styled by the theme | Minimum 44 by 44 px token applied | N/A |

</frozen-after-approval>

## Code Map

- `src/styles.scss` -- currently empty global stylesheet; imports the theme and tokens.
- `src/styles/_tokens.scss` (new) -- `:root` custom properties from `DESIGN.md`: surface and role colors, banner amber, mood-face, chart tokens (separate block), type roles, `rounded`, `spacing`, `--w4a-touch-target: 44px`.
- `src/styles/_theme.scss` (new) -- `@angular/material` `mat.theme(...)` M3 light with the violet palette derived from seed `#5A46D6` (use the `@angular/material:theme-color` schematic or the equivalent generated palette; commit the generated palette file), scoped to `.theme-violet`; Roboto typography; density for 44px targets.
- `src/app/app.ts` (or `core/state`) -- adds the default theme class to `<html>` at startup via `DOCUMENT`; no color literal.
- `src/index.html` -- may preload the Roboto font link; no theme class here.
- `eslint.config.js`, `angular.json` budgets -- do not change unless the theme file size trips the `anyComponentStyle` budget (global styles are not component styles).
- `tests/lint/` -- new `color-literals.spec.ts` (node env, scans `src/app/**`) following the `template-text.spec.ts` pattern; excludes `src/styles/`.
- `src/app/**/theme*.spec.ts` or `tests/lint/theme.spec.ts` -- contrast and token tests; may compile SCSS with the installed `sass` to assert output.

## Tasks & Acceptance

**Execution:**
- [x] `src/styles/_tokens.scss`, `_theme.scss`, `src/styles.scss` -- tokens and M3 light violet theme, chart token set separate -- AC1-3
- [x] `src/app/app.ts` + spec -- default `theme-violet` class on `<html>`; swapping the class leaves chart tokens untouched -- AC2, AC3
- [x] `tests/lint/color-literals.spec.ts` -- fails on hex/`rgb()`/`hsl()`/named colors in component files, passes on token/theme files, passes on the real tree -- AC1
- [ ] contrast test -- computes WCAG ratios from the token values for the default accent's text and graphic pairs (on-primary/primary, on-primary-container/primary-container, on-surface/surface, on-surface-variant/surface-container, on-banner-container/banner-container, chart colors vs surface at 3:1); structured so Story 1.10 adds accents by listing seeds -- AD-10
- [ ] tokens test -- compiles `src/styles.scss` with `sass` and asserts `.theme-violet` exists and all `--w4a-chart-*` are defined outside it -- AC2, AC3

**Acceptance Criteria:**
- Given the M3 light theme, when the app builds, then colors, type, spacing, shapes and the amber Missing-entry color come from tokens and no component uses a color literal.
- Given the default accent, when the app starts, then `theme-violet` is applied, derived from `#5A46D6`.
- Given the chart colors, when tokens are defined, then they are an accent-independent set resolvable as CSS custom properties.
- Given a sample button, input and card styled by the theme, when viewed at 360, 768 and 1280 px, then shapes and spacing follow `DESIGN.md` and targets are at least 44 px (manual check, no shipped demo page).

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| 44px container-height overrides for button, form-field, chip not asserted (VG, BH) | medium | patch | Deleting or misspelling the overrides keeps every test green; only the `:root` token value is checked. |
| `app.spec` chart test leaks injected style/class when an assertion fails (VG, BH, EC) | low | patch | Cleanup runs only at the end of the test body; direct fix is `afterEach`. |
| `describe.each(ACCENTS)` ignores the accent; `--w4a-*` roles live only on `:root`, so a new accent would not change them and would not be contrast-checked; `--w4a-primary` `#5a46d6` vs Material `#5945d5` (VG, BH, EC) | medium (unverified) | defer | Only matters once a second accent exists (Story 1.10, which is told to add accents without touching components). |
| Chart isolation check matches exact selectors only; `app.spec` half asserts its own injected CSS (VG, EC) | low | defer | Real protection is the compiled-CSS check; tighten with Story 1.10 when accents multiply. |
| First paint without theme class, class not removed on destroy (BH, EC) | low | rejected | Constructor runs in the bootstrap tick before paint; surfaces use `:root` tokens; single app instance. |
| 44px only for button, form-field, chips; sleep-clear 40px (BH, EC) | low | rejected | Spec scopes theme targets to button, input and chip; 40px is the `DESIGN.md` value; other controls arrive with their stories. |
| Roboto not loaded, so Arial renders (BH, EC) | low | rejected | Font link is optional in the spec; fallback stack is the design decision. |
| Color-literal scan gaps (`color-mix`, extended names, string `//`), hex-like false positives, broad `src/styles/` allowlist, spec files scanned (BH, EC) | low | rejected | Heuristic scan; real tree is clean; fixes add complexity. |
| Token verification shallow; extra contrast pairs; nested at-rules in `tokensOf`; `sass` not declared (BH, EC) | low | rejected | No defect shown; Material output has no nested rules today. |
| No dark theme, `theme-color` meta, focus ring, reduced motion, regeneration docs (BH) | low | rejected | Light theme only per spec; others belong to later stories. |

## Design Notes

The AC about rendering a sample at three widths cannot run in jsdom (no layout), and Playwright arrives in Story 5.5; it is a manual check using `npm start` with a temporary markup edit that is not committed. Accent classes follow `theme-<accent id>`; Story 1.10 adds `teal`, `orange`, `magenta`, `blue`, `green` the same way.

## Verification

**Commands:**
- `npm run check` -- expected: exit 0
- `npx ng build` -- expected: build succeeds, no budget error

**Manual checks:**
- `npm start`, temporarily place a Material button, input field and card in `app.html`, view at 360, 768 and 1280 px: violet primary, rounded shapes, 44 px targets. Revert the markup.
