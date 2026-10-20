# Validation review: ARCHITECTURE-SPINE.md (rubric pass)

Reviewer: independent read of spine, PRD, EXPERIENCE.md, DESIGN.md. Spine not edited. Stack verified against npm on 2026-10-19.

## Verdict

PASS WITH FIXES. The spine is strong: fixed divergence points are mostly real, rules are mostly mechanical, FR/NFR coverage is near complete. No blocker. Nine medium findings should be fixed before downstream stories, because each can make two units diverge or leaves an FR dependent on an unowned decision.

## Findings

### Medium

M1. Dimension registry cannot drive the Entry form, History row or Statistics as AD-3 claims (AD-3 vs AD-12/AD-13c).
AD-3 says forms, History rows, charts and Statistics "iterate the list". But the registry fields (key, field, unit, range, step, required, defaultValue, color, marker, label) have no input-control kind (stepper, ten faces, slider with clear "x"), no clearable flag, no display precision (Weight 1 decimal, Mood integer, Sleep half-hour), no History cell renderer (face + number). The Weight, Mood and Sleep cards differ in behavior (EXPERIENCE Component Patterns). A unit must then switch on a Dimension key, which AD-13(c) forbids by lint. Fix: add `control`, `clearable`, `precision`/format to the registry and say how widgets are looked up (a map keyed from the registry, in one allowed file), or exempt that one map in AD-13(c).

M2. `resolveRange(rangeId, today)` cannot resolve "All" (AD-4, FR-18).
"All time" needs the earliest Entry key; the signature has no entries argument. "1 y" (365 days vs calendar year) is also undefined. Two units will resolve "all" differently. Fix: define `resolveRange(rangeId, today, firstEntryKey?)` and the 1 y rule.

M3. Combined-chart scale handling (FR-19) is undecided in the spine.
UX decided "each line uses its own scale". The spine fixes only dataset building (AD-6). Whether this is three Chart.js y-axes or normalized values is a real divergence point for combined vs per-Dimension charts, tooltips and the text table (values must be raw, not normalized). Fix: one sentence in AD-6 (axis strategy, raw values in the table).

M4. Layering contradicts itself.
- `SessionScope` (core/data) must reset `DraftStore`, which sits in `shared/` (AD-9, AD-12, tree). The diagram says Data depends only on Domain.
- `today` (AD-4) and `windowClass` (Conventions) are "shell-owned" but read by features, while the diagram says Shell -> Features. That is a cycle.
- Where the Language signal lives (shared `strings.ts` vs `PreferencesStore` in data) is unstated.
Fix: move `today`, `windowClass`, `language` and `DraftStore` to a named location (for example `core/state`) and redraw the graph; or let stores register reset hooks.

M5. Mechanical enforcement has no gate (AD-13, AD-11).
AD-13 says "the build and the unit-test run fail", but `ng build` does not run ESLint and AD-11 says no CI. Nothing runs lint, tests or rules tests before a manual `firebase deploy`. Fix: name one `verify` script (lint, ng test, rules tests) and wire it as the Hosting `predeploy` hook or an explicit release step. Also AD-13(c) is a string-literal lint on "weight/mood/sleep", which will false-positive on `strings.ts` keys, CSS tokens such as `--chart-weight`, and `font-weight`. State the exemptions.

M6. Date formatting conflicts with the clock rule (AD-4/AD-13b vs AD-7/AD-14).
AD-7 says dates format through `domain/number.ts` with `Intl`. `Intl.DateTimeFormat` needs a `Date`, and AD-13(b) bans `new Date` outside `domain/day.ts`. Fix: put date formatting in `domain/day.ts` (or allow it explicitly); keep number formatting in `number.ts`.

M7. Accessibility (FR-25) has no architectural rule beyond chart text alternatives.
Not covered by any AD: `<html lang>` follows the Language and updates on switch; reduced-motion for the Happy effect; focus management (Happy effect Done, dialog focus restore, focus to first invalid field); polite live region for errors and "Saved"; 44 px targets. Treating F4 as a final polish pass invites each unit to build these differently. Fix: one AD or Conventions rows (shared dialog wrapper, one live-region service, `lang` handled by the Language owner, a reduced-motion helper).

M8. Accent derivation and AA contrast are neither decided nor deferred (AD-10, DESIGN.md note).
DESIGN.md says container, on-container, gradient and confetti tones for five of six accents are undecided, and teal and orange sit near 4.5:1. FR-25 requires AA in every option. AD-10 says "theme class at runtime" but not how the six themes are generated or tested. It is absent from Deferred. Fix: decide (M3 tonal palettes plus an automated contrast test) or list it under Deferred with an owner.

M9. FR-3 and NFR-1 depend on settings parked as "no code impact".
"Password-reset responses never reveal whether an address is registered" (AD-9, FR-3 testable) holds only if Firebase email-enumeration protection is on, a project setting listed under "Auth project settings". The Firestore database location (immutable, personal health data, Italian user) is neither decided nor listed. Move both into AD-11 as required first-deploy settings. Rollback of a bad deploy is also unstated.

### Low

L1. PRD vs UX conflict not recorded: Sleep default 6.0 h. PRD UJ-1 says a weight-only Entry leaves Sleep empty; UX and AD-3 store 6.0 h unless cleared. Following UX is reasonable, but the spine should note the PRD deviation so FR-22 (dashed over missing Sleep) and SM-C2 read correctly.

L2. "Entry for a future Day is blocked by the client" (AD-4) names no enforcement point. Route `/history/:dayKey` can be hand-typed (also invalid keys). Say who validates and what happens on a bad key.

L3. Happy effect trigger: AD-12 says "only when saving today's Entry"; UX says "after Save on Today". Editing today's Entry from History is ambiguous.

L4. Language flash on reload: before `PreferencesStore` loads, Language is English (AD-10), so an Italian user sees English briefly, against FR-28. Gate render until preferences resolve, or cache the Language in localStorage as a hint.

L5. AuthService errors (email in use, weak password, bad credentials) are outside the AD-5 closed set and the "store methods" convention. Add a closed set of auth codes. Auth persistence mode (local, for FR-2) is not stated.

L6. PreferencesStore failure behavior is unspecified (revert or keep after optimistic apply). Palette ids and language list are duplicated in client and rules without shared vectors (vectors cover numbers only).

L7. AD-5 timeout: a timed-out write can still flush later from the SDK queue while the UI shows an error and the Missing-entry sign; idempotence plus re-read mitigates it, but document it. Initial load has no timeout. The single all-entries read grows unbounded for "All" and gates the Today pre-fill (FR-27 3 s); acceptable for v1, state the limit.

L8. AD-1 lint should also restrict `@firebase/*` and `@angular/fire`. Rules do not require `updatedAt == request.time`; mood integer check is not spelled out in AD-8.

L9. No route table (only `/history/:dayKey`): tab paths, auth paths, lazy boundaries left to units. Error presentation (snackbar plus inline, UX State Patterns) is not in Conventions.

L10. Deferred "zone.js under Angular 22": decide zoneless vs zone at scaffold, since it changes test style and chart change detection. Custom Range deferral is conscious but is a PRD FR-18 consequence; record it as a PRD deviation.

## Checklist results

1. Fixes the real divergence points: yes, except M1, M2, M3, M7, M8.
2. Every AD Rule enforceable and prevents its divergence: AD-1, 2, 5, 8, 9, 14 yes. AD-3 and AD-13 weakened (M1, M5). AD-4 weakened (M2, M6, L2). AD-6 good. AD-10 partial (M8). AD-11 thin but acceptable for two environments.
3. Deferred cannot let units diverge: mostly OK. Exceptions: accent derivation (not listed, M8), enumeration protection and Firestore location (M9), zone.js (L10).
4. FR/NFR coverage, individually:
   - Covered: FR-1 to FR-17, FR-19 to FR-24, FR-26 to FR-29, NFR-1 to NFR-5.
   - Partially: FR-1/FR-3 (L5, M9), FR-6 (M8), FR-19 (M3), FR-25 (M7).
   - Consciously deferred: FR-18 custom Range (UX not designed; record as PRD deviation), FR-26 (verified in F4).
   - Uncovered outright: none. FR-18 "All" is covered but unimplementable as specified (M2).
5. Named tech verified-current (npm, 2026-10-19): Angular, Material, CDK 22.2.3; rxjs 7.8.2; chart.js 4.5.1; ng2-charts 11.0.0 (peer Angular >=22); vitest 5.0.5; jsdom 30.1.3; firebase-tools 15.34.0; playwright 1.64.1 all equal latest. TypeScript ~6.0.3 is correct, not latest (7.0.2), because `@angular/build` peers `typescript >=6.0 <6.1`; add that reason to the spine. firebase 12.19.0 exists (latest 13.0.0, upgrade deferred and stated); `@firebase/rules-unit-testing` 5.0.2 peers `firebase ^12` (latest 6.0.0, deferred). zone.js ~0.16.0 covers latest 0.16.3. Node >=24.15.0 matches the Angular engines range. JDK >=21 not re-verified.
6. Altitude dimensions: deployment (Hosting, manual deploy, order) decided. Environments (local emulator, prod) decided; staging deferred. Operations: backup and monitoring deferred with rationale; rollback, Firestore location, auth project settings not decided or deferred explicitly (M9).
7. Internal consistency: no direct AD-vs-AD contradiction beyond M4 (layer cycle), M6 (clock vs date format), M1 (iterate vs widgets). Spine and UX agree on Language default, Sleep default, Entry edit presentation, `windowClass` classes. PRD deviations to note: L1 and FR-18 custom Range.
