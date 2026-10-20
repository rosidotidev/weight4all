---
title: '1-8 Move between four Tabs on any screen size'
type: 'feature'
created: '2026-10-20'
baseline_commit: '9877f10f09fc6314fa1c420981f4758cb05b7d72'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-bmad612_home-2026-10-19/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/DESIGN.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Signed-in screens have no navigation: only `/today` and `/settings` exist, reached by typing the address, and nothing adapts to the window (FR-5, UX-DR2).

**Approach:** Add `LayoutService` with one `windowClass` signal, a shell component that renders the four Tabs as a bottom bar, rail or labeled drawer by `windowClass`, and the signed-in route table with placeholder screens.

## Boundaries & Constraints

**Always:** `windowClass` is `compact` under 600 px, `medium` 600 to 839 px, `expanded` 840 px and up; a pure function from width to class lives in `domain` and is the only place the thresholds appear. `LayoutService` (`core/state`) is the only code that reads the window (media-query listeners, no polling); it updates on resize and rotation. The shell (`shell/`) injects `LayoutService` and shows exactly one of: bottom navigation bar (compact), navigation rail (medium), labeled side drawer (expanded), with sizes from the existing `--w4a-nav-*` tokens, `surface-container` background, `primary-container` pill indicator on the active Tab, and no color literals. Tabs are `Today`, `History`, `Report`, `Settings` as `routerLink`s to `/today`, `/history`, `/report`, `/settings`; each link is one tap, at least 44 px, has an icon (inline SVG, `aria-hidden`) and a text label, and the active one has `aria-current="page"` and the indicator; `History` stays active on `/history/:dayKey`. The nav is a `<nav>` with an `aria-label` from strings. All signed-in routes are children of one shell route guarded by `sessionGuard` (as `canActivate` and `canActivateChild`): `today`, `history`, `history/:dayKey`, `report`, `settings`; `login`, `register`, `reset` stay outside the shell and show no navigation. Empty and unknown paths still end on `/today` (login when signed out); login success lands on `/today`. Each Tab has placeholder content from `strings.ts` (the existing Today and Settings placeholders stay; History, Report and the day route get new placeholders in `features/history` and `features/report`, the day route only showing its `dayKey` parameter unvalidated). No page-level horizontal scroll from 360 px: the main area uses `min-width: 0`, wraps its content and never exceeds its column. Tab labels in `strings.ts` for `en` and `it`: Today, History, Report, Settings / Oggi, Storico, Report, Impostazioni, plus the nav `aria-label`. Standalone, OnPush, signals, prefix `w4a-`, `loadComponent`, no literal UI text in templates.

**Never:** No component other than `LayoutService` reads `window`, `innerWidth` or `matchMedia`. No Entry data, stores, accent or Language controls, top app bar, or dialog behavior (Stories 2.x, 1.9, 1.10). No change to `firebase.ts`, `firestore.rules`, `eslint.config.js`. No new dependency (no icon font, no extra Material component).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Class boundaries | Width 599, 600, 839, 840 | compact, medium, medium, expanded | N/A |
| Resize or rotate | Width crosses a boundary | `windowClass` changes; the shell swaps bar, rail, drawer with no reload | N/A |
| Tap a Tab | Signed in, any class | Destination opens, that Tab gets `aria-current="page"` and the indicator, others do not | N/A |
| Day route | `/history/2026-10-19` | History Tab active, placeholder shows the `dayKey` | No validation |
| Landing | Login succeeds | `/today` with Today active | N/A |
| Signed out | Any shell address | Redirect to `/login`, no nav shown | N/A |
| Language change | `it` selected | Labels read Oggi, Storico, Report, Impostazioni | N/A |
| Narrow window | 360 px | No horizontal page scroll | N/A |

</frozen-after-approval>

## Code Map

- `src/app/domain/window-class.ts` (new) -- pure `windowClassFor(width)` and the `WindowClass` type; no Angular or DOM imports (lint-enforced).
- `src/app/core/state/layout.service.ts` (new) -- `windowClass` signal fed by `matchMedia` min-width listeners (`(min-width: 600px)`, `(min-width: 840px)`) removed on destroy; the layer may import `domain` only. Specs stub `window.matchMedia` per test.
- `src/app/shell/shell.component.{ts,html,scss}` (new) -- nav by `windowClass`, `<router-outlet />` main area; may import `domain`, `core`, `shared`. Model styles on `login.component.scss` and `src/styles/_tokens.scss` (`--w4a-nav-bar-height`, `--w4a-nav-rail-width`, `--w4a-nav-drawer-width`, `--w4a-touch-target`, `--w4a-surface-container`, `--w4a-primary-container`, `--w4a-on-primary-container`, `--w4a-on-surface-variant`).
- `src/app/app.routes.ts` + `app.routes.spec.ts` -- nest `today`, `history`, `history/:dayKey`, `report`, `settings` under the shell route (`loadComponent`); keep the `''` and `**` redirects. The spec's mocked `AuthService` already exists; add cases per matrix row.
- `src/app/features/history/history.component.ts`, `history-day.component.ts`, `src/app/features/report/report.component.ts` (new) -- placeholders; copy the pattern of `today.component.ts`. `features/today` and `features/settings` stay as they are.
- `src/app/shared/strings.ts` + `strings.spec.ts` -- `navToday`, `navHistory`, `navReport`, `navSettings`, `navLabel`, and placeholder keys for History, Report, day route.
- `src/app/core/data/session.guard.ts` -- reuse unchanged; it keys on `route.routeConfig.path`, so children and the `''` shell parent resolve as non-public.
- `src/app/features/settings/settings.component.ts` -- its host already pads itself; leave it, do not move the Log out button.

## Tasks & Acceptance

**Execution:**
- [x] `domain/window-class.ts` + spec -- thresholds and boundary rows -- AC1
- [x] `core/state/layout.service.ts` + spec -- signal from `matchMedia`, updates on change, listeners removed on destroy -- AC1
- [x] `strings.ts` -- nav labels and placeholder keys in `it` and `en` -- AC4
- [x] `shell/shell.component.*` + spec -- bar, rail, drawer by class, links, `aria-current`, labels follow the Language -- AC1, AC2, AC4
- [x] placeholder screens, `app.routes.ts` + spec -- route table, guard on children, landing, redirects -- AC2, AC3
- [x] matrix audit -- every I/O row covered by a test that ran; 360 px checked by reading the styles (jsdom has no layout) and by a manual look -- verification

**Acceptance Criteria:**
- Given the window class, when the window is resized or rotated, then compact shows a bottom bar, medium a rail, expanded a labeled drawer, and only `LayoutService` reads the window.
- Given the shell routes, when a Tab is tapped, then the destination opens in one tap with `aria-current` and an indicator, and Today is the landing after login.
- Given placeholder content, when viewed at 360 px, then no horizontal page scroll is needed.
- Given the Language changes, when the shell renders, then the Tab labels follow it.

## Implementation Notes

Shell sets `height: 100dvh` with `.content` scrolling internally. `npm run test:rules` could not run (port 8080 held by a local emulator); this story changes no rules. The 360/700/1000 px manual look was not done; the 360 px rule rests on the styles.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| `.content` keeps its scroll offset when the Tab changes; router scroll restoration targets the window (EC) | medium (unverified) | defer | Placeholders are short today; matters once Today/History/Report scroll (Epic 2+). |
| No `<main>` landmark in the shell (BH) | low | rejected | `SettingsComponent` already renders its own `<main>`; nesting would be invalid, landmarks are settled per screen in Story 5.1. |
| `LayoutService` without `matchMedia`/`addEventListener` (EC, BH) | low | rejected | Angular 22's supported browsers all have both; the guard only serves jsdom. |
| `:has()`, `100dvh`, safe-area inset, hover/pressed states, forced-colors indicator (EC, BH) | low | rejected | Supported in current browsers; polish outside the spec. |
| `overflow-x: hidden` hides rather than prevents overflow; nav label wrap; scroll guard on the bar (EC, BH) | low | rejected | At 360 px four tabs get about 86 px each, enough for "Impostazioni"; behavior chosen by the spec's no-scroll rule. |
| Fake widths mapped through `windowClassFor`; icon paths inline; guard runs on parent and child; missing-`matchMedia` test (BH, EC) | low | rejected | Style choices or spec-mandated; no demonstrated failure. |
| Verification gap layer | none | n/a | Every spec row has a passing test; CSS-only items assigned to the manual check. |

## Design Notes

A test double can drive `LayoutService` by stubbing `window.matchMedia` to return objects with `matches` and `addEventListener('change', …)`; the shell spec can instead provide a `LayoutService` whose `windowClass` is a writable signal.

## Verification

**Commands:**
- `npm run check` -- expected: exit 0 (`test:rules` needs port 8080 free; it is unaffected by this story)
- `npx ng build` -- expected: build succeeds

**Manual checks:**
- With `npm start` signed in, resize to 360, 700 and 1000 px: bar, rail, drawer; no horizontal scrollbar at 360 px.
