---
title: '1-2 Connect to Firebase and protect each Account''s data'
type: 'feature'
created: '2026-10-20'
status: 'done'
baseline_commit: '91bf9e045ff1ad546a526929eae237337a5ffc68'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-bmad612_home-2026-10-19/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The app has no backend wiring. Account data must be protected by server-side rules (AD-8) and development must never touch real data (AD-11) before auth and preferences stories can build on them.

**Approach:** Add `firebase.json`, `firestore.rules` and emulator-backed rules tests with shared value vectors; add `local`/`prod` environment files and `core/data/firebase.ts`, which connects to the Auth and Firestore emulators only in `local`; run rules tests through `firebase emulators:exec`.

## Boundaries & Constraints

**Always:** Only `core/data` imports `firebase/*`; Firebase config only in `src/environments/`. Rules: `users/{uid}/entries/{id}` and `users/{uid}/preferences/app` only, `uid == request.auth.uid`, everything else denied. Entry write: `id` matches `YYYY-MM-DD`; keys subset of `weight, mood, sleep, updatedAt`; `weight` present; `updatedAt == request.time`; values `is number` (not `is float`); weight 20.0–400.0 step 0.1, mood integer 1–10, sleep 0–24 step 0.5, step checks with tolerance. Preferences write: `accent` in the six palette ids, `language` in `it|en`. Decided: palette ids are `violet, teal, orange, magenta, blue, green` (from DESIGN.md swatches); local emulator project id is `demo-weight4all`; the `prod` file holds clearly marked placeholder values until the real Firebase project exists (Story 5.6).

**Never:** No auth UI/service, stores, `SessionScope`, or client validators (later stories). No rules check for future days. No `@angular/fire`. No real deploy, Firebase login, or production project creation. No Hosting config.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Own paths | Signed-in uid reads/writes own entry or preferences | Allowed (valid data) | N/A |
| Other user / anon | uid mismatch, or unauthenticated | Read and write denied | Rules test asserts denial |
| Other path | e.g. `users/{uid}/other/x`, root docs | Denied | N/A |
| Entry values | weight 72 and 72.5; sleep 7 and 7.5; mood 7 | Allowed | N/A |
| Invalid entry | weight 19.9/400.1/72.55/string, mood 0/11/7.5, sleep -0.5/24.5/7.25, extra key, no weight, bad id (`2026-1-5`), `updatedAt` not `request.time` | Denied | N/A |
| Preferences | accent in palette and language `it`/`en` | Allowed | N/A |
| Bad preferences | accent `pink`, language `fr` | Denied | N/A |
| Environments | `local` vs `prod` | `local` connects to emulators; `prod` never does | N/A |

</frozen-after-approval>

## Code Map

- `scripts/test-rules.mjs` -- runs plain vitest today; switch to `firebase emulators:exec --only firestore --project demo-weight4all` wrapping vitest when tests exist (resolves deferred item). Keep the "no tests, exit 0" guard.
- `eslint.config.js` -- `core/data` already exempt from the firebase import ban; `tests/` and `src/environments` must lint clean; do not change rules.
- `package.json` -- firebase 12.19.0, firebase-tools 15.34.0, @firebase/rules-unit-testing 5.0.2 already pinned; add scripts `emulators` (`firebase emulators:start --only auth,firestore`) and `start:local` if needed. `deploy` stays `check && firebase deploy` unless `firebase.json` makes `--only firestore:rules` meaningful (leave Hosting to 5.6).
- `src/environments/environment.ts` (local), `environment.prod.ts` -- new; `angular.json` build `production` config gets `fileReplacements`.
- `src/app/core/data/firebase.ts` -- new; `initializeApp`, exports `auth`/`db`, `connectAuthEmulator`/`connectFirestoreEmulator` when `environment.name === 'local'`.
- `firebase.json`, `firestore.rules`, `firestore.indexes.json` -- new at root; emulators auth 9099, firestore 8080, UI off or 4000; Firestore location `eur3` noted in README-less comment only via config where supported.
- `tests/rules/` -- new `entries.spec.ts`, `preferences.spec.ts`, `vectors.ts` (shared value vectors), vitest config (node env, serial, long timeout).
- `.gitignore` -- already ignores emulator logs; add emulator export dir only if used.

## Tasks & Acceptance

**Execution:**
- [x] `src/environments/environment.ts`, `environment.prod.ts`, `angular.json` -- local (demo project, emulator hosts/ports) and prod (placeholder config, no emulator fields) environments; prod replaces local in production build -- AD-11
- [x] `src/app/core/data/firebase.ts` + `firebase.spec.ts` -- initialize app; connect emulators only in `local`; unit test with mocked `firebase/*` asserts connect calls for local and none for prod -- AC1
- [x] `firebase.json`, `firestore.indexes.json` -- Auth + Firestore emulators, rules path -- AC1
- [x] `firestore.rules` -- per Boundaries; default-deny; helper functions for number range/step with tolerance -- AD-8
- [x] `tests/rules/vectors.ts`, `entries.spec.ts`, `preferences.spec.ts`, vitest config -- access matrix, entry shape/ranges with integer and decimal vectors, preference enums; every I/O row covered -- AC2-4
- [x] `scripts/test-rules.mjs`, `package.json` -- run rules tests inside `firebase emulators:exec`; add `emulators` script -- gate integrity
- [x] `_bmad-output/implementation-artifacts/deferred-work.md` -- leave untouched (the resolved item is recorded in Implementation Notes)

**Acceptance Criteria:**
- Given JDK 21 and the emulators, when `firebase emulators:start` runs and the environment is `local`, then `firebase.ts` connects Auth and Firestore to them; `prod` holds config and no emulator connection; no Firebase config exists outside `src/environments/`.
- Given the rules tests, when `npm run test:rules` runs, then it starts the emulator itself, all tests pass, and a deliberately loosened rule makes it fail.
- Given `npm run check`, when run, then lint, unit and rules tests pass with exit 0.

## Implementation Notes

- Resolved deferred item: `scripts/test-rules.mjs` now runs vitest inside `firebase emulators:exec` (keeps the no-tests guard).
- `firebase.ts` exposes `initFirebase(env)` (testable; Angular unit-test runner cannot `vi.mock` relative imports) and exports `app`, `auth`, `db`. The `Environment` type lives in `environment.model.ts` because `environment.ts` is swapped by fileReplacements.
- Rules tests carry a file-level eslint-disable for `no-restricted-imports` (they need the SDK to drive the emulator).

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| Delete rule untested for non-owner, anonymous, and preferences (VG, BH, EC) | medium | patch | Only owner delete of an entry is tested; loosening `allow delete` keeps the suite green. |
| Prod `fileReplacements` swap not verified by any check (VG, EC) | medium (unverified) | defer | Prod config is placeholder until Story 5.6; build-output check fits there. |
| Placeholder prod config can ship through `deploy` (BH, EC) | low | defer | `deploy` has no Hosting yet; guard belongs with Story 5.6 release checklist. |
| Calendar-invalid ids (`2026-13-45`) pass the id regex (BH, EC) | low | rejected | Spec and Design Notes fix ids as shape-only regex; fix adds rule complexity. |
| `vi.mock` hoisting may break `firebase.spec.ts` (BH, VG) | false | rejected | `npm run check` ran the spec under `ng test` and passed. |
| `firebase`/rules-testing/tools deps missing from `package.json` (BH) | false | rejected | Pinned in Story 1.1; diff only shows changed hunks. |
| `updatedAt` type unchecked (BH) | false | rejected | `== request.time` only holds for a timestamp; tests cover past-date denial. |
| `is number` ordering in `isTenths`/`validMood` (BH) | false | rejected | `inRange` short-circuits `&&`; string and boolean vectors are denied in tests. |
| Thin update/merge/list/query tests (BH, EC) | low | rejected | Merged `request.resource.data` goes through the same `validEntry`; only extra tests, no defect shown. |
| NaN/Infinity/huge vectors (BH, EC) | low | rejected | Range check bounds them; no defect shown. |
| Local env with missing `emulators` skips connect silently (BH, EC) | low | rejected | Local file defines emulators; fix needs a type redesign. |
| Double init / HMR / import-time side effect (BH, EC) | low | rejected | ES module evaluates once; no demonstrated failure. |
| Ports and project id repeated in several files (BH, VG) | low | rejected | Cosmetic duplication; no single-source mechanism is in the spec. |
| `test-rules.mjs` shell quoting, Java-missing message, IPv6 host parsing (BH, EC) | low | rejected | Works on target Windows setup; failures are loud; extra guards add complexity. |
| Implicit default-deny with no catch-all match (EC) | false | rejected | Firestore denies unmatched paths; tests assert other paths are denied. |
| Auth emulator connection not exercised (BH, EC) | low | rejected | Auth work starts in Stories 1.5-1.7. |
| No README, `.firebaserc`, hosting section (BH) | low | rejected | Out of story scope (Story 5.6). |

## Design Notes

Rules number helpers use a tolerance, e.g. `math.abs(v * 10 - math.floor(v * 10 + 0.5)) < 1e-6` for weight tenths and the same on `v * 2` for sleep. Mood uses `v == math.floor(v)` plus range. Keep ids' `YYYY-MM-DD` as a regex only (calendar validity is not checked server-side).

## Verification

**Commands:**
- `npm run test:rules` -- expected: emulator starts, all rules tests pass
- `npm run check` -- expected: exit 0
- `npx ng build` -- expected: build succeeds
