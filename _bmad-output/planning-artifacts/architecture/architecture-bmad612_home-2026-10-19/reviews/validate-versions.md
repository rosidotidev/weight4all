# Review: Stack table and technology claims (read-only), 2026-10-19

Method: `npm view <pkg>@<ver> version peerDependencies engines` for every pinned package (local Node v24.15.0); tarball inspection of firebase-tools 15.34.0 and @firebase/firestore 4.17.2; doc fetches of chartjs.org, angular.dev, firebase.google.com. JDK on this machine: 21.0.12.

## Verdict
The stack is real, current and mutually compatible. No blocking issues. A few corrections and notes are worth adding to the spine, and three claims are not confirmed by docs and should be proven by a test at scaffold time.

## 1. Pins and peer compatibility (all pass)
| Package | Pinned | Latest on registry | Notes |
| --- | --- | --- | --- |
| @angular/core, cli, material, cdk | 22.2.3 | 22.2.3 | core engines node ^22.22.3, ^24.15.0 or >=26, matches "Node >= 24.15.0" |
| @angular/build (not in table) | 22.2.3 | - | peers typescript >=6.0 <6.1 and vitest ^4.0.8 or ^5.0.0; bundles vite 8.3.0 |
| typescript | ~6.0.3 | 7.0.2 | ~6.0.3 is REQUIRED: Angular 22 build/compiler-cli peer is `>=6.0 <6.1`. Do not float to 7 |
| rxjs | ~7.8.2 | 7.8.2 | peers `^7.4.0` OK |
| zone.js | ~0.16.0 | 0.16.3 | core peer `~0.15.0 or ~0.16.0` OK |
| ng2-charts | 11.0.0 | 11.0.0 | peers chart.js ^3.4 or ^4, Angular core/common/platform-browser and cdk >=22: OK |
| chart.js | 4.5.1 | 4.5.1 | OK |
| firebase | 12.19.0 | 13.0.0 | intentionally behind; Deferred records it |
| @firebase/rules-unit-testing | 5.0.2 | 6.0.0 | peer `firebase ^12.0.0`: pairs with firebase 12 only; do not bump alone |
| vitest | 5.0.5 | 5.0.5 | peers vite ^6.4/^7/^8, @types/node ^22 or >=24, jsdom "*"; node ^22.12/^24/>=26 OK |
| jsdom | 30.1.3 | 30.1.3 | node ^22.22.2, ^24.15.0 or >=26 OK; canvas peer optional |
| firebase-tools | 15.34.0 | 15.34.0 | node >=20 OK |
| @playwright/test | 1.64.1 | 1.64.1 | node >=20 OK |

Material 22.2.3 peers core/forms/common/platform-browser `^22 || ^23` and cdk exactly 22.2.3 (spine pins both). `@angular/platform-browser` is required (peer of Material and ng2-charts) but is not named in the spine's Angular row. No unresolved peer conflicts.

## 2. Technology claims
- **JDK >= 21: confirmed; the official docs page is stale.** The firebase.google.com install page still says "JDK 11 or higher". firebase-tools 15.34.0 source (`lib/emulator/commandUtils.js`) sets `MIN_SUPPORTED_JAVA_MAJOR_VERSION = 21` ("firebase-tools no longer supports Java version before 21"). Spine is right.
- **`ng test` uses Vitest by default: confirmed** (angular.dev testing guide: new projects default to Vitest and include `vitest` and `jsdom`; Karma supported but not default; happy-dom swappable). Applies to projects scaffolded with the Angular 22 CLI.
- **zone.js**: Angular 22 core still lists it as a peer (`~0.15 || ~0.16`). Signals + OnPush design suggests deciding zoneless now rather than "at scaffold time".
- Material 22 M3 theming and ng2-charts lazy registration (`provideCharts`) were not verified in docs; low risk.

## 3. AD-6 Chart.js claims
- `spanGaps: true` + `segment.borderDash`: confirmed. The line docs say "To be able to style gaps, you need the spanGaps option enabled"; the segments sample uses `borderDash: ctx => skipped(ctx, [6,6])` with `spanGaps: true`.
- `p1DataIndex`: confirmed in the line-chart docs (segment context has `type`, `p0`, `p1`, `p0DataIndex`, `p1DataIndex`, `datasetIndex`).
- UNCONFIRMED: the spine's statement that with spanGaps `p0`/`p1` are the non-null ends (not consecutive Days). The docs do not say this explicitly; the sample only shows `p0.skip || p1.skip`. Recommendation: add a test asserting `p0DataIndex`/`p1DataIndex` for a series with null gaps before relying on `bridgedFromPrev` at `p1DataIndex`. The design is robust if p1DataIndex is the segment's end index.

## 4. AD-8 Firestore rules expressibility
- `keys().hasOnly([...])`: confirmed (rules.Map `keys()`, rules.Set `hasOnly()` reference pages exist). Presence check via `hasAll(['weight'])`.
- Regex on document id: confirmed (`String.matches(re)`, e.g. `id.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}$')`).
- Tolerance step checks: expressible; `math.abs`, `math.round`, `math.floor`, `math.ceil` exist.
- `is number`: UNCONFIRMED by a page I could fetch (the reference pages did not surface the string). It is a documented Firestore type check accepting int and float. Prove with the mandated emulator tests using both `72` (int) and `72.5` (float).
- Optional hardening not in AD-8: `updatedAt == request.time` and `is timestamp`.

## 5. AD-5 offline setDoc behaviour: confirmed
@firebase/firestore 4.17.2 typings for `setDoc`: the promise "resolves once the data has been successfully written to the backend", and awaiting it is "usually undesirable" because the time before it resolves or rejects is indefinite offline. The 10 s race is justified. Caveats to add:
1. The write is not cancelled when the race times out; the SDK keeps it queued (in memory) and sends it on reconnect, so the document may still land later. UI wording for `timeout` should be "not confirmed". A retry resends the same full document, so idempotence holds.
2. For the post-timeout re-read use `getDocFromServer`. A plain `getDoc` can return the local pending write (latency compensation) or fail `unavailable` offline.
3. "No offline persistence" matches the web SDK default (memory cache).

## 6. Other findings
- Stack header says "Verified against the npm registry on 2026-10-19": true. TypeScript (7.0.2 exists) and firebase/rules-unit-testing (13/6) are behind latest on purpose; only firebase is explained in Deferred. Add a note for TypeScript.
- AD-13 depends on ESLint `no-restricted-imports`, but ESLint, typescript-eslint and angular-eslint are not in the Stack table. Not checked here: whether typescript-eslint's TypeScript peer range accepts 6.0.x. Add and verify.

## Recommended spine edits (not applied)
1. Note "TypeScript capped below 6.1 by the Angular 22 peer range".
2. Add `@angular/platform-browser` and the ESLint tooling rows; verify TS 6 support.
3. AD-5: re-read with `getDocFromServer`; state a timed-out write stays queued and may still land.
4. Add a test for segment `p0DataIndex`/`p1DataIndex` with null gaps (AD-6).
5. AD-8: rely on emulator tests to prove `is number` with int and float inputs.
