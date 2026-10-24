---
title: 'Always-reachable logout and active-tab icon in the app bar'
type: 'feature'
created: '2026-10-24'
status: 'done'
baseline_commit: '4992f95'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Log out lives only inside Settings > Account, so a signed-in user must open a tab to leave the app. The app bar's leading element is the logo dot on compact and medium, which says nothing about where the user is.

**Approach:** On every signed-in screen, add an exit icon button at the top right of the app bar that runs the same logout as Settings. On compact and medium, replace the logo dot at the top left with the icon of the active Tab, the same Material symbol as the bottom navigation, drawn slightly larger (28 px against 24 px). Tabs, the three layouts and their breakpoints stay as they are. Settings keeps its own "Log out" button.

**Decisions (2026-10-24):**
- The exit button's accessible name reuses `settingsLogout` ("Log out" / "Esci"). No new string.
- Logout runs through `AuthService.logout()`; on success navigate to `/login` with `replaceUrl`, as Settings does. On failure, show `authErrorUnknown` under the app bar in an `aria-live="polite"` region and keep the session, as Settings does.
- The exit icon is the Material "logout" glyph (24 px viewBox), `aria-hidden`, inside a button of at least 44 px touch target.
- DESIGN.md is updated: the app bar leading element is the active Tab icon (this overrides the approved mockup's logo dot in the app bar). The logo stays in the drawer and on Login.
- Expanded app bar: the active Tab icon sits before the Tab title, at the top left, so every window class shows the icon in the same place (chosen by the owner's delegation, 2026-10-24).

## Boundaries & Constraints

**Always:** New text goes through `shared/strings.ts` in English and Italian. Colours come from existing tokens (no hex in components). The button keeps keyboard focus and a visible `:focus-visible` outline. Layout works at 360 px with no horizontal scroll, on medium and on expanded. Labels stay translated and follow the Language live.

**Never:** No change to `TABS`, routes, the bottom navigation, the drawer layout, `AuthService.logout()`, or Firestore rules. No logout confirmation dialog. The logo SVG/CSS stays in the drawer brand block and on Login.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Active Tab icon | Route `/history/2026-10-19` | App bar icon is the History glyph, 28 px, `aria-hidden` | N/A |
| Logout success | Tap exit icon | `logout()` called once, navigate to `/login` (replace) | N/A |
| Logout failure | `logout()` returns `{ ok: false }` | Stays on the screen, button enabled, message under app bar | Message `authErrorUnknown` |
| Double tap | Tap exit twice while pending | One `logout()` call | Button disabled while pending |
| Italian | Language `it` | Button name "Esci"; Settings label unchanged | N/A |

</frozen-after-approval>

## Code Map

- `src/app/shell/shell.component.html` -- app bar: replace the `.logo` span on compact and medium with the active Tab icon; add the exit `<button>` at the right of the bar (after `.app-bar-date` on expanded, `margin-inline-start: auto` on the button otherwise); add the failure message region.
- `src/app/shell/shell.component.ts` -- inject `AuthService` and `Router`; compute the active Tab (reuse the `TABS.find` already in `title`/`tabTitle`, extract to one `activeTab` computed); add `logout()` (pending and failed signals, same as `settings.component.ts`).
- `src/app/shell/shell.component.scss` -- `.app-bar-icon` 28 px, `fill: currentColor`, colour `--w4a-primary`; `.app-bar-exit` 44 px min target, rounded, focus outline; keep `.logo` rules for the drawer and Login.
- `src/app/shell/shell.component.spec.ts` -- the existing `header .logo` assertions for compact and medium change to the icon; add the new cases below. Provide a mock `AuthService` (`logout`, `email`).
- `src/app/features/settings/settings.component.ts` -- reference only for the logout flow; no change.
- `src/app/shared/strings.ts` -- reuse `settingsLogout`, `authErrorUnknown`; no new keys expected.
- `src/app/app.routes.spec.ts` -- check it still passes with the shell's new `AuthService` dependency.
- `e2e/` -- grep for app bar logo selectors; update any that break.
- Mockups: `_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/mockups/` (`tablet-01-today.svg`, `desktop-01-today.svg`) show the current app bar; the UX check compares against them with the one approved change.
- Docs: DESIGN.md (App bar entry, line ~305) and EXPERIENCE.md (Log out row, line ~144: now reachable from every signed-in screen).

## Tasks & Acceptance

**Execution:**
- [x] `src/app/shell/shell.component.ts` -- add `logout()`, `activeTab`, pending/failed state -- one place for the exit action
- [x] `src/app/shell/shell.component.html` and `.scss` -- icon in the leading slot, exit button at top right, failure region -- the visible change
- [x] `src/app/shell/shell.component.spec.ts` -- update the logo assertions and add tests for: active-tab icon matches the bottom nav icon on each Tab; the exit button exists on all four routes and on each window class; click calls `logout` once and navigates to `/login`; failure shows the message and re-enables the button; Italian label is "Esci" -- covers the requested icon and logout tests
- [x] `DESIGN.md`, `EXPERIENCE.md` -- record the app bar change -- docs match the build

**Acceptance Criteria:**
- [x] Given a signed-in user on any Tab at compact, medium or expanded, when the app bar renders, then the top right has an exit button named "Log out" (or "Esci" in Italian) and the top-left icon matches the active Tab's bottom-nav icon (28 px vs 24 px).
- [x] Given the exit button, when tapped and logout succeeds, then the app shows `/login` and the back button does not return to a signed-in screen.
- [x] Given logout fails, when tapped, then the user stays signed in, the button is enabled, and the message is announced.
- [x] Given `npx ng test --watch=false`, then all tests pass, including the new shell cases.

## Implementation Notes

- The spec's `context:` list is empty, so there were no extra files to load.
- `shell.component.ts`: `activeTab` is one computed (Today when no Tab matches); `title` and `tabTitle` read it, so the existing title behaviour is unchanged. `logout()` mirrors `settings.component.ts` (pending guard, failed flag, `replaceUrl` to `/login`).
- The exit button reuses `settingsLogout` as its `aria-label`, and the failure line reuses `authErrorUnknown`. No new strings, so `strings.ts` is unchanged.
- The app bar now always renders the Tab icon first. On compact and medium the exit button gets `margin-inline-start: auto` through the `app-bar-exit-pushed` class; on expanded the date keeps the auto margin and the button sits after it.
- The failure region `<p class="app-bar-error" aria-live="polite">` sits under the header and is always in the DOM, so the live region exists before the first failure.
- The exit glyph is the standard Material "logout" path (24 px viewBox). I wrote it from memory, not from a file in the repo, so a visual check is worth doing.
- The shell spec now provides a mock `AuthService` (`session`, `email`, `logout`) and a top-level `/login` route. `session` is needed because `SessionScope` reads it.
- Tests: `npx ng test --watch=false` gives 46 files and 762 tests passing, 0 failing; after review patches, 764 passing.
- `npx eslint src e2e` exits 0.
- `npm run build` succeeds. It prints a bundle-size budget warning (initial 1.10 MB against a 500 kB budget). I did not measure that against the baseline commit.
- The e2e folder has no logo selectors, so nothing there needed changing.
- Docs: `_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/DESIGN.md` (App bar entry) and `EXPERIENCE.md` (Log out row) are updated. The spec's line references were approximate; the files live under `planning-artifacts/ux-designs/...`, not at the repo root.

## Spec Change Log

## Review Triage Log

Review pass 1 (blind hunter, edge-case hunter, verification-gap). Findings checked against the code; reviewers' severities disregarded.

- [verification-gap] Logout test does not assert `replaceUrl: true`; a regression would keep the history entry and still pass — high, patch: spy on `navigateByUrl` and assert `('/login', { replaceUrl: true })`. Applied.
- [edge] Navigation to `/login` resolves false or rejects after a successful logout, so the exit button stays disabled with no message — medium, patch: `.catch(() => false)`; on false show the failure and unlock the button. Applied, with a test.
- [blind+edge] Failure message stays under the app bar on later screens — medium, patch: clear `failed` on every `NavigationEnd`. Applied, with a test.
- [blind+edge] Network failure shows the generic message, not `authErrorNetwork` — low, rejected: Settings shows the same generic text; mapping codes adds branches for a small wording gain.
- [blind] A single tap can discard an unsaved draft — rejected as a spec decision: Never forbids a logout confirmation. Raised to the owner as a product risk; not changed.
- [blind] Mockups still show the logo dot in the app bar — rejected: the deviation is the approved change, recorded in DESIGN.md; regenerating mockup SVGs is out of scope.
- [blind] Test name "keeps the current app bar" out of date — medium, patch: renamed. Applied.
- [blind] Exit button may not sit at the far right on expanded — false: `.app-bar-date` has `margin-inline-start: auto` (`shell.component.scss`), so the button follows it at the end of the bar.
- [blind] Long Italian titles may overflow at 320 px — low, rejected: the spec targets 360 px, where the icon, title and 44 px button fit; no overflow demonstrated.
- [blind] Missing tests for empty error line, retry, language switch — partly real: failure-clear and navigation-failure tests added; the empty-line and language cases are not separate risks.
- [blind] `README.md` / `docs/cr-set-1.md` may describe the old app bar — low, rejected: wording only; the fix spans several files.
- [blind] Error region always rendered; no focus move on failure — false: an always-present `aria-live="polite"` region is the reliable pattern and matches Settings; the spec sets no focus move.

## Design Notes

The icon is the same path data as the bottom navigation (`TABS[i].icon`), so the two cannot drift. The exit glyph is the Material "logout" path; the Settings button keeps its text so the account action stays discoverable.

## Verification

**Commands:**
- `npx ng test --watch=false` -- expected: pass
- `npx eslint src e2e` -- expected: pass
- `npm run build` -- expected: success

**Manual checks (if no CLI):**
- `UX check`: signed in at 360, 768 and 1280 px, English and Italian, on each Tab: icon top-left matches the nav icon, exit icon top-right, no horizontal scroll, compared with the mockups and the one approved change in DESIGN.md.
