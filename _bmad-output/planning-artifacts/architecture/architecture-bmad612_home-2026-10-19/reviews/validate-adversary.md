# Adversarial validation of ARCHITECTURE-SPINE.md (Weight4All)

Method: own read of the spine, PRD and UX EXPERIENCE.md; no earlier review consulted. Each finding is a pair of units (stories or features) built independently, each following every AD literally, that still collide. "Fix" is proposed AD wording to paste in.

Verdict: **CONDITIONAL PASS, not safe to hand to parallel builders yet.** The spine is strong on structure (boundary, registry, gaps, session tri-state). It leaves three seams open: (1) the in-memory Entry and value units between form, domain and store; (2) the lifecycle of drafts, preferences and in-flight writes across session changes; (3) three places where an AD contradicts itself, the diagram, or the PRD. Fix the H items before story breakdown; M items before the first epic ships.

Severity: H = silent data corruption or guaranteed rework; M = visible divergence or likely defect; L = nit.

---

## Contradictions (ADs vs ADs, PRD, UX)

### C1 (H). AD-12 forbids "a past-Day '+ Add' fabricating values" and then fabricates one
AD-12 Prevents says a past-Day "+ Add" must not fabricate values. Its Rule says an Entry-less Day takes each Dimension's registry `defaultValue`, and AD-3 sets Sleep `defaultValue` 6.0. So "+ Add Mon 13 Oct" opens with Sleep 6.0 and saves 6.0 if untouched. The Weight "last Entry's Weight as a suggestion" can also be prefilled from an Entry that is not the previous one for that Day. UX endorses the 6.0 default on Today. PRD UJ-1 edge case and FR-17 ("weight-only Entry shows Sleep as absent") say the opposite. Statistics then average invented 6.0 values (SM-C2 is violated).
- Pair: Story A (Today form) follows UX: untouched slider stores 6.0. Story B (Entry edit, History "+ Add") follows AD-12's Prevents: no invented values. Both are "literal" readings; the form is shared but the rule is not.
- Fix (replace AD-12 Rule sentence and AD-3 `defaultValue` text): "`defaultValue` applies only when the draft is for `todayKey()` and no Entry exists for it. For any other Day without an Entry, optional Dimensions start empty and Weight starts empty with the nearest earlier Entry's Weight shown as a placeholder hint, never as a value. Record in the PRD (FR-16, UJ-1) that an untouched Sleep on Today stores 6.0, so the PRD, UX and AD agree." If the owner prefers 'never invent', delete `defaultValue` and say so in UX.

### C2 (H). The layer diagram forbids edges the ADs require
Diagram: `Shared --> Domain` only; `Data --> Domain` only. But:
- AD-9: `SessionScope` (core/data) must reset `DraftStore` (AD-12, listed under `shared/` in the tree): Data -> Shared.
- AD-7/AD-10: one Language signal maps to a locale; `PreferencesStore` (core/data) persists it, `strings.ts` (shared) reads it: either Shared -> Data or Data -> Shared.
- AD-1: "shared reads data through the stores" (Shared -> Data), absent from the diagram.
- Pair: Story A puts the Language signal in `strings.ts` and has `PreferencesStore` import it; Story B puts it in `PreferencesStore` and has `strings.ts` inject it. Both break one diagram edge or the other. Same for `DraftStore`.
- Fix (add to Design Paradigm): "Allowed imports: features -> shared, domain, core/data; shell -> features, core/data, shared; shared -> domain and core/data (read-only signals, never writes); core/data -> domain only. `DraftStore` lives in `core/data/` and is reset by `SessionScope`. The Language signal is owned by `PreferencesStore` (`language()`), `strings.ts` reads it. Add (f) to AD-13: eslint boundaries enforce this table, including 'no feature imports another feature'."

### C3 (M). Weight "rounded to one decimal" (AD-14) vs "other values are rejected" (PRD FR-7, UX validation)
AD-14: parse then round. PRD FR-7: more than one decimal is rejected with a message. Pair: input story rounds 72.45 to 72.5 silently; validation story rejects 72.45 with the UX string. Rounding mode (half-up, half-even, binary toFixed) is also unspecified, so 72.45 -> 72.4 or 72.5 depends on implementation.
- Fix (AD-14): "Weight input with more than one decimal digit is rejected (`validation` error `weight-decimals`), never rounded. Rounding is allowed only for computed values (averages, change) and uses round-half-away-from-zero on integer tenths. The plus/minus buttons clamp at 20.0 and 400.0; plus/minus on an empty field with no previous Entry starts at the smallest valid value of 20.0."

---

## Shared-data shape and ownership

### S1 (H). Units at the form/domain/store boundary: tenths and half-hours
AD-14: Weight is "handled as integer tenths", Sleep "held in half-hours". AD-2: Firestore stores kg and hours. Nothing says what the in-memory `Entry`, the draft, or `save(dayKey, values)` carry.
- Pair: Story A (Sleep slider) emits half-hours (15 = 7.5 h) into `save`; Story B (`EntryStore.toDoc`) assumes hours. Rules accept 15 (0 to 24) so 7.5 h becomes 15 h in Firestore: silent corruption that passes rules, tests with hours, and lint. Weight variant: form emits 724, toDoc writes 724; rules reject it, so it fails loudly but only at runtime.
- Fix (AD-2 + AD-14): "The domain `Entry` type is `{ dayKey: string; values: { [K in DimensionKey]?: number } }` where values are always in display units (kg with one decimal, mood integer, sleep hours). Tenths and half-hours exist only inside the arithmetic functions of `domain/number.ts` and `domain/stats.ts`, converted at their edge and never stored, passed to a store, or held in a draft. `toDoc`/`fromDoc` are identity on numbers. The shared test vectors include a round trip form value -> save -> Firestore value."

### S2 (H). The Entry type has no owner, and key vs `field` are both in the registry
AD-3 gives each Dimension a `key` and a Firestore `field`. AD-13(c) bans literals, so every consumer reads values by registry key or field. No type says which.
- Pair: History rows read `entry[dim.key]`; Report series read `entry[dim.field]`. Identical today (`weight`), diverges as soon as a Dimension's key and field differ (the registry explicitly allows it). `EntryStore` signal "keyed by day" is also an unspecified Map vs Record vs array, so iteration order (History newest first) is each feature's problem.
- Fix (AD-3): "`key` and `field` are the same string; there is no separate field name. `domain/entry.ts` exports `Entry`, `EntryValues`, `DimensionKey`; the `EntryStore` exposes `entriesByDay(): ReadonlyMap<DayKey, Entry>` plus `entriesSorted(): readonly Entry[]` (ascending). Features never index a Firestore document."

### S3 (M). Registry cannot drive the form, so the form will hard-code widgets
The registry lists key, field, unit, range, step, required, defaultValue, color, marker, label. The three cards are different widgets (stepper with typed input, ten faces, slider with clear "x"); UX also needs `clearable`, display precision and stat precision. AD-12/AD-13(c) forbid naming a Dimension, so `EntryFormComponent` either breaks lint with `if (dim.key === 'mood')` or each author invents a field.
- Pair: Story A adds `widget: 'faces'`; Story B (Statistics) adds `decimals: 1`; the card story switches on `unit`. Merge conflicts in the registry type and divergent formatting.
- Fix (AD-3): "Each item also defines `input: 'stepper' | 'faces' | 'slider'`, `clearable: boolean`, `displayDecimals` and `statDecimals`. The form renders `input` through a widget map keyed by those three kinds; adding a Dimension with an existing kind needs no component change."

### S4 (M). "Previous Entry" is computed in two owners
FR-9: most recent earlier Entry. AD-12: "last Entry's Weight" for the suggestion. `happy-effect.ts` and `initialDraft` each find it; "last" in AD-12 is not "earlier than this Day" (matters for a past-Day Add).
- Fix (AD-4 or AD-12): "`domain/history.ts` exports `previousEntry(dayKey, entries)` (nearest Entry strictly earlier than `dayKey`). `initialDraft` and `happy-effect.ts` both call it; no other code searches Entries by date."

### S5 (M). Average, change and "days logged" are displayed by different paths
`stats.ts` computes; display precision and formatter are unspecified (see S3). Today's "This week" and Report's 7 d Range are the same data shown in two features.
- Pair: This week card shows "Avg weight 72.4" (1 decimal); Report card shows 72.43 (2). Change: `72.7 - 72.4` as floats gives `0.2999999`; Happy effect uses tenths, Report uses floats.
- Fix (AD-6 + AD-14): "`stats.ts` returns raw tenths-based values and `daysLogged`; every display goes through `formatDimensionValue(dimension, value, kind: 'value' | 'stat' | 'delta', locale)` in `domain/number.ts`. Change and Happy-effect delta are computed by one `delta(a, b)` on tenths."

---

## Conflicting mutation paths and draft drift

### D1 (H). Draft vs `initialDraft`: precedence, readiness and lifetime are unspecified
AD-12: DraftStore "holds the draft per Day, survives Tab switches, cleared after a confirmed save, reset on logout". Missing: when is `initialDraft` called, and what discards a draft.
- Pair 1 (readiness): Today builds its draft on first render while `EntryStore.status` is `loading` (UX: "Today shows its form as soon as the last Weight is known"). `entries` is empty, so an existing today Entry is replaced by defaults (weight empty, Sleep 6.0); the user taps Save and the full-document write destroys the saved Mood. AD-5 says full-document writes, so this is destructive.
- Pair 2 (lifetime): History edit of Mon, Cancel; a draft survives (Story A: Cancel keeps). Story B deletes Mon from the overflow menu; reopening Mon shows the old edited draft of a deleted Entry.
- Pair 3 (staleness): a draft holds a Weight suggestion; another save changes the last Weight; the draft keeps the old suggestion.
- Pair 4 (midnight): form open at 23:59 bound to the old today key; `today` flips; Save writes yesterday (no Happy effect) while the user thinks it is today.
- Fix (AD-12): "A draft is created lazily, only when `EntryStore.status` is `ready`, and carries `source: 'entry' | 'defaults'`. The DraftStore keeps a draft only if the user changed something (`dirty`). A draft is dropped on: confirmed save, confirmed delete of that Day, Cancel or dialog dismissal in Entry edit, logout, and any change to that Day's stored Entry other than by this draft. A suggestion (Weight) is never stored in a draft; it is recomputed at render. The form is bound to its `dayKey` at open, shows that key in its title, and `save` receives that key; Today re-binds (new draft) when `today` changes and keeps a dirty draft of the old day under its own key."
- Draft shape (add): "A draft field is `{ state: 'value', value } | { state: 'cleared' } | { state: 'untouched' }`; raw text of the Weight input is held as the string typed. `cleared` serialises to an omitted field."

### D2 (M). PreferencesStore mutation path (merge vs replace, rollback, load race)
AD-2 mandates full-document writes for Entries only. AD-10 says accent and Language are "applied immediately, saved in the background, an error shown if saving fails" and the rules check each field independently.
- Pair: Story A (Accent) writes `{accent}` with `setDoc` without merge, erasing Language; Story B (Language) writes `{language}` with merge. Rules pass both (fields are checked only when present). Also: on a save failure Story A reverts, Story B keeps the new value (the AD does not say); and a user who switches accent while `PreferencesStore` is still loading gets overwritten when the load result lands.
- Fix (AD-10): "`PreferencesStore.set(patch)` always writes the full merged document from the in-memory value (`setDoc` without merge, both fields present; rules require both). It has `status` like `EntryStore` and the AD-5 error set. Local changes are kept on failure (shown as unsaved with Retry) and a load result never overwrites a field the user changed after sign-in. The first sign-in with no document writes defaults only on the first `set`, never on load."

### D3 (M). Today's Happy effect host vs Entry edit of today
AD-12 says the effect runs when saving today's Entry from any form; UX says it appears "After Save on Today" and "returns to Today", and not for past Days. Editing today's Entry from History (`/history/<today>`) leaves it undefined whether the effect shows, where, and where Done returns.
- Fix (AD-12): "The Happy effect belongs to the Today route only. A save from Entry edit never shows it, even for today's key."

### D4 (M). Future-day and invalid `:dayKey` validation has no owner
AD-4: blocked "by the client only"; AD-8 rules skip it. Today never needs it; Entry edit takes any `:dayKey` from the URL.
- Pair: Today story assumes today; History story trusts the route. `/history/2099-01-01` or `/history/garbage` renders an editable form and `save` accepts it (no `invalid` case defined for it).
- Fix (AD-4/AD-5): "`domain/validation.ts` exports `validateEntryKey(dayKey, today)` (well-formed, real calendar date, not after `today`). `EntryStore.save` and `remove` return `error('invalid')` when it fails and the Entry-edit route guard redirects to History."

### D5 (M). Stale tab or device and full-document last-write-wins
AD-5 accepts LWW, loads once with no listener. Because writes are full documents, a stale desktop tab (open since morning, "Missing today") saves Weight and erases the Mood/Sleep just saved from the phone; the Happy effect also compares with stale data. The 10 s timeout case is worse: a timed-out write may still commit later (queued), the UI said `timeout` and the signal is stale until the next write.
- Fix (AD-5): "Before an Entry form opens for a Day that has an Entry, and on tab visibility change after more than 5 minutes hidden, `EntryStore` re-reads that Day (or the whole set). After a `timeout`, `EntryStore` re-reads that document in the background until it succeeds and then updates the signal. There is no `conflict` error code in v1." (If the owner prefers no re-read, state in AD-5 that a stale tab can overwrite another device's fields and that this is accepted.)

---

## Session and logout leakage

### X1 (H). In-flight writes and direct account switches
AD-9 tags only load results with `uid`. AD-5 updates the signal after a confirmed write. `SessionScope` reacts to `signedIn` and `signedOut`, not to `signedIn(A) -> signedIn(B)` (multi-tab: Firebase shares auth state across tabs).
- Pair: Story A starts a save as A; user logs out and in as B within the 10 s window; A's write confirms and `EntryStore` inserts the Day into B's signal (and the timeout re-read hits B's path). Story B (multi-tab) never goes through `signedOut`, so stores keep A's data under B.
- Fix (AD-9): "Every `save`, `remove` and re-read captures `uid` at call time and its result is dropped, not applied, if the current uid differs. `SessionScope` resets all stores and the draft store on every change of the session value, including `signedIn(a)` to `signedIn(b)`. On sign-out it also closes dialogs and clears feature view state through an exported `sessionEpoch` signal that feature components key on (`@for` / `@if` on `epoch()`)."

### X2 (L). Post-login destination and signed-in visits to /login
AD-9 protects routes; nothing names who navigates after login or register, restores a deep link, or redirects a signed-in user away from `/login`. Two features will each do it.
- Fix (AD-9): "The guard owns all redirects: signed-out to `/login?returnUrl=`, signed-in on an auth route to `/today`. Auth components never call `navigate` for these."

### X3 (L). Logout and back navigation
FR-2 requires back navigation to reveal no Entry data. Add: "Logout navigates with `replaceUrl: true`; the app sets `Cache-Control: no-store` for `index.html` in `firebase.json`."

---

## Rules vs client parity

### R1 (M). Rules are hand-maintained against a registry that is supposed to be the only list
AD-8 hard-codes the key set; AD-3 says new Dimension equals new registry item with "no migration" (NFR-2). Vectors cover Weight and Sleep only (AD-14), not Mood, key set, or `updatedAt`.
- Pair: the Activity story adds a registry item and passes all unit tests; production writes fail with `permission` (rules key set), or the rules story adds a key with a different range than the registry and nothing fails.
- Fix (AD-8 + AD-14): "`tests/rules` iterate the registry: for every Dimension, valid min, max, off-step and out-of-range values must agree between `domain/validation.ts` and the emulator, and unknown keys must be rejected. Mood (integer 1 to 10) is part of the vectors. Rules require `updatedAt == request.time`. Adding a Dimension changes registry, rules and rules vectors in one change; Release order (AD-11) is already rules first."

---

## Chart and series divergence

### H1 (M). `resolveRange` cannot resolve "all"
AD-4: `resolveRange(rangeId, today)`. Preset `All` needs the first Entry date; "1 y" needs a start before the first Entry to be meaningful. FR-29 "this week" and Report 7 d both come from it.
- Pair: Report story computes `all` from `min(keys)`; Statistics story computes its own start from the first non-null per Dimension: x-axis and averages cover different spans, and an empty set crashes one of them.
- Fix (AD-4): "`resolveRange(rangeId, today, firstEntryKey | undefined)` returns `{from, to}` inclusive; `all` clamps `from` to `firstEntryKey` (or to `to` if none); one resolved Range object is passed to `series`, `stats` and the chart table."

### H2 (M). Axis scale and the combined vs per-Dimension charts
AD-6 and AD-10 define datasets, colors and markers. Axes are undefined: UX says "each Dimension has its own scale in the combined chart"; per-Dimension charts have "a labeled value axis in the unit".
- Pair: combined chart uses auto-scale per axis; per-Dimension chart uses the registry range (20 to 400 kg), flattening Weight into a line; the same Day looks different in the two.
- Fix (AD-6): "`chartDataset` also returns the axis config (`yAxisID`, `min`/`max` derived once by `axisBounds(series)` as the padded data extent, never the registry range; unit label from the registry). Combined and single charts both use it."

### H3 (L). Text alternative and chart precision
"Show data as table" (UX) lists Days and values; bridged and missing rows need defined text (`strings.ts` 'no entries · bridged'). Add to AD-6: "the table renders null points with the `gap` string and uses `formatDimensionValue`".

---

## i18n

### I1 (M). The mechanical checks leave i18n and number leaks open
AD-13(e) scans templates only. AD-14 says `number.ts` is the only place that parses, rounds, formats, but nothing enforces it.
- Pair: Story A uses `| number` / `| date` pipes (static `LOCALE_ID`, not the Language signal); Story B calls `toFixed(1)` or `snackBar.open('Saved')` in TS; Angular Material's built-in labels (slider, dialog, paginator) stay English; `<html lang>` is never updated (FR-25) because no AD owns it.
- Fix (AD-13): "Add (f) ESLint bans `toFixed`, `toLocaleString`, `parseFloat`, `Number()` on input, `DecimalPipe`, `DatePipe`, `Intl.*` outside `domain/number.ts`; (g) a test scans `.ts` files under `features/` and `shared/` for string literals passed to `snackBar.open`, `aria-label` bindings, `title`, and chart option text; (h) `PreferencesStore.language` also sets `document.documentElement.lang` and Material's `*Intl` providers, in one effect owned by the shell." Add to AD-7 that `formatDay(dayKey, style, locale)` is the only date formatter and it calls `parseDayKey`, so no feature builds a `Date` or picks a time zone.

### I2 (M). Error text is mapped per feature
Conventions: "features map codes to `strings.ts`". Today, Entry edit and Delete each map; `permission`, `invalid` and `unknown` have no copy; Auth errors (wrong password, email in use, weak password) are outside the AD-5 closed set, so Story A passes raw Firebase codes and Story B shows raw text (banned).
- Fix (AD-5 + Conventions): "One `errorMessage(code)` in `shared/` maps every code to a `strings.ts` key (`network`/`timeout` use the UX 'Couldn't save…' copy). `AuthService` returns its own closed set (`email-in-use`, `invalid-email`, `weak-password`, `wrong-credentials`, `too-many-requests`, `network`, `unknown`). Add `EntryStore.reload()` (needed by the UX 'Retry' on failed load) to the AD-5 mutation list as the only non-write method."

---

## Smaller items

- L1. Missing-entry sign and empty states while `status` is `loading` or `error`: `!entries[today]` is true, so the banner flashes. Fix (AD-5): "derived selectors return `undefined` unless `status` is `ready`; features render skeleton or retry for `undefined`, never an empty state."
- L2. AD-13(b) bans `new Date` outside `domain/day.ts` but does not say it applies to tests; tests that need fixtures will either break the build or be exempted ad hoc. Say: "(b) excludes `*.spec.ts`, which must use `parseDayKey` or the day helpers."
- L3. CDK virtual scroll needs a fixed item size; Entry rows (three values) and dashed missing rows differ in height, and Italian text and 200% zoom wrap. Say in Performance: "one fixed row height at each `windowClass`, rows never wrap; long text ellipsizes with an accessible name."
- L4. "Last entries" appears on the tablet mockup, not only desktop; AD and FR-29 mention desktop only. Say in the Capability map which windowClasses show `recentEntries(5)` (UX: medium and expanded).
- L5. No import-boundary rule between features (History imports Today's components, Report imports History helpers). Covered by the C2 fix (f).
- L6. Report Range lives in the feature (view state) while UX says it survives only while the Report stays open; state it explicitly so a Tab switch resets to 30 d (or move it to a store).
- L7. ESLint rule covers `firebase/*` only; add `@firebase/*` and `firebase/compat/*`.

---

## Priority order for fixing

1. S1, S2, S3 (the Entry/value contract), C1, C2, D1, X1.
2. D2, C3, S4, S5, R1, H1, H2, I1, I2.
3. D3, D4, D5, X2, X3 and the L items.
