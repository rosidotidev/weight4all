---
title: '1-5 Register with email and password'
type: 'feature'
created: '2026-10-20'
status: 'done'
baseline_commit: '2635faaf99e23b9a5469be59a7f4920e007ecf28'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-bmad612_home-2026-10-19/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A visitor cannot create an Account. Bob needs a Register screen and an `AuthService` that signs the new user in and never exposes raw Firebase errors (FR-1, AD-9).

**Approach:** Add `AuthService.register` in `core/data` returning `ok` or `auth-error(code)` from the closed set, a Register screen under `features/auth` with inline, announced, focus-managed errors in both Languages, and a placeholder `/today` route to land on.

## Boundaries & Constraints

**Always:** Only `core/data` imports `firebase/*`. Error codes are the closed set `invalid-credentials | email-in-use | weak-password | invalid-email | network | unknown`; Firebase codes map to it (`auth/email-already-in-use` -> `email-in-use`, `auth/weak-password` -> `weak-password`, `auth/invalid-email` -> `invalid-email`, `auth/network-request-failed` -> `network`, anything else -> `unknown`); raw Firebase text is never shown or kept in the result. All text (labels, hints, buttons, one message per error code) in `shared/strings.ts` with `it` and `en`, warm tone, no exclamation marks. Client validation: email shape and password of at least 6 characters (Firebase minimum), same messages as the server codes. On error: message inline under the field (or form-level for `network`/`unknown`), focus moves to the first invalid field, message announced politely (`aria-live="polite"`), no Account created. Submit button disabled while the call runs. Standalone, OnPush, signals, prefix `w4a-`, styles from tokens (no color literals), 44 px targets.

**Never:** No session signal, guard, login, logout, reset screens or `SessionScope` (Stories 1.6, 1.7). No Firestore writes (no preferences doc on register). No password strength meter, confirm-password field or email verification. No Language switcher.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Success | Valid unused email, password >= 6 chars | Account created, user signed in, navigate to `/today` placeholder | N/A |
| Email in use | Existing email | `email-in-use` message under the email field, focus on email | No Account created |
| Invalid email | Malformed address | `invalid-email` message, focus on email (client-side, no call made) | N/A |
| Weak password | Fewer than 6 characters | `weak-password` message, focus on password (client-side, no call made) | N/A |
| Both invalid | Bad email and short password | Both messages; focus on the first invalid field (email) | N/A |
| Network | Offline or request fails | `network` form-level message, fields keep their values | No navigation |
| Unknown | Any other Firebase error | `unknown` form-level message | No raw text shown |
| Double submit | Submit pressed while pending | Second call not made | Button disabled |

</frozen-after-approval>

## Code Map

- `src/app/core/data/auth.service.ts` (new) -- `register(email, password): Promise<AuthResult>` using `createUserWithEmailAndPassword` on `auth` from `firebase.ts`; exports `AuthErrorCode`, `AuthResult` (`{ ok: true } | { ok: false; code }`), and a `toAuthErrorCode` mapper. Story 1.6 adds login and the session signal here.
- `src/app/features/auth/register.component.ts` + `.html` + `.scss` (new) -- reactive form, signals for pending and errors, focus first invalid field, `aria-live="polite"` region, link to `/login` (route arrives in Story 1.6, link text from `strings.ts`).
- `src/app/features/auth/auth.routes.ts` or `src/app/app.routes.ts` -- routes `register` (and redirect of the empty path to `register` until Story 1.6 adds the guard), `today`.
- `src/app/features/today/today.component.ts` (new) -- placeholder only; its text from `strings.ts`; Story 2.x replaces it.
- `src/app/shared/strings.ts` -- add keys for the Register screen; `I18n.t()` in templates (`{{ t().key }}`).
- `src/app/core/data/firebase.ts`, `firestore.rules`, `eslint.config.js` -- do not change. Unit tests mock `firebase/auth` (the Angular runner rejects `vi.mock` on relative imports).
- `tests/lint/template-text.spec.ts`, `color-literals.spec.ts` -- already scan new templates and styles; keep them green.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/core/data/auth.service.ts` + spec -- `register` and error mapping; spec mocks `firebase/auth` and covers success and each code (`email-in-use`, `weak-password`, `invalid-email`, `network`, `unknown`) -- AC1, AC3, AC4
- [x] `src/app/shared/strings.ts` -- Register keys in `it` and `en`, one message per error code -- AC2
- [x] `src/app/features/auth/register.component.*` + spec -- form, client validation, inline announced errors, focus on first invalid field, pending state, navigation on success -- AC1, AC2
- [x] `src/app/features/today/today.component.ts` + routes -- placeholder `/today`, `register` route, empty path redirect -- AC1
- [ ] matrix audit -- every I/O row covered by a test that ran -- verification

**Acceptance Criteria:**
- Given a valid, unused email and a password of at least 6 characters, when the Register form is submitted, then an Account is created, the user is signed in and lands on `/today`.
- Given an email in use, an invalid email or a too-short password, when submitted, then a message from `strings.ts` shows inline, focus moves to the first invalid field, it is announced politely, and no Account is created.
- Given any auth call fails, when `AuthService` returns, then the result is `auth-error(code)` from the closed set and no raw Firebase text reaches the UI.
- Given both Languages, when the screen shows, then every text is available in English and Italian in the warm tone.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| `pending` reset before `navigateByUrl`, so the button re-enables during navigation and a second submit gives a spurious `email-in-use` (EC, BH) | medium | patch | `register.component.ts` sets `pending(false)` right after `register` resolves; the Double submit row says the second call must not be made. |
| Route table (`''` redirect, `register`, `today`) not exercised by any test (VG) | medium | patch | Register spec uses `provideRouter([])` and a spy; deleting the `/today` route keeps all tests green. |
| Email trimming has no discriminating test (VG, BH) | low | patch | Every test submits an unpadded email; removing `.trim()` stays green. |
| Empty `aria-live` regions are `display: none`, so polite announcements may be skipped (EC, BH) | medium | patch | `register.component.scss` hides `:empty` live regions; content inserted into a hidden region is often not announced, which the story requires. |
| Initial bundle 781 kB over the 500 kB budget (build warning, BH-adjacent) | medium (unverified) | defer | `firebase/auth` is in the initial chunk via eager routes; lazy routes and the real budget fit Story 1.6/5.4. |
| `/login` link, `/today` open without session, signed-in user sees Register, no wildcard route (BH, EC) | low | rejected | Spec states these until Story 1.6, which follows immediately and adds guard and login route. |
| Errors stay after the user edits a field (BH) | low | rejected | Cleared on next submit, as specified; extra behavior is not required. |
| Pending state not announced; focus lost on disabled button (BH) | low | rejected | Not in the spec; fix adds attributes and state. |
| `navigateByUrl` rejected or hung request, destroyed component (EC) | low | rejected | No demonstrated failure; fixes add timeouts and lifecycle guards. |
| Other Firebase codes (`too-many-requests`, `missing-password`) map to `unknown` (BH, EC) | low | rejected | Mapping is fixed by the spec; the closed set has no rate-limit code. |
| Password length repeated in strings; password not trimmed (BH, EC) | low | rejected | Firebase minimum is 6; trimming passwords would change the credential. |
| Account-enumeration wording for `email-in-use` (BH) | low | rejected | The story requires an `email-in-use` message; reset flow is the enumeration-protected one. |
| Error styling by weight only, Italian phrasing, missing show-password toggle, `<title>`, tests for Italian and `TodayComponent` (BH) | low | rejected | Cosmetic or beyond scope. |
| Matrix audit task left unchecked (EC claim) | false | rejected | All tasks are marked done; the component spec has one test per matrix row. |

## Design Notes

Tests use a mocked `firebase/auth`; a real-emulator register flow is deferred to the end-to-end journeys (Story 5.5). `invalid-credentials` stays in the closed set for Story 1.6 and is not produced by `register`. The `/login` link target does not exist until Story 1.6; that story follows immediately.

## Verification

**Commands:**
- `npm run check` -- expected: exit 0
- `npx ng build` -- expected: build succeeds
