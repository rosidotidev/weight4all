# Review: Stack versions and technology claims (ARCHITECTURE-SPINE.md)

Date: 2026-10-19. Method: `npm view` against the live registry for every pinned package, plus chartjs.org docs (line chart page). Spine not edited.

## Verdict
PASS with minor notes. Every pinned version exists and is the current `latest` on npm except firebase (13.0.0 is out, deliberately deferred) and @firebase/rules-unit-testing (6.0.0 is out, tied to firebase 13). No peer-dependency conflicts found. AD-6 is supported by Chart.js.

## Pinned versions vs registry
| Package | Spine | npm latest | Note |
| --- | --- | --- | --- |
| @angular/core, cli, material, cdk | 22.2.3 | 22.2.3 | current |
| typescript | ~6.0.3 | 7.0.2 | intentional: @angular/compiler-cli and @angular/build require `>=6.0 <6.1`; TS 7 would break the build |
| ng2-charts | 11.0.0 | 11.0.0 | current |
| chart.js | 4.5.1 | 4.5.1 | current |
| firebase | 12.19.0 | 13.0.0 | behind by one major, listed in Deferred |
| @firebase/rules-unit-testing | 5.0.2 | 6.0.0 | 5.x peer is firebase ^12; 6.0.0 needs ^13. Consistent pair with firebase 12 |
| vitest | 5.0.5 | 5.0.5 | current |
| jsdom | 30.1.3 | 30.1.3 | current |
| firebase-tools | 15.34.0 | 15.34.0 | current |
| @playwright/test | 1.64.1 | 1.64.1 | current |
| rxjs | ~7.8.2 | 7.8.2 | current |
| zone.js | ~0.16.0 | 0.16.3 | range covers it |

## Peer / engines compatibility (checked)
- Angular core 22.2.3: rxjs ^7.4 ok; zone.js ~0.15||~0.16 ok; node ^22.22.3 || ^24.15.0 || >=26. Spine "Node >= 24.15.0" satisfies it (and cli, build, jsdom 30.1.3 which needs ^24.15.0).
- @angular/compiler-cli / @angular/build 22.2.3: typescript `>=6.0 <6.1` matches ~6.0.3. build accepts vitest `^4.0.8 || ^5.0.0` so Vitest 5.0.5 ok.
- Angular Material/CDK 22.2.3: core/forms/common ^22 || ^23 ok; cdk pinned to the same 22.2.3 ok.
- ng2-charts 11.0.0: chart.js ^3.4 || ^4 ok; @angular/* >=22 and cdk >=22 ok (note: it needs @angular/cdk, which is installed via Material; fine).
- @firebase/rules-unit-testing 5.0.2: peer firebase ^12.0.0 ok with 12.19.0; node >=20 ok.
- vitest 5.0.5: peer vite ^6.4 || ^7 || ^8 (vite is supplied transitively by @angular/build; not pinned in the spine, see finding 3); node ^22.12 || ^24 ok; @types/node must be ^22 or >=24.
- firebase-tools 15.34.0, playwright 1.64.1: node >=20 ok.
- chart.js 4.5.1 `engines: pnpm >=8` is a dev-only field, harmless for npm installs.

## AD-6 vs Chart.js docs
Confirmed from chartjs.org line chart docs:
- `spanGaps`: boolean | number; true draws lines between points with null data. Docs also state "To be able to style gaps, you need the spanGaps option enabled", which is exactly the AD-6 design.
- `segment`: "all of the border* and backgroundColor options are supported", so `borderDash` is valid. Scriptable context exposes `p0`, `p1`, `p0DataIndex`, `p1DataIndex`, `datasetIndex`.
- The combination spanGaps:true + segment.borderDash is the documented Line Segment Styling pattern (sample uses `ctx.p0.skip || ctx.p1.skip ? [6,6] : undefined`). The docs page itself does not spell out the combo in prose; confirmed by the sample pattern, not by an explicit sentence. Treat as supported.
- Implementation caveat (not a spine error): with spanGaps true, null points are skipped, so one segment can span several Days. The `bridged` flag must be resolved via `p0DataIndex`/`p1DataIndex` (or check `p.skip`), not by assuming adjacent indexes. Worth one sentence in AD-6.

## Findings
1. LOW: Angular 22 is zoneless by default (Angular's own stack), so `zone.js ~0.16.0` in the Stack may be unnecessary. It is allowed by core's peer range, but the spine does not say whether zone.js is used (conventions say signals + OnPush). Decide and state it, or drop it. Not verified from Angular docs in this review.
2. LOW: Firestore emulator needs a JDK (Java) installed locally; firebase-tools versions recently raised the minimum Java version. Spine AD-11/Stack do not list Java. From training knowledge, NOT confirmed here; verify the required JDK for firebase-tools 15.34.0 and add it to the Stack.
3. LOW: Vitest 5.0.5 needs a vite peer; the spine does not state whether tests run through Angular's built-in `ng test` (vitest runner via @angular/build, supported) or a standalone Vitest config. State which one, and that `@types/node` must be ^22 or >=24.
4. INFO: firebase 12.19.0 / rules-unit-testing 5.0.2 are one major behind (13.0.0 / 6.0.0). The Deferred entry covers it and the pair is internally consistent. If upgraded, both must move together. @angular/fire latest is 20.1.1 (peer @angular/core ^20), so "not used" is correct and Deferred wording ("revisit if it supports the Angular version") is accurate.
5. INFO: The spine records no source/date for the version check. Suggest adding "versions verified against npm registry 2026-10-19" to the Stack section so the decision is traceable.

## Technologies named and still valid
Firebase Auth, Firestore, Hosting, Emulator Suite, security rules, Angular Material M3 theming, Playwright, Vitest, ESLint `no-restricted-imports` all exist and fit. No named technology is abandoned. Material 22 M3 theming and Firebase emulator-connection API specifics were not re-verified against their docs in this review.
