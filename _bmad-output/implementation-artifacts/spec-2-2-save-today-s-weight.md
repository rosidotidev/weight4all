---
title: '2-2 Save today''s Weight'
type: 'feature'
created: '2026-10-20'
baseline_commit: '8690e79f12450e375d587a84e6710a1112ca1db7'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-bmad612_home-2026-10-19/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/DESIGN.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-2-1-load-the-entries-into-the-app.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Today shows only a placeholder once the Entries are loaded: there is no form, no draft, no validation and no way to save today's Weight (FR-7, NFR-3, NFR-5, AD-12).

**Approach:** Add the one `EntryFormComponent` with a Weight card, a `DraftStore` that keeps typed text per Day, the pure `initialDraft` and a registry-driven value validation, and show the form on Today once `EntryStore` is `ready`; Save validates, then calls `EntryStore.save` for today's Day.

## Boundaries & Constraints

**Always:** `domain/entry.ts` gets `initialDraft(day, entries, lastEntry)` returning the Entry values a form starts from: the stored Entry's values if one exists, else for each Dimension its registry `defaultValue` when not `null`, and the Weight of `lastEntry` as a suggestion when given; Today passes `null` for `lastEntry` until Story 2.4. `domain/number.ts` gets `parseDecimal(text, decimals)`: trims, accepts digits with an optional single decimal comma or point and at most `decimals` decimals, else `null`; no `toFixed`. `domain/validation.ts` (new) has `validateValue(dimension, text)` returning `{ ok: true, value }` or `{ ok: false, error }` with `error` `missing` (blank text) or `range` (not parseable, more decimals than the Dimension allows, or outside `min`..`max`); values are never rounded. The registry gains `missingKey` and `rangeKey` (keys in `strings.ts`) per Dimension; no code outside the registry, rules and tests names Weight. `DraftStore` (`core/state/draft.store.ts`) holds typed edits per Day and Dimension as `{ state: 'value' | 'cleared', text }`; a field without an edit is `untouched` and shows the initial value formatted with `formatNumber` for the Language; `get(day)`, `set(day, key, text)` (blank text is `cleared`), `drop(day)` and `reset()` (`SessionScope`, which lives in `core/data`, injects `DraftStore` and calls `reset()` on every session change, as AD-9 says; `core/state` never imports `core/data`); drafts live outside components, so typed text survives Tab switches. `shared/entry-form.component.ts` (`w4a-entry-form`, input `day`) renders one card per registry Dimension (only the `stepper` input kind exists; no plus/minus buttons yet, Story 2.4): label, a native text input (`inputmode="decimal"`, `autocomplete="off"`, label bound by `for`) with the unit, an always-rendered `aria-live="polite"` message region tied to the input by `aria-describedby`, `aria-invalid` when it shows an error, and a full-width Save button (44 px minimum, tokens only). Pressing Save or Enter validates every Dimension in registry order: on the first failure it shows that message (`strings.ts`, warm, per UX copy: "Add your weight to save." / "Enter a weight between 20.0 and 400.0 kg.", Italian with decimal comma, numbers through `formatNumber`), moves focus to that input and does not call the store; otherwise it calls `EntryStore.save({ day, values })` once, shows progress (button disabled, `aria-busy`, a "Saving…" label) while in flight, and after `ok` drops that Day's draft and shows "Saved!" in the live region until the next edit. A failed save keeps the draft and re-enables Save; its message and snackbar are Story 2.3. A second save for the same Day replaces the document; a save for one Day never touches another Day's Entry. Today renders the form for `ClockService.today()` when `status` is `ready`, replacing the placeholder text; `App` instantiates `DraftStore` at startup. All text in `strings.ts` (`en` and `it`; the only exclamation mark is "Saved!").

**Never:** No plus/minus buttons, Up/Down keys or last-Weight pre-fill (Story 2.4), no failure message or snackbar (2.3), no `getDocFromServer` re-read (2.3), no Missing-entry sign (2.5), no Happy effect (2.6), no History or edit route (2.7, 2.8). No change to `EntryStore`, `firestore.rules` or the theme. No `new Date`, `toFixed`, `toLocaleString` or `Intl.NumberFormat` outside their modules. No color literal outside `src/styles/`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Form opens | Store `ready`, no Entry for today | Empty Weight field, Save enabled | N/A |
| Existing Entry | Entry for today with 72.7 | Field shows `72.7` (`72,7` in Italian); saving again replaces the same document | N/A |
| Empty Weight | Blank or spaces, Save pressed | Message "Add your weight to save.", focus on the field, store not called | `missing` |
| Out of range | `19.9`, `400.1`, `0`, `-5`, `abc` | Range message, focus on the field, not called | `range` |
| Too precise | `72.55`, `72,55` | Range message, never rounded | `range` |
| Valid text | `72.7`, `72,7`, ` 72.7 `, `20`, `400` | One `save` with value 72.7 (resp. 20, 400), same value for comma and point | N/A |
| In flight | Save pressed, write pending | Button disabled with progress label; Entry absent from the store until confirmed | N/A |
| Confirmed | `save` resolves `ok` | Draft dropped, field shows the stored value, "Saved!" announced | N/A |
| Failed save | `save` resolves `error(code)` | Typed text stays, Save enabled again, "Saved!" not shown | Message in 2.3 |
| Tab switch | Type `72`, go to History and back | `72` still in the field | N/A |
| Two Days | Save for Day A, later for Day B | Day A's Entry unchanged | N/A |
| Session change | Logout or other user with a draft | `DraftStore` empty | `reset()` |

</frozen-after-approval>

## Code Map

- `src/app/domain/{entry,number}.ts` + specs -- extend: `entry.ts` already has `Entry`/`DayKey`; `number.ts` has `formatNumber` only. `domain/validation.ts` + spec (new). `domain/dimensions.ts` + spec -- add `missingKey`, `rangeKey` (typed as `StringKey`-compatible literals; `labelKey` is the pattern).
- `src/app/core/state/draft.store.ts` + spec (new) -- `layout.service.ts` is the state pattern; no `core/data` import. `src/app/core/data/session-scope.ts` + spec -- inject `DraftStore` and call `reset()` in `onSession` beside the registered stores; the existing tests must keep passing (provide a stub or the real store).
- `src/app/shared/entry-form.component.ts` + spec (new) -- `features/settings/settings.component.ts` is the inline-template/styles/token pattern; `features/today/today.component.ts` shows the `I18n` `t` signal use; form reads `EntryStore`, `DraftStore`, `ClockService`-free (day is an input).
- `src/app/features/today/today.component.ts` + spec -- ready state renders `<w4a-entry-form [day]="clock.today()" />`; keep skeleton and error states; drop the `todayPlaceholder` string if nothing else uses it.
- `src/app/app.ts` + `app.spec.ts` -- inject `DraftStore`.
- `src/app/shared/strings.ts` + `strings.spec.ts` -- `weightMissing`, `weightRange({min,max})`, `entrySave`, `entrySaving`; reuse `saved` and `dimensionWeight`.
- `src/app/core/data/entry.store.ts` -- read only: `save(entry)` and `entries()`; do not change.

## Tasks & Acceptance

**Execution:**
- [x] `domain/number.ts`, `validation.ts`, `entry.ts`, `dimensions.ts` + specs -- `parseDecimal`, `validateValue`, `initialDraft`, registry keys, with shared valid and invalid vectors -- AC3, AC4
- [x] `core/state/draft.store.ts` + spec -- per-Day edits, `reset` via `SessionScope` -- AC1, AC2
- [x] `shared/entry-form.component.ts` + spec -- card, validation, focus, live region, save flow -- AC1, AC3 to AC7
- [x] `strings.ts` + spec, `today.component.ts` + spec, `app.ts` + spec -- copy, form on Today, startup -- AC1
- [x] matrix audit -- every I/O row covered by a test that ran -- verification

**Acceptance Criteria:**
- Given `EntryFormComponent`, `DraftStore` and `initialDraft`, when Today opens and `EntryStore` is `ready`, then the Weight card is built from the draft, one draft per Day, and typed values survive a Tab switch.
- Given the session changes, when `SessionScope` resets the stores, then `DraftStore` is reset too.
- Given an empty Weight, when Save is pressed, then saving is blocked with "Add your weight to save." inline, focus moves to the field and it is announced.
- Given a Weight outside 20.0 to 400.0 or with more than one decimal, when Save is pressed, then it is rejected with the range message and not rounded.
- Given a valid Weight, when Save is pressed, then `EntryStore.save` writes the full document for today, the button shows progress while in flight, and the Entry appears in memory only after Firestore confirms.
- Given an Entry for today exists, when Weight is saved again, then the same document is replaced and no second Entry exists for that Day.
- Given a save for Day A and later for Day B, when both are confirmed, then Day A's Entry is unchanged.

## Implementation Notes

`lastEntry` is passed as `null` until Story 2.4; a failed save shows no message until Story 2.3; "Saved!" shows in the first Dimension's message region. Not tried in a browser or against the emulator.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| Text typed while a save is in flight is discarded by `drop` after `ok` (EC) | medium | patch | The input stays enabled during the write; `drop` now runs only when the draft is the one that was sent. Test added. |
| Clearing a stored Weight is not tested at the form (VG, EC) | medium | patch | Test added: stored 72.7, cleared, Save blocked with the missing message. |
| Nothing pins Today's `day` binding (VG) | low | patch | Test added: the form shows today's stored value, not another Day's. |
| A failed save shows no message (BH, VG, EC) | n/a | rejected | Story 2.3 owns the message and snackbar; the spec's Never list says so. |
| `lastEntry` is always `null`, so the suggestion branch is unused (BH, VG) | n/a | rejected | Deliberate in the spec; Story 2.4 wires it. |
| Session change during a save still shows "Saved!"; stale saved or error after midnight rollover; save after destroy (BH, EC) | low | rejected | The Today form is destroyed with the session; fixes add guards with no demonstrated path. |
| Post-save flicker if `save` resolves before `entries` updates (BH) | false | rejected | `EntryStore.save` sets `entries` before it returns `ok` (Story 2.1). |
| Registry typing, hard-coded px, disabled Save losing focus, error only by border, repeat error not re-announced, first-failure-only, "Saved!" on first field (BH, EC) | low | rejected | Spec mandates the disabled Save and one Dimension; no demonstrated failure. |
| Form in `shared/` depends on stores; drafts never pruned; prototype-named day keys; `decimals` 0 with `6.0`; thousands separators (BH, EC) | low | rejected | Allowed by AD-13a; unreachable with day-key and Weight inputs today. |
| `inject(DraftStore)` in `App` is redundant (VG) | low | rejected | Mirrors the other stores; cosmetic. |
| Verification gap layer | none | n/a | Every matrix row has a passing test. |

## Verification

**Commands:**
- `npm run lint` -- expected: exit 0
- `npm test` -- expected: exit 0 (unit and lint tests)
- `npx ng build` -- expected: build succeeds (the initial-bundle size warning predates this story)
