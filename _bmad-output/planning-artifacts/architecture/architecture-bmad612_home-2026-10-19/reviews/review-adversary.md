# Adversarial review: ARCHITECTURE-SPINE.md (Weight4All)

Reviewer stance: two builders, each obeying every AD literally, working on sibling units (stories) in isolation. Each finding is a pair that still collides, followed by the AD wording that closes it. Severity: H = data loss/leak or user-visible wrong data; M = incompatible builds caught late; L = polish drift.

Verdict: the spine is a sound skeleton (single data boundary, registry, pure series/stats) but NOT build-safe yet. Eleven H/M holes. The biggest are: (1) AD-9 has no session lifecycle, so in-flight loads can leak one Account's data into another; (2) the Entry form, its draft, its defaults and the `save` write semantics have no owner, so Today and Entry edit will disagree on what an Entry is; (3) AD-3 and AD-4 are unsatisfiable as written (Weight is special-cased everywhere; day arithmetic and formatting need functions AD-4 forbids), so builders will break them differently; (4) rules vs client numeric parity (floating point, UTC vs local "future"); (5) the `bridged` mark cannot be addressed by Chart.js's segment callback as AD-6 describes it.

---

## H-1. Session lifecycle: unknown state, in-flight results, draft survival (AD-9, AD-5, Conventions/State)

Pair: Builder A writes `EntryStore` with an `effect()` on `AuthService.session` that calls `getDocs` and then `entries.set(...)`. Builder B writes `AuthService.logout()` that resets every store signal then navigates (AD-9 verbatim). Builder C writes the route guard as `session() ? true : redirect('/login')`.

Both obey the letter, yet:
- On a page reload the Firebase session restores asynchronously (initial `null`, then user). Guard C sees `null` and redirects to login on every reload, violating FR-2 "stay logged in". AD-9 says "session as a signal" but gives no "unknown" state.
- A's `getDocs` is in flight at logout; it resolves after B's reset and repopulates the signal. Next login (same tab, other Account) briefly shows Account A's Entries. Cross-Account leak, FR-4 violated at the UI layer even though rules are intact.
- The "store-backed draft" (Conventions) is a store, but nobody lists it among "every store signal" B resets; Account A's typed weight shows for Account B.

Close with new/tightened AD-9:
> **AD-9 (replace Rule).** `AuthService.session` is a signal of `{ status: 'unknown' | 'signed-out' | 'signed-in'; uid?: string }`, initial `unknown` until the first Firebase auth callback. The route guard waits while `unknown` and never redirects on it. Every store (`EntryStore`, `PreferencesStore`, the draft store, any future store) implements one `reset()` and registers with a single `SessionScope` in `core/data`; `SessionScope` is the only code that reacts to session changes: on `signed-in` it calls each store's `load(uid)`, on `signed-out` it calls every `reset()` before navigation. Every async store result carries the `uid` it was requested for and is discarded if it differs from the current session `uid`. Logout also clears the draft store. Password-reset responses never reveal registration (unchanged).

## H-2. Entry form: initial values, defaults, draft ownership (AD-2, AD-3, Conventions/State, UX Sleep card)

Pair: Story "Today" and story "Entry edit (History)" each build the three cards.

Collisions that both pass every AD:
1. UX says an untouched Sleep slider saves 6.0 h; AD-2 says absent is absent. Today builder pre-sets the control to 6.0 and stores it. Edit builder, opening a missing Day via "+ Add" (a forgotten day), also stores 6.0, fabricating sleep data for a day Bob never measured, which then pollutes Statistics and charts as a Real entry. No AD says which surfaces default.
2. Today with an existing Entry for today: builder A loads today's saved values (sensible); builder B follows UX literally ("pre-filled with last Weight, empty Mood, Sleep 6.0") and a re-save silently overwrites today's mood and sleep. "Last Weight" for a past Day: latest overall or latest before that Day? Unspecified.
3. Draft ownership: Conventions say "Unsaved Today input survives Tab switches in a store-backed draft"; UX also requires Entry edit input to survive resize/orientation, and Language switch without losing input. Today's builder puts the draft in `EntryStore`; Edit builder creates a `DraftStore` keyed by day. Two owners of "unsaved entry". Draft holds raw strings ("72,4") or parsed numbers? If raw, a Language switch can change how "72.4" re-renders but not how it parses; if parsed, a half-typed "72," is lost.
4. AD-3 says the Entry form "iterates the Dimension registry", but the three cards are bespoke widgets (stepper, faces, slider). One builder renders generic number inputs from the registry, the other bespoke cards. The registry has no widget or default metadata.

Close with new AD-12 and a tightened AD-3:
> **AD-12 — One Entry form model.** `domain/entry-form.ts` exports `initialDraft(entries, dayKey)` and `toEntryValues(draft)`. Rules: if an Entry exists for `dayKey`, the draft starts from its stored values and an absent Dimension stays absent (cleared state), never a default. If none exists, weight starts from the most recent Entry strictly earlier than `dayKey` (empty if none), mood absent, and sleep absent until the user touches the slider (the slider's visual start position is 6.0 h but the value is not set until touched; this supersedes the UX "saves 6.0 h" wording, which must be corrected in EXPERIENCE.md or the product owner must explicitly accept fabricated 6.0 and apply it only to Today, never to "+ Add" or Entry edit). Today and Entry edit use the same `EntryFormComponent`, parameterised by `dayKey`; no second form. The draft lives in one `DraftStore` keyed by `dayKey`, holding the typed text per Dimension (strings) plus touched flags; it is cleared on confirmed save, on Cancel, and by `SessionScope.reset()`. Parsing text to values happens only in `domain/validation.ts`.
> **AD-3 (add).** The registry item also carries `input` (`'stepper' | 'faces' | 'slider'`), `formDefault`, `displayDecimals` and `clearable`; the form renders bespoke widgets selected by `input`, so a new Dimension is a registry edit plus at most one new widget.

## H-3. `save` write semantics: merge vs replace, null vs absent, value shape (AD-2, AD-5, AD-3)

Pair: Today builder calls `setDoc(ref, data, { merge: true })` (to "avoid losing fields"); History builder calls `setDoc(ref, data)` (replace). Edit clears Mood: replace deletes it, merge keeps the old value, so Today re-save resurrects a cleared mood, and "clearing deletes the field" (AD-2) holds only on one path. A third builder passes `mood: null` for clear; the rules (AD-8) reject it only in production, since unit tests mock the store.

Also `save(dayKey, values)` has no declared type. AD-3 forbids naming a Dimension literally outside the registry, yet TypeScript needs `{weight; mood?; sleep?}` somewhere.

Close:
> **AD-5 (add).** `save(dayKey, values)` takes `EntryValues = { weight: number } & Partial<Record<DimensionKey, number>>`, where `undefined` means "absent". `EntryStore` writes with a full-document replace `setDoc(ref, doc)` (never `merge`, never `update`), where `doc` contains only defined fields plus `updatedAt: serverTimestamp()`. No caller passes `null`. The store, not the caller, builds the document through one `toDoc`/`fromDoc` pair in `entry.store.ts`; `fromDoc` returns a domain `Entry` with no Firestore types (`updatedAt` is not exposed), so features never import `firebase/*` types (AD-1).

## H-4. AD-3 vs reality: Weight is special-cased everywhere

Pair: Happy effect builder (F1) needs "Weight". FR-8 prefill needs "Weight". The Entry-required rule is Weight. AD-3 says nothing outside `domain/dimensions.ts` names a Dimension literally. Builder A violates AD-3 knowingly (`entry.weight`), builder B writes `dimensions.find(d => d.key === 'weight')` (a literal anyway), builder C invents `dimensions[0]` (breaks when a Dimension is inserted first). Three incompatible lookups, and a lint-free violation.

Close:
> **AD-3 (add).** The registry exports `PRIMARY: Dimension` (the single required Dimension, Weight) and `DimensionKey` (literal union derived from the list with `as const`). Code that is inherently about the primary Dimension (Happy effect, weight prefill, weight stepper, "weight is required") uses `PRIMARY`; all other code iterates the list. ESLint `no-restricted-syntax` forbids the string literals `'weight' | 'mood' | 'sleep'` and property access `.weight/.mood/.sleep` outside `domain/dimensions.ts` and `firestore.rules`.

## H-5. Rules vs client numeric parity (AD-2, AD-8)

Pair: Client builder stores `weight` after the plus button: 72.7 + 0.1 = 72.80000000000001; or parses "72,4" via `parseFloat`. Rules builder writes "one decimal" as `request.resource.data.weight * 10 == math.floor(request.resource.data.weight * 10)`; in rules arithmetic, 72.4 * 10 is 724.0000000000001, so valid saves are rejected (or rules builder drops the check and the client alone enforces it, defeating AD-8). A client number like `80` is sent as an integer value; a rule written `weight is float` rejects it, `is number` accepts it. AD-8 says only "types and ranges per AD-2".

Second drift: FR-12 "no future Days". Rules builder adds `docId <= request.time.date()` in UTC. A user at UTC+10 logging at 08:00 local on the new day is rejected. Client AD-4 uses device-local. Nothing says rules must be looser or that the future check is client-only.

Close:
> **AD-2 (add).** The client always rounds weight to one decimal in integer tenths (`Math.round(x * 10) / 10`) before save and displays via `toFixed`. Weight is validated as a number (`is number`, int or float accepted), `20.0 <= weight <= 400.0`, and one decimal tested as `math.abs(weight * 10 - math.round(weight * 10)) < 0.000001`. `sleep` is a number with `sleep * 2` an integer in 0..48; `mood` is `is int` 1..10. Rules and `domain/validation.ts` are generated from, or tested against, one shared table of vectors in `tests/rules/vectors.json` (boundary values, 72.4, 72.8 after stepping, 80 as int, 0.0 and 24.0 sleep, 20.0 and 400.0).
> **AD-8 (add).** `updatedAt == request.time`; `entries/{id}` id matches `^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$`. The "no future Day" rule is enforced by the client only; rules may reject only ids later than the UTC date plus one day. `preferences/app` is validated too (see M-4). "Everything else is denied" is restated as: any path other than `users/{uid}/entries/*` and `users/{uid}/preferences/app` is denied (the blanket `users/{uid}/**` wording in the current AD contradicts it).

## H-6. Day arithmetic and day-key formatting (AD-4 vs AD-6, AD-7, FR-29)

Pair: Report builder must enumerate every Day in a Range; History builder must enumerate missing Days between first and last Entry; "This week" needs the 7 Days ending today; Intl must format "Sun 19 Oct" from a key. AD-4 exposes only `dayKey(date)` and `todayKey()` and forbids all other code from building or parsing keys or calling `new Date()`. Each builder either breaks AD-4 or writes private helpers: one does `new Date('2026-10-19')` (UTC midnight, so Americas see "Sat 18 Oct"), one adds `86400000` ms (breaks on DST days, duplicating or skipping a key), one adds days via `setDate`. Also:
- Range presets: "7 d" is `today-6..today` in one place and `today-7..today` in another; "1 y" 365 vs calendar year; "All" start. The Range resolver is deferred to "Range service in `features/report`" while "This week" in `features/today` needs the same window. Two 7-day definitions will diverge.
- `todayKey()` is a function. App left open past midnight keeps the Missing-entry sign and "This week" on yesterday; Today saves to the wrong Day.

Close:
> **AD-4 (replace Rule).** `domain/day.ts` is the only code that parses or builds day keys and the only code that touches the clock. It exports `dayKey(date)`, `todayKey()`, `parseDayKey(key): Date` (local noon, so it never shifts a Day), `addDays(key, n)` and `eachDay(from, to)` (calendar arithmetic, DST-safe), `compareDayKeys`, and `resolveRange(preset | {from,to}, entries, today): {from, to}` with: 7 d = today-6..today, 30 d = today-29..today, 90 d = today-89..today, 1 y = same calendar date a year earlier plus one day..today, All = first Entry key..today. "This week" is `resolveRange('7d')`. A `today` signal (`Signal<string>`) provided by the shell re-evaluates at local midnight and on `visibilitychange`; all "is today logged" computations read it, never `todayKey()` directly in a template. Display formatting takes a day key and goes through `parseDayKey`.

## H-7. `bridged` mark cannot be expressed through Chart.js `segment` (AD-6)

Pair: `domain/series.ts` builder emits one point per Day with `value: number | null` and a `bridged` flag "per segment" between consecutive Days (day i to i+1). Chart builder sets `spanGaps: true` and a `segment.borderDash` callback. With `spanGaps: true`, Chart.js skips null points, so a drawn segment runs between the two nearest non-null points and the callback's `ctx.p0DataIndex/p1DataIndex` refer to those, not to day i/i+1. The series builder's flag is indexed by consecutive-Day pair, the chart builder reads `bridged[ctx.p0DataIndex]`: a three-day hole is dashed only for the first day-pair, or (reading the wrong index) the real solid segment next to it is dashed. Both comply. Also the combined chart (three scales per UX "own scale") and the three per-Dimension charts must share the same x labels; one builder uses category axis from series, another a time scale (needs a date adapter not in the Stack).

Close:
> **AD-6 (add).** Series output per Dimension is `points: { day: string; value: number | null; bridgedFromPrev: boolean }[]`, where `bridgedFromPrev` is stored on the point that ENDS a drawn segment (the next non-null point) and is true when any Day between it and the previous non-null point has no value for that Dimension. The chart `segment.borderDash` callback reads `points[ctx.p1DataIndex].bridgedFromPrev` and nothing else. Leading and trailing nulls draw nothing. All charts use a category x-axis whose labels are `points.map(p => p.day)` of the same resolved Range; no date adapter. The combined chart gives each Dimension its own y-axis scale (UX), implemented by one `chartDatasetsFor(dimension)` helper in `features/report`, reused by the per-Dimension charts. Table alternatives are generated from `points`.

## M-1. Chart text, Language switch and colors on a canvas (AD-7, AD-10, FR-25, FR-28)

Pair: chart builder A builds Chart.js options once in `ngOnInit` with translated axis titles, legend and tooltip strings (compliant: through `strings.ts`). Language switch "applies at once, no reload": A's chart keeps the old Language. Builder B re-creates the chart on every Language signal change, losing selected Range scroll/hover. Dimension color: registry stores a "chart color token"; A resolves the CSS variable once at init (works), B writes hex into the registry (violates AD-10 but registry "defines the token"); neither knows whether registry holds token name or value. `lang` attribute (FR-25) belongs to no AD, so no one sets it.

Close:
> **AD-7 (add).** Chart options are produced by one pure function `chartOptions(language, dimension, series)` and passed to `ng2-charts` as a signal-derived input; changing Language updates options in place (`chart.update()`), never re-creates the chart. The shell sets `document.documentElement.lang` from the Language signal. The registry holds a chart color TOKEN NAME; `shared/theme` exposes `resolveChartColor(token)` that reads the computed CSS value; no hex in the registry.

## M-2. Language/locale and parameterised strings (AD-7)

Pair: builder A maps Language `en` to `en-US` ("Sun, Oct 19"), builder B to `en-GB` ("Sun 19 Oct", what UX shows); number formats are the same but dates differ between History and Today. Strings with parameters ("Enter a weight between 20.0 and 400.0 kg", "6 of 7 days logged", "vs 14 Oct", plurals) force a choice: A adds `{min}` placeholders with `.replace`, B makes values functions; keys flat vs nested; `domain/validation.ts` (imports nothing, so no strings) returns either strings or codes. Also AD-3's registry stores "label key in strings.ts", so `domain` imports a type from `shared`, contradicting "Domain imports nothing" in the diagram.

Close:
> **AD-7 (add).** `strings.ts` value type is `string | ((params: Record<string, string | number>) => string)`; keys are namespaced `area.element` (`today.banner.title`); plurals use `Intl.PluralRules`. Locale map is fixed: `en` is `en-GB`, `it` is `it-IT`, defined once in `shared/locale.ts`. Domain functions return codes plus params (`{ code: 'weight.range', min: 20, max: 400 }`), never text; features map them to strings. `StringKey` lives in `domain/string-keys.ts` (a plain union) and `strings.ts` imports it, keeping `domain` dependency-free.

## M-3. Numeric display, rounding and Happy-effect classification (AD-6, domain)

Pair: stats builder shows Change as `last - first` (72.4 - 72.7 = -0.2999999999999972) and formats with `Intl` default (up to 3 decimals), History shows `72.4`, This week shows average to 1 decimal using `toFixed`, Happy-effect builder classifies `delta < 0` as loss. Two near-equal weights (72.4 vs 72.4000000001 after float noise) yield "no change" in one place and "loss −0.0 kg" in another. Statistics, This week and the Happy effect all show deltas and averages with no shared precision or sign rule.

Close:
> **AD-6 (add).** All Weight arithmetic in `domain/` is done on integer tenths; `average`, `min`, `max`, `change` and the Happy-effect delta are computed in the registry's native step (tenths for weight, half-hours for sleep, integers for mood) and converted back once. The registry holds `displayDecimals` per Dimension; one `formatValue(dimension, value, language)` formats every number in History, Statistics, This week, Happy effect and charts; one `formatDelta` renders the sign (true minus, `+`, and exactly `0.0` with no sign for zero). Happy effect category (`loss | same | gain`) is derived from the rounded delta. `change` with exactly one Real entry is `0`; with none, `null` ("No data").

## M-4. Preferences: ownership, rules, optimistic vs confirmed (AD-5, AD-8, AD-10)

Pair: F0 auth builder writes `firestore.rules` for entries only and "everything else denied"; Settings builder later writes `users/{uid}/preferences/app` (AD-10, `[ASSUMPTION]`) and it passes locally only if the emulator rules were loosened; or the opposite: rules allow `users/{uid}/**` and the preferences document accepts any shape (accent `"hotpink"`, language `"fr"`). AD-5's "update signal only after Firestore confirms" is written for `EntryStore`; UX demands Language and Accent "apply at once": Settings builder A applies optimistically and never reverts on failure, B waits for the server (laggy). Accent id set is "six", defined nowhere; a stored id that no longer exists crashes the theme switch. Language before login is English and logout resets the store, so a returning Italian user flashes English on the login screen (accepted) but also after login until preferences load.

Close:
> **AD-10 (add).** `domain/preferences.ts` defines `ACCENTS` (six ids) and `LANGUAGES = ['en','it']`; `PreferencesStore.set(patch)` applies optimistically, writes `setDoc(..., {merge:true})`, and on failure reverts the signal and returns the same result type as `EntryStore`; unknown stored values fall back to defaults. `firestore.rules` validates `preferences/app`: field set `hasOnly(['accent','language','updatedAt'])`, `accent in ACCENTS`, `language in ['en','it']`. Preferences load with `EntryStore` under `SessionScope` (AD-9); the app renders behind a skeleton until both settle or fail (a failure shows defaults).

## M-5. Store load status, staleness and write timeouts (AD-5, FR-14)

Pair:
- Load: AD-5 says load once; UX needs Loading/Failed-load-with-Retry states; nothing defines the store's status. Today builder enables Save before the load finishes; `entries()` is empty, the prefill is empty, and the Happy effect says "Welcome! Your first log" for a user with 300 Entries, and the save overwrites an existing today Entry with weight only.
- Stale across devices: Bob has the app open on his phone all day; he logs on the laptop; the phone still shows the Missing-entry sign; saving on the phone (full replace) wipes the mood and sleep logged on the laptop. No listeners, no refresh policy (violates user intent behind NFR-5).
- Offline writes: with no persistence and no network, Firestore `setDoc` neither rejects nor resolves; it queues in memory and waits. AD-5 and FR-14 ("failed save shows an error") are then satisfied only if someone adds a timeout. Builder A has no timeout (spinner forever, button disabled), builder B uses `navigator.onLine`. The queued write later replays after the user was told it failed, possibly after a retry, a later edit or a delete of the same Day.

Close:
> **AD-5 (add).** `EntryStore` exposes `status: Signal<'idle' | 'loading' | 'ready' | 'error'>`; `save` and `remove` return an error with code `not-ready` unless `ready`; Today and Entry edit disable Save while not `ready`; `error` shows inline Retry (`reload()`). The store reloads on `visibilitychange` to visible when more than 5 minutes have passed since the last load, and `save` of an existing Day first reads that document from the server and returns `conflict` if its `updatedAt` differs from the loaded one (the form offers "Reload"). Writes are raced against a 10 s timer: on timeout the store returns code `network`, calls `terminate`-free recovery (`disableNetwork` then `enableNetwork` to flush the queue before the next operation), and no UI shows saved. Error codes are the closed set `network | permission | validation | conflict | not-ready | unknown`; features map exactly these.

## M-6. Route and surface structure: window class, modal depth (Paradigm, UX)

Pair: Shell owns "layout breakpoints"; Today builder uses CSS `@media (min-width: 840px)` for "This week" (UX expanded); History builder uses `BreakpointObserver` with 768 for "Entry edit dialog vs full screen"; Report builder uses Material's `Breakpoints.Medium` (which is 960-1279 in CDK, not M3 600-839). Three window-class definitions. "This week" is rendered but hidden by CSS (still computed, fine) or removed from DOM; tests differ. Also nothing says whether Entry edit is a route (deep link, back button, survives reload) or a dialog; UX says "modals stack one level deep" yet Delete confirmation opens from inside Entry edit (two levels). Entry edit on resize must keep unsaved input (draft) when switching between full-screen and dialog presentation.

Close:
> **Paradigm / Shell (add).** The shell exposes one `windowClass: Signal<'compact' | 'medium' | 'expanded'>` (600/840 M3 thresholds, custom `BreakpointObserver` queries, not CDK `Breakpoints.*`); no feature uses its own breakpoint. Entry edit is a route `history/:dayKey` (child of History) presented as full screen on compact and dialog elsewhere via the same component; Delete confirmation is the only second-level overlay and the one-level rule is amended to "one stacked dialog on top of a surface".

## L-1. Statistics/series scope and History row builder have no home

`domain/history.ts` (missing-day rows between first and last Entry, newest first, the "last 5 Entries" on desktop and "Last entries" on tablet) is not listed in the layout; builders will put it in the component or in `stats.ts`. "Last 5" vs "Last entries" count is unspecified. Close: add `domain/history.ts` to the Domain row and AD-3 consumers list: `buildHistoryRows(entries, today)` and `recentEntries(entries, n)` with n=5 on expanded and n=3 on medium (UX decision needed).

## L-2. Enforcement of conventions

AD-1 is enforced by lint; AD-3, AD-4, AD-6, AD-7 are not. "No literal UI text in templates" and "no `new Date()`" need ESLint rules (`no-restricted-syntax`, Angular template `i18n`-style custom rule) or they will drift. Add to AD-11: lint (`no-restricted-imports`, `no-restricted-syntax` for `new Date`/`Date.now` outside `domain/day.ts` and for Dimension literals outside the registry), `tsc --noEmit` and `vitest` run as a required `npm run verify` before `firebase deploy`, since there is no CI.

## L-3. Release ordering with "exact field set" rules (AD-8 vs AD-2 "no migration")

Adding a Dimension requires changing `firestore.rules` (exact `hasOnly`). `firebase deploy` of Hosting and rules is not atomic: a client that sends `activity` can hit old rules and fail every save, or new rules may precede the client. Close in AD-11: deploy rules first (superset of fields), then Hosting; new-Dimension stories must add the field to rules and vectors in the same change and ship rules one deploy earlier.

---

## Summary of proposed AD changes

New: AD-12 (one Entry form model). Tightened: AD-2 (rounding, rules types), AD-3 (PRIMARY, input metadata, lint), AD-4 (day arithmetic, range resolver, `today` signal), AD-5 (status, conflict, timeout, error codes, save replace semantics), AD-6 (point-keyed `bridgedFromPrev`, shared category axis, integer arithmetic, formatting), AD-7 (chart options, locale map, params, codes not text), AD-8 (id regex, future-day split, preferences rules, path wording), AD-9 (tri-state session, `SessionScope`, uid-tagged results, draft reset), AD-10 (preferences schema and optimistic semantic), AD-11 (verify script, deploy order), Paradigm (windowClass, route for Entry edit).

Open product questions the spine cannot decide alone: (a) Sleep untouched slider saves 6.0 h vs absent (fabricated data risk); (b) the count of "recent entries" on medium/expanded; (c) whether stale-device conflicts should block or merge.
