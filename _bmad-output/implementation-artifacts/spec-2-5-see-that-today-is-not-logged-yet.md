---
title: '2-5 See that today is not logged yet'
type: 'feature'
created: '2026-10-20'
baseline_commit: 'c14ba5f17a4b010ab5715d28385ae6ee7ca64cf0'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/DESIGN.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Today gives no sign that the day has no Entry, so Bob has no gentle reminder to log (FR-10, UX-DR4).

**Approach:** Today shows the amber Missing-entry banner above the Weight card whenever `EntryStore.status()` is `ready` and `EntryStore.entries()` has no Entry for `ClockService.today()`; it is derived from the store, so it vanishes on a confirmed save and returns after a delete.

## Boundaries & Constraints

**Always:** The banner is a pure view of store state: no own state, no dismiss control, no action, no timer. Title "Today isn't logged yet" ("Oggi non è ancora registrato"), body "Add today's numbers whenever you're ready." ("Aggiungi i numeri di oggi quando vuoi."), both from `strings.ts`. Look like the mockup: `banner-container` background, `on-banner-container` text, radius `--w4a-rounded-md`, an amber dot with a translucent halo ring at the left, bold 15 px title and 12.5 px body, no icon, and only the existing `--w4a-banner-*` tokens. Same centered `--w4a-form-column-width` column as the form, with `--w4a-card-gap` below it. It is a polite status region (`role="status"`), not an alert. Today's own `@switch` shows it only in the `ready` case, so there is no flash while `loading` or on `error`.

**Never:** No banner for past Days or in Entry edit (Story 2.8); no Happy effect (2.6), "This week" or last entries (2.10); no email, push or any notification code, and no color literal outside `src/styles/`, no literal UI text in templates, no change to `EntryStore`, `DraftStore` or the form.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Missing today | `ready`, no Entry for today | Banner above the form, both lines | N/A |
| Loading | `loading` | Skeleton only, no banner | N/A |
| Load failure | `error` | Inline error with Retry, no banner | Existing |
| Today logged | `ready`, Entry for today | No banner | N/A |
| Save confirmed | Entry for today appears in `entries` | Banner disappears | N/A |
| Entry deleted | Today's Entry removed from `entries` | Banner reappears | N/A |
| Other days only | `ready`, Entries only on other Days | Banner shown | N/A |
| Midnight rollover | `today()` moves to a Day with no Entry | Banner shown for the new today | N/A |
| Italian | Language `it` | Italian title and body | N/A |

</frozen-after-approval>

## Code Map

- `src/app/features/today/today.component.ts` + spec -- realizes `mock-01-today.svg`, `tablet-01-today.svg`, `desktop-01-today.svg` banner (DESIGN.md `missing-entry-banner`): make the `ready` branch `@case ('ready')` that renders the banner (`@if (!store.entries()[clock.today()])`) above `<w4a-entry-form>`; add banner styles next to the existing ones, centered column like `.skeleton`/`.load-error`. Reuse `store`, `clock`, `t`; keep skeleton and error branches as they are.
- `src/app/shared/strings.ts` + `strings.spec.ts` -- `todayMissingTitle`, `todayMissingBody` (en/it) near `todayLoading` (line ~146); the spec already requires both languages.
- `src/styles/_tokens.scss` -- `--w4a-banner-container`, `--w4a-on-banner-container`, `--w4a-banner-dot` exist (lines 25-28); read only.
- `src/app/core/data/entry.store.ts` -- read only (`entries`, `status`).

## Tasks & Acceptance

**Execution:**
- [x] `shared/strings.ts` + spec -- the two banner strings, en/it -- AC1
- [x] `features/today/today.component.ts` + spec -- banner in the `ready` case, styled per the mockup; tests for every matrix row (loading, error, missing, logged, appears and disappears as `entries` changes, other-days-only, Italian, no button or dismiss control, `role="status"`) -- AC1-AC3
- [x] matrix audit -- every row covered by a test that ran; grep confirms no notification or messaging code; then `UX check` -- AC4, verification

**Acceptance Criteria:**
- Given `ready` and no Entry today, when Today opens, then the amber banner with both lines shows, with no close control, no error red and no exclamation icon.
- Given the store is `loading`, when Today renders, then the banner is not shown.
- Given today's Entry is saved and confirmed, then the banner disappears; given it is deleted later, then it reappears.
- Given the app, when used, then no email or push notification is ever sent (no such code exists).

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| `@default` became `@case ('ready')`, a new status renders blank (BH, EC) | false | rejected | `EntryStatus` is `'loading' \| 'ready' \| 'error'`; all three are handled. |
| `role="status"` inserted with content may not be announced (BH) | low | rejected | The spec fixes a polite status region; the banner is passive and its text is also read in page order. |
| Banner tokens may be missing, no dark-mode or contrast check (BH) | false | rejected | `--w4a-banner-*`, `--w4a-rounded-md`, `--w4a-card-gap` exist in `_tokens.scss`; colors are the DESIGN.md values. |
| Fixed px font sizes and dot size (BH) | low | rejected | Values come from the mockup; every other card in the file uses px tokens the same way. |
| Entry with empty `values` counts as logged (BH) | false | rejected | Weight is required, so no Entry has empty values. |
| Untested: save in flight, failed save, narrow screen (BH) | low | rejected | The banner reads only `entries`, which neither changes; layout is the `UX check`. |
| Runtime Language switch not tested (BH) | false | rejected | Text comes from the `t()` signal, which the Italian test exercises. |
| Reflow noise in `strings.spec.ts` (BH) | low | rejected | One line grew past the print width; the formatter is the project's. |
| Missing blank line before `describe` (BH) | low | patch | Added the blank line. |
| Long doc comment (BH) | low | rejected | Cosmetic; one sentence states the component's states. |
| Tests use `dayKey(new Date())` vs `ClockService` (EC) | low | rejected | Flaky only across midnight; the existing Today tests use the same pattern. |
| Retry recreates the form and may lose typed values (EC) | false | rejected | Drafts live in `DraftStore`, not in the form (Story 2.3). |
| Midnight test stubs `ClockService` with `today` only (EC) | false | rejected | The test ran and passed, and it asserts a change after `day.set`, so it is not vacuous. |
| "No error red, no exclamation" test only checks elements (EC) | low | rejected | Colors are the banner tokens in the CSS and the strings hold no `!`; a color assert is not worth a jsdom hack. |
| Verification gap layer | none | n/a | Every matrix row has a passing test. |

## Verification

**Commands:**
- `npm run lint` -- expected: exit 0
- `npm test` -- expected: exit 0
- `npx ng build` -- expected: build succeeds

**Manual checks:**
- `UX check`: run the app and compare Today with `mock-01-today.svg` (390 px), `tablet-01-today.svg` and `desktop-01-today.svg` (1440 px): banner position above the Weight card, amber colors, dot with halo, bold title and body, rounded 16 px, centered column; check the Italian copy against the EXPERIENCE.md copy table. Mood, Sleep, "This week" stay absent by design.
