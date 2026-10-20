---
title: '1-6 Log in, stay logged in and log out'
type: 'feature'
created: '2026-10-20'
status: 'done'
baseline_commit: '0c55fa68d1b075d71b6bcf6aed5f89d35a08e098'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-bmad612_home-2026-10-19/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** There is no session. Anyone can open `/today`, a reload cannot tell "signed out" from "not resolved yet", and nothing stops data from one Account reaching the next (AD-9, FR-2).

**Approach:** Add a tri-state session signal and `login`/`logout` to `AuthService`, one route guard that waits out `unknown`, a `SessionScope` that bumps `sessionEpoch` on every session change, a Login screen, and a placeholder Settings screen with a Log out button.

## Boundaries & Constraints

**Always:** Session is `unknown | signedOut | signedIn(uid)`, driven by Firebase `onAuthStateChanged`; `login` and `register` also set it on success so the guard never sees a stale `signedOut` right after sign-in. Firebase persistence stays the web default (local), so a reopened browser stays signed in until logout. The guard waits while `unknown` (no login flash on reload), lets `login`, `register` and `reset` through when signed out, sends every other address to `/login` when signed out, and sends a signed-in user from `login`/`register` to `/today`. Empty path goes to `/today`. `SessionScope` (in `core/data`) increments `sessionEpoch` on every change (login, logout, user replaced by another), calls every registered store reset, and calls registered store loaders only when `signedIn`; stores register through it, and no store reads data before the guard allows the route. `login` returns `ok` or `auth-error(code)`; Firebase `auth/invalid-credential`, `auth/wrong-password`, `auth/user-not-found`, `auth/invalid-login-credentials` all map to `invalid-credentials`; other mappings as in Story 1.5. Wrong credentials show one inline message that does not reveal which part was wrong. All text in `shared/strings.ts` (`it` and `en`, warm, no exclamation marks). Routes load with `loadComponent`. Standalone, OnPush, signals, prefix `w4a-`, tokens only (no color literals), 44 px targets. Logout is in a placeholder Settings screen at `/settings` (button text from `strings.ts`); Story 1.9 replaces it. After logout the user returns to `/login` and back navigation shows no Entry data (the guard blocks it).

**Never:** No password reset screen or link (Story 1.7). No Firestore reads or writes. No Language or accent controls. No new stores (the draft store joins from Story 2.2); `PreferencesStore` keeps its device-level Language cache and is not reset by `SessionScope` in this story.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Cold start, no session | Any address | Session `unknown` shows nothing, then `/login` only; no data loaded | N/A |
| Reload while signed in | Session starts `unknown` | Guard waits, lands on the requested route, login never flashes | N/A |
| Valid login | Right email and password | Session `signedIn(uid)`, lands on `/today` | N/A |
| Wrong credentials | Wrong password or unknown email | One message "email or password is not right"-style, focus on email, same text for both cases | No Firebase text |
| Network or other error | Offline or unexpected failure | `network` / `unknown` form-level message | Fields keep values |
| Signed-in user opens `/login` or `/register` | Session `signedIn` | Redirected to `/today` | N/A |
| Logout | Press Log out in `/settings` | Session `signedOut`, navigate to `/login`; back to `/today` redirects to `/login` | N/A |
| Session change | Login, logout, or one uid replaced by another | `sessionEpoch` increases by 1; resets run; loaders run only when `signedIn` | N/A |
| Double submit | Login pressed while pending | Second call not made | Button disabled |

</frozen-after-approval>

## Code Map

- `src/app/core/data/auth.service.ts` -- extend (Story 1.5 created it with `register`, `AuthErrorCode`, `toAuthErrorCode`): add `session` signal, `onAuthStateChanged` subscription, `login`, `logout`, `invalid-credentials` mapping; `register` sets the session on success.
- `src/app/core/data/session-scope.ts` (new) -- `sessionEpoch` signal, `registerStore({ reset, load })`, effect/subscription on `AuthService.session`.
- `src/app/core/data/session.guard.ts` (new) -- functional `CanActivateFn`; waits out `unknown` (signal-to-promise), applies the rules above.
- `src/app/features/auth/login.component.*` (new) -- modeled on `register.component.*` (reactive form, inline announced errors, focus on first invalid field, pending guard, `aria-live` regions kept rendered); link to `/register`.
- `src/app/features/settings/settings.component.ts` (new) -- placeholder with Log out button.
- `src/app/app.routes.ts`, `src/app/app.routes.spec.ts` -- routes `login`, `register`, `today`, `settings` with guard and `loadComponent`; empty path to `/today`; update the Story 1.5 route tests accordingly.
- `src/app/shared/strings.ts` -- Login and Settings placeholder keys, `invalid-credentials` message.
- `src/app/core/data/firebase.ts`, `firestore.rules`, `eslint.config.js` -- do not change. Unit tests mock `firebase/auth`; a spec importing the real `./firebase` can break `firebase.spec.ts` unless modules stay isolated (it already calls `vi.resetModules()`).

## Tasks & Acceptance

**Execution:**
- [x] `auth.service.ts` + spec -- session signal (`unknown` then `signedOut`/`signedIn(uid)`), `login`, `logout`, `invalid-credentials` mapping, session set on login/register success -- AC1-2, AC5
- [x] `session-scope.ts` + spec -- epoch increments once per change (login, logout, uid replaced), resets always, loaders only when `signedIn` -- AC3
- [x] `session.guard.ts` + spec -- waits out `unknown`; each matrix routing row -- AC1-2
- [x] `login.component.*` + spec, `strings.ts` -- form, one message for wrong credentials, network/unknown, pending guard -- AC2, AC5
- [x] `settings.component.ts` + `app.routes.ts` + specs -- placeholder logout, routes, back-navigation blocked after logout -- AC4
- [ ] matrix audit -- every I/O row covered by a test that ran -- verification

**Acceptance Criteria:**
- Given no session, when any address opens, then only the login screen shows and no Entry data loads.
- Given a valid login, when signed in, then the user lands on `/today`; reopening the browser keeps the session until logout and a reload does not flash the login screen.
- Given any session change, when it happens, then `sessionEpoch` increments, store resets run, and loaders run only when `signedIn`.
- Given logout from Settings, when pressed, then the user returns to login and back navigation shows no Entry data.
- Given wrong credentials, when login is submitted, then one inline message appears that does not reveal which part was wrong.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| Addresses matching no route (`/foo`, `/reset`) never reach the guard and raise NG04002 instead of showing login (EC, BH) | medium | patch | `app.routes.ts` has four guarded routes and no wildcard; the story says every other address shows only the login screen. |
| `onAuthStateChanged` has no error callback, so the session can stay `unknown` and the guard hangs (BH, EC) | low | patch | `auth.service.ts` passes only the next callback; a one-line error callback falls back to `signedOut`. |
| Nothing verifies `App` injects `SessionScope` (VG) | medium | patch | Deleting `inject(SessionScope)` in `App` keeps every spec green; `session-scope.spec.ts` injects it directly. |
| Store registered after sign-in is never loaded; `last` seeded from the current session (BH, EC) | medium (unverified) | defer | No store exists yet; matters when the first store (Story 2.1/2.2) registers lazily. |
| No reactive redirect when the session ends elsewhere (token expiry, other tab) (BH) | medium (unverified) | defer | Guard runs only on navigation; stores are reset by `SessionScope`, but the screen stays; not in the spec. |
| `auth.service.spec.ts` failed all tests once in a `check` run when the real `firebase` module was cached before mocking (implementer report) | maybe-false | defer | Not reproduced in 9 later runs; settle by checking worker isolation in the Angular Vitest runner. |
| Epoch coalescing in one tick; throwing `reset`/`load`; no unregister (EC, BH) | low | rejected | Real auth events are async and no stores are registered yet; fixes add complexity. |
| Navigation rejected after login/logout leaves the button disabled; generic logout message (EC, BH) | low | rejected | No demonstrated failure; fix adds branches. |
| `reset` public path without a route; guard keyed on route path strings; wildcard/`canActivateChild` style (BH) | low | rejected | The spec lists `reset` as allowed; route `data` or parent routes are a style choice. |
| Manual `set` after login/logout racing the listener (EC) | low | rejected | Spec requires setting the session on success; `sameSession` equality absorbs repeats. |
| Login a11y (`aria-invalid` on email only, `role="alert"`), unused `.hint`, duplicated styles, import order, doc comments (BH) | low | rejected | Cosmetic or not required. |
| Persistence not tested against the real SDK; `too-many-requests` mapped to `unknown`; extra login test cases (BH, VG) | low | rejected | Persistence is the web default and covered by Story 5.5; mapping is fixed by the spec. |

## Design Notes

Unit tests mock `firebase/auth` (`onAuthStateChanged`, `signInWithEmailAndPassword`, `signOut`); persistence across restarts and real emulator login are covered by the end-to-end journeys (Story 5.5). A signal-to-promise helper (`toObservable` + `firstValueFrom` filtered on not-`unknown`) is one option for the guard wait.

## Verification

**Commands:**
- `npm run check` -- expected: exit 0
- `npx ng build` -- expected: build succeeds
