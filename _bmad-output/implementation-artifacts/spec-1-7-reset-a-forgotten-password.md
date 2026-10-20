---
title: '1-7 Reset a forgotten password'
type: 'feature'
created: '2026-10-20'
baseline_commit: 'f9cd5526418e3707b56b4532b6f71ca05bc92e6a'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-bmad612_home-2026-10-19/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A user who forgot the password has no way back into the Account, and any reset flow that answers differently for unknown addresses would reveal who is registered (FR-3, UX-DR3).

**Approach:** Add `sendPasswordReset` to `AuthService`, a Reset screen at `/reset` that always shows the same neutral confirmation after a valid email, and a link to it from the Login screen.

## Boundaries & Constraints

**Always:** `sendPasswordReset(email)` returns `AuthResult`, calls Firebase `sendPasswordResetEmail`, and maps `auth/user-not-found` to `ok` so an unregistered address looks like a registered one even when Firebase protection is off; `auth/invalid-email` maps to `invalid-email`, `auth/network-request-failed` to `network`, anything else to `unknown`, with the closed `AuthErrorCode` set unchanged. The screen validates the email shape first (same rule as Login): an invalid shape shows an inline message under the field, focuses the field, and calls nothing. On `ok` the form is replaced by one neutral confirmation (same text whether or not the address is registered, no address-specific claim such as "we sent it to X"), announced with `aria-live="polite"`, plus a link back to `/login`. `network`/`unknown` show a form-level message and keep the field value. Pending state disables the button so a second request is not sent. `/reset` is public (guard already lists it) and loads with `loadComponent`; a signed-in user may open it. All text in `shared/strings.ts` (`it` and `en`, warm, no exclamation marks). Standalone, OnPush, signals, prefix `w4a-`, tokens only, 44 px targets, modeled on `login.component.*`. Email-enumeration protection is a Firebase console setting: add one entry to `deferred-work.md` naming it for the Story 5.6 release checklist (no code can enable it).

**Never:** No change to `firebase.ts`, `firestore.rules`, `eslint.config.js`. No Firestore access. No cooldown or rate-limit logic. No password change screen (Firebase hosts the reset page).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Registered address | Valid email, Firebase succeeds | Neutral confirmation shown, form hidden | N/A |
| Unregistered address | Valid email, Firebase `auth/user-not-found` | Identical neutral confirmation | No error shown |
| Invalid format | `abc`, empty, `a@b` | Inline message, focus on field, `sendPasswordResetEmail` not called | Field value kept |
| Network or other error | Offline or unexpected failure | Form-level message, no confirmation | Field value kept |
| Double submit | Pressed while pending | Second call not made | Button disabled |
| Login link | Click "Forgot password?" on Login | Navigates to `/reset` | N/A |
| Back to login | Click link on Reset or confirmation | Navigates to `/login` | N/A |

</frozen-after-approval>

## Code Map

- `src/app/core/data/auth.service.ts` -- add `sendPasswordReset`; import `sendPasswordResetEmail` from `firebase/auth`; extend (not replace) `toAuthErrorCode` or special-case `auth/user-not-found` inside the new method only, because `login` maps it to `invalid-credentials`.
- `src/app/core/data/auth.service.spec.ts` -- mocks `firebase/auth`; add `sendPasswordResetEmail` to the mock and the four result cases.
- `src/app/features/auth/reset.component.{ts,html,scss}` (new) -- copy the structure of `login.component.*`: reactive form, `EMAIL_SHAPE`, `MESSAGE_KEYS`, `pending`, `aria-live` regions kept rendered, focus on invalid field.
- `src/app/features/auth/login.component.html` -- add `routerLink="/reset"` link; `login.component.spec.ts` gets a link test.
- `src/app/app.routes.ts`, `src/app/app.routes.spec.ts` -- add `reset` route with `sessionGuard` and `loadComponent`; the spec's mocked `AuthService` needs `sendPasswordReset`.
- `src/app/shared/strings.ts` -- Reset title, email label, submit, confirmation, back link, and "Forgot password?" keys; reuse `authErrorInvalidEmail`/`authErrorNetwork`/`authErrorUnknown`; `strings.spec.ts` checks both languages.
- `_bmad-output/implementation-artifacts/deferred-work.md` -- one entry for the Story 5.6 checklist.

## Tasks & Acceptance

**Execution:**
- [x] `auth.service.ts` + spec -- `sendPasswordReset` with the mappings above -- AC1, AC3
- [x] `strings.ts` -- Reset and "Forgot password?" keys in `it` and `en` -- AC1, AC3
- [x] `reset.component.*` + spec -- form, validation, neutral confirmation, errors, pending guard, matrix rows -- AC1, AC3
- [x] `login.component.html` + spec, `app.routes.ts` + spec -- link and `/reset` route -- AC1
- [x] `deferred-work.md` -- enumeration-protection entry for Story 5.6 -- AC2
- [x] matrix audit -- every I/O row covered by a test that ran -- verification

**Acceptance Criteria:**
- Given the Login screen, when "Forgot password?" is chosen, then the Reset screen opens and an email can be submitted.
- Given the Firebase Authentication settings, when the project is configured, then email-enumeration protection is listed for the Story 5.6 release checklist.
- Given an invalid email format, when submitted, then an inline message shows and nothing is sent.

## Implementation Notes

The subagent's report claimed `sendPasswordReset` service tests that did not exist; review caught it and they were added directly. `npm run test:rules` could not run (port 8080 held by a local emulator); this story changes no rules.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| `sendPasswordReset` has no service tests; component test mocks the service (VG, EC, BH) | medium | patch | `auth.service.spec.ts` only had the mock; added ok, user-not-found, invalid-email, network, too-many-requests, non-Firebase cases. |
| Confirmation `aria-live` region created together with its text may not be announced (BH, EC) | medium | patch | Region is now always rendered and filled on `sent()`; spec updated. |
| Reset email language and continue URL (BH) | low | defer | Not in the spec; recorded in deferred-work. |
| Stale `emailError` until resubmit; destroyed-component writes; stale fixture; `too-many-requests` generic; no resend; trimmed-email test; duplicated `EMAIL_SHAPE`/`MESSAGE_KEYS`; dead `.hint` (EC, BH) | low | rejected | Same behavior as Login, no demonstrated failure; fixes add branches. |

## Verification

**Commands:**
- `npm run check` -- expected: exit 0
- `npx ng build` -- expected: build succeeds
