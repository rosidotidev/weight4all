# Epic 2 Context: Daily weight entry

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

This epic lets the user log today's Weight in seconds, get a warm non-judgmental response, see when today is missing, browse their history, and correct, add or delete any day. It introduces the in-memory Entry store, the single Entry form and draft handling, the day/number domain modules, and the History tab. Weight is the only Dimension in this epic; the registry-driven design lets Mood and Sleep arrive later without rework.

## Stories

- Story 2.1: Load the Entries into the app
- Story 2.2: Save today's Weight
- Story 2.3: Never lose typed values when a save fails
- Story 2.4: Adjust the weight quickly
- Story 2.5: See that today is not logged yet
- Story 2.6: Get a warm response after saving
- Story 2.7: Browse my history
- Story 2.8: Edit an entry or add a forgotten day
- Story 2.9: Delete an entry safely
- Story 2.10: See "This week" on wide screens

## Requirements & Constraints

- Weight is required, 20.0 to 400.0 kg, one decimal; out-of-range or over-precise values are rejected, never rounded. Comma or point accepted in either language and stored identically.
- One Entry per Day; saving again replaces it; saving one Day never alters another.
- Nothing is shown as saved until the server confirms. A failed save keeps typed values, shows a persistent (non-auto-dismissing) message within 10 seconds, and allows retry.
- Weight starts from the most recent Entry as a suggestion; plus/minus and Up/Down arrows change it by exactly 0.1 kg.
- Missing-today sign is gentle (amber, not dismissible, no error red); no email or push notifications ever.
- Happy effect after a confirmed save of today's Entry: loss gets confetti (max 3 s) and a celebratory card; gain or no change gets a calm card with no shaming, red or warning visuals; first entry gets a welcome. Respects `prefers-reduced-motion`, follows the accent, never blocks for more than a few seconds.
- History: newest first, em dash for absent values (never 0), dashed "no entry" rows for gaps between first and last Entry, no future Days, smooth with 365+ rows.
- Past-day edits never trigger the Happy effect; editing today's Entry from History does. Deleting needs explicit confirmation.
- "This week" (expanded screens only): count of the last 7 Days with an Entry and per-Dimension averages from real entries only; "No data" instead of 0.
- Accessibility: 44 px targets, validation errors move focus to the first invalid field and are announced via a live region, save/delete outcomes announced. All text in both languages, warm voice.

## Technical Decisions

- `domain/day.ts` is the only place for Day keys, ranges and date formatting (`dayKey`, `parseDayKey`, `addDays`, `enumerateDays`, `resolveRange`, `formatDay`). Keys are device-local `YYYY-MM-DD`; arithmetic is calendar-based; never `new Date('YYYY-MM-DD')`. `ClockService` owns the `today` signal (refreshes at local midnight and on tab visibility).
- `domain/number.ts` is the only place to parse, step and format numbers (integer tenths internally; display units everywhere else). Shared test vectors run against client validators and the rules.
- `domain/dimensions.ts` registry (Weight only for now) plus `PRIMARY`; no code outside the registry, rules and tests names a Dimension literally. Registry-driven code (forms, History rows, This week) must not need changes when Dimensions are added.
- `Entry` = `{ day, values: { [dimensionKey]: number } }`. Firestore doc `users/{uid}/entries/{YYYY-MM-DD}` with flat fields (`weight`, `updatedAt` server timestamp); absent value means absent field. `EntryStore` alone maps to/from documents.
- `EntryStore`: loads all Entries once (no listeners, no offline persistence) into a signal keyed by day, `status` `loading | ready | error`. `save`/`remove` are the only mutations, writing full documents (`setDoc` without merge), returning `ok` or `error(code)` with code in `network | timeout | permission | invalid | unknown`. Signal updates only after confirmation. Each write is raced against a 10 s timeout; after a timeout the next write for that Day first re-reads with `getDocFromServer`. Every read/write carries `sessionEpoch` and is discarded if the session changed. UI maps codes to `strings.ts`; raw Firebase text is never shown.
- `shared/EntryFormComponent` is the only Entry form (Today and Entry edit). Pure `initialDraft(day, entries, lastEntry)` in `domain/entry.ts` builds drafts only when the store is `ready`. `DraftStore` (`core/state`) holds one draft per Day with per-field state `untouched | value | cleared`; dropped after confirmed save, Cancel, delete, logout, or when the stored Entry changes while untouched; untouched draft for the old today is rebuilt at midnight rollover. Typed values survive Tab switches and failed saves. DraftStore is reset by `SessionScope`.
- `domain/history.ts`: `buildHistoryRows` (including missing-Day rows), `recentEntries(5)`, `previousEntry(day, entries)` (single place computing "previous"). `domain/happy-effect.ts` holds the comparison logic. `domain/stats.ts` is created with `average` (real entries only, `null` when none); Epic 4 extends it.
- History uses CDK virtual scroll with fixed row height. Route `/history/:dayKey` opens Entry edit (full screen on compact, dialog on medium/expanded); a guard redirects malformed or future keys to `/history`. Creating future-day Entries is blocked by the client only.
- Layer and lint rules from Epic 1 still apply (no Firebase outside `core/data`, no date/number APIs outside their modules, no literal UI text in templates).

## UX & Interaction Patterns

- Today: Weight card with stepper (plus/minus buttons, hint showing last value and step), Save with in-flight progress, skeleton cards while loading, inline error with Retry on load failure.
- Missing-entry banner on Today: "Today isn't logged yet / Add today's numbers whenever you're ready."
- History rows: tap, swipe left (touch) or overflow menu to edit; dashed "no entry · + Add" rows; empty state "Nothing here yet. Your first log starts on Today."; load failure shows inline Retry and keeps prior data.
- Entry edit titled e.g. "Add entry for Mon 13 Oct" for a missing Day.
- Delete dialog "Delete this entry? / This removes the day's numbers." with Cancel as default focus, focus trapped and restored; on failure shows an error and allows retry.
- Happy effect closes via Done, Dismiss or Esc and returns focus to Today.
- Expanded Today: right column with "This week" card and last 5 Entries.

## Cross-Story Dependencies

- 2.1 is the base for the rest (day, entry, registry, ClockService, EntryStore); 2.2 builds the form and DraftStore on it and joins DraftStore to Epic 1's `SessionScope`.
- 2.3 hardens `EntryStore.save` from 2.1/2.2; 2.4 adds `domain/number.ts` behavior and pre-fill to the form; 2.5 and 2.6 depend on confirmed saves from 2.2.
- 2.6 introduces `previousEntry`, reused later; 2.7 builds `domain/history.ts`; 2.8 reuses the form, drafts and Happy effect; 2.9 depends on 2.7/2.8 entry points; 2.10 depends on `resolveRange` and creates `domain/stats.ts` (extended by Story 4.1).
- Depends on Epic 1: auth session, `SessionScope`/`sessionEpoch`, Firestore rules for entries, strings dictionary, theme and accent, shell and `LayoutService`. History edits will feed the Report in Epic 4, and Epic 3 adds Dimensions to the form and registry.
