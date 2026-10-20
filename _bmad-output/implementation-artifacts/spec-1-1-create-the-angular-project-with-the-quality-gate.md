---
title: '1-1 Create the Angular project with the quality gate'
type: 'feature'
created: '2026-10-20'
status: 'done'
baseline_commit: '64b91eb2db5fce5fb8e4994df7662486198d3803'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-bmad612_home-2026-10-19/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The repository has planning artifacts but no application. Every later story needs a base that already enforces the architecture rules (layering, single Firebase boundary, date/number/DOM restrictions) instead of relying on review.

**Approach:** Scaffold the Angular 22.2.3 app at the repository root with the pinned stack, put the repo under git, wire ESLint rules for AD-1/AD-13 with fixtures proving each rule fires, create the spine's folder layout, and add `npm run check` / `npm run deploy` scripts.

## Boundaries & Constraints

**Always:** Standalone components, signals, OnPush, strict TypeScript ~6.0.3, zoneless-compatible code, selector prefix `w4a-`. Pin the spine's stack versions exactly (no `@angular/fire`). Unit tests are Vitest with jsdom via `ng test`. Keep existing `_bmad`, `.claude`, `.github`, `.agents`, `docs`, `_bmad-output` untouched.

**Never:** No Firebase config, rules, auth, theme, i18n or feature code (Stories 1.2+). No literal Dimension keys rule (AD-13c) or template-text scan (AD-13f): they need code that does not exist yet and belong to Stories 1.3/2.x. No CI, no staging.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Violation fixture | Source using a forbidden import/API at a path where it is banned | ESLint reports the matching rule | Fixture test fails if no error |
| Allowed use | Same API in its owner (`core/data`, `domain/day.ts`, `ClockService`, `domain/number.ts`) | No lint error | N/A |
| Failing gate | Any lint, unit or rules test failure | `npm run check` exits non-zero | `npm run deploy` stops before deploying |

</frozen-after-approval>

## Code Map

- `package.json` -- greenfield; scaffold with `npx @angular/cli@22.2.3 new weight4all --directory . --style=scss --ssr=false --routing --skip-git --test-runner=vitest` (non-empty root; fall back to scaffolding in the scratchpad and copying if the CLI refuses), then pin versions.
- `eslint.config.js` -- flat config; angular-eslint + typescript-eslint versions supporting TS 6.0 (`typescript <6.1`); holds `no-restricted-imports`/`no-restricted-syntax`/`no-restricted-properties` overrides per layer.
- `src/app/{features/{auth,today,history,report,settings},shell,domain,core/state,core/data,shared}` -- spine layers; `.gitkeep` only where empty.
- `src/app/domain/day.ts`, `src/app/domain/number.ts`, `src/app/core/state/clock.service.ts` -- do NOT create; named only as lint exemption paths.
- `src/environments/`, `tests/rules/`, `e2e/` -- placeholders.
- `tests/lint/fixtures/` + `tests/lint/rules.spec.ts` -- fixture violations linted through the ESLint Node API with virtual `filePath`s.
- `.gitignore` -- node_modules, dist, .angular, emulator logs, `.firebase`, coverage.
- `_bmad-output/implementation-artifacts/spec-*.md`, `sprint-status.yaml` -- do not change except by sprint sync.

## Tasks & Acceptance

**Execution:**
- [x] `./` -- run `git init`; scaffold Angular 22.2.3 (standalone, signals, OnPush schematics default, strict) into the repo root -- AC1, AD-11
- [x] `package.json` -- pin stack (Angular/Material/CDK 22.2.3, TS ~6.0.3, rxjs ~7.8.2, zone.js ~0.16.0, firebase 12.19.0, chart.js 4.5.1, ng2-charts 11.0.0, vitest 5.0.5, jsdom 30.1.3, @firebase/rules-unit-testing 5.0.2, firebase-tools 15.34.0, @playwright/test 1.64.1); `engines.node >=24.15.0`; scripts `lint`, `test`, `test:rules`, `check`, `deploy` -- AC4
- [x] `angular.json` / `src/app/app.config.ts` -- OnPush default and `w4a` prefix, zoneless-compatible config -- conventions
- [x] `eslint.config.js` -- rules: (a) layer import table and `firebase/*`/`@firebase/*` only in `core/data`; (b) `new Date`, `Date.now`, `Date.parse`, `Intl.DateTimeFormat` banned except `domain/day.ts` and `ClockService` (spec files exempt for fake clocks); (d) Angular/DOM imports banned in `domain`; (e) `toFixed`, `toLocaleString`, `Intl.NumberFormat` banned except `domain/number.ts` -- AC2
- [x] `tests/lint/rules.spec.ts` + `tests/lint/fixtures/*` -- one violation fixture per rule plus allowed-path cases -- AC2
- [x] `src/app/**`, `src/environments`, `tests/rules`, `e2e` -- folder layout with minimal placeholders -- AC3
- [x] `package.json` scripts -- `check` = lint && test && test:rules (rules script passes with no tests yet, non-zero on failure); `deploy` = `npm run check && firebase deploy` placeholder chain stopping on failure -- AC4
- [x] `.gitignore`, initial commit -- AC1

**Acceptance Criteria:**
- Given an empty-of-app root and Node 24.15, when scaffolded and pinned, then `ng build` and `ng test` pass and `git status` works with a `.gitignore`.
- Given each banned pattern in a fixture at a banned path, when ESLint runs, then the matching rule errors; allowed paths do not.
- Given the layout in the spine, when the tree is listed, then every listed directory exists.
- Given a failing lint, when `npm run check` or `npm run deploy` runs, then exit code is non-zero and deploy does not proceed.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| Layer ban lists only partly pinned by tests (VG) | medium | patch | Removing a layer from a ban list left every test green; 9 violation cases added. |
| Dynamic `import()` / lazy routes bypass firebase boundary (EC, BH) | medium | patch | `no-restricted-imports` ignores `ImportExpression`; selector + fixtures added, core/data exempt. |
| `@types/node` undeclared (BH, EC) | low | patch | Only transitive; declared in devDependencies. |
| `test-rules.mjs` throws if `tests/rules` missing (VG, BH, EC) | low | patch | Added `existsSync` guard. |
| Domain purity rxjs/zone.js/other DOM globals unpinned (VG) | low | defer | Secondary list coverage; see deferred-work. |
| Rules tests need emulator once rules tests exist (BH, EC, VG) | medium (unverified) | defer | Belongs to Story 1.2 when first rules test lands. |
| `deploy` lacks build / firebase.json (BH, EC) | low | defer | Story 1.2 adds firebase.json; spec calls deploy a placeholder chain. |
| features/shared importing core/data unrestricted (BH, EC) | false | rejected | Spine table allows `core/*` for features and shared. |
| Firebase scaffolding, environments missing (BH) | false | rejected | Story 1.2 scope; spec Never-list. |
| zone.js pinned but unused (BH, EC) | false | rejected | Pinning mandated by spec/spine; zoneless-compatible. |
| Date rule gaps (toLocaleDateString, Date.UTC, globalThis.Date), aliasing (BH, EC) | low | rejected | Beyond spec list; fix adds complexity. |
| `**/data`, `**/core` patterns may match packages (BH, EC, VG) | low | rejected | No such packages; harmless today. |
| DOM globals list incomplete (EC) | low | rejected | Spec names no list; extension adds complexity. |
| strictTemplates, .nvmrc, prettier script, README, .gitignore extras, vscode config, index.html meta, budgets, Playwright config (BH) | low | rejected | Cosmetic or out of story scope. |
| Mixed ^/~ ranges (EC claim) | false | rejected | Spec pins stack packages; tooling versions are spec-flagged as chosen at scaffold. |

## Design Notes

Lint exemptions by file glob in flat config (`files`/`ignores` blocks). Fixtures live outside `src` and are excluded from the normal lint run; the spec lints them as strings with `new ESLint({ overrideConfigFile })` and `lintText(code, { filePath })` so the layer rules apply by virtual path. `deploy` cannot run `firebase deploy` meaningfully until Story 1.2 adds `firebase.json`; it chains `check` first and stops on failure.

## Verification

**Commands:**
- `npm run check` -- expected: exit 0
- `npx ng build` -- expected: build succeeds
- `npx ng test --watch=false` -- expected: all pass
