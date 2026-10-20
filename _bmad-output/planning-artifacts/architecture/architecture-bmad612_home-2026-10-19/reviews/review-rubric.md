# Review: ARCHITECTURE-SPINE.md (Weight4All v1), good-spine checklist

Reviewed against: PRD (FR-1..29, NFR-1..5), EXPERIENCE.md, DESIGN.md. Spine not edited.

## Verdict

**Revise before handing to epics/stories.** The paradigm, layering, single data boundary, Dimension registry, day-key and gap-as-null decisions are sound, and most FR/NFR are mapped. But one AD cannot deliver its PRD requirement as written (FR-14), several Rules have no enforcement mechanism, one UX/PRD conflict is left unresolved at a real divergence point, and a few shared concepts (Range, combined-chart scale, bridged definition) are owned by no one. No Deferred item is dangerous except the Range gap noted below.

## Findings (ordered by severity)

### 1. HIGH. AD-5 does not make FR-14 achievable with Firestore semantics
- FR-14/AD-5: "update the signal only after Firestore confirms; surface an error on failure." With the Firestore web SDK, `setDoc`/`deleteDoc` while offline does not reject; the promise stays pending until the server acks. "Disable offline persistence" does not change this (writes queue in memory). So the "network disconnected -> error message, values remain" test cannot pass by following the Rule.
- The Rule also leaves undefined: a timeout/connectivity strategy, what happens to the queued write after the user sees an error and retries (it may land later, silently), and the Save button's in-flight state forever.
- Fix: decide the failure-detection mechanism (e.g. bounded timeout plus `disableNetwork`/cancel, or a pre-write reachability check, or a transaction/`runTransaction`, which fails offline) and state that a timed-out write is treated as failed and that retry is idempotent (same doc id, full overwrite).

### 2. HIGH/MEDIUM. Several Rules are not enforceable as written (only AD-1 names a mechanism)
- AD-3 ("code outside dimensions.ts never names a Dimension literally"), AD-4 ("no other code calls new Date()/Date.now()"), AD-7 ("no literal UI text in templates") and the layer diagram ("domain imports nothing", features do not import each other) have no lint rule, test or build gate. Two units will drift; a reviewer is the only check.
- AD-3 is also internally strained: the UX makes each Dimension a bespoke control (stepper for Weight, ten faces for Mood, slider with clear "x" for Sleep) and the Happy effect and "This week" are Weight-specific. "The Entry form iterates this list" is not realistic unless the registry also carries a `control` type and the spine says which parts are generic (charts, stats, History row values) and which are intentionally Dimension-specific (Today cards, Happy effect). Otherwise units will either hard-code (violating the Rule) or build a configurable form no one asked for.
- Fix: add enforcement per AD (ESLint `no-restricted-syntax`/`no-restricted-globals` for `Date` outside `domain/day.ts`; eslint-plugin-boundaries or import restrictions for layers; an i18n lint or template check for literals; a unit test that asserts registry/rules parity), and scope AD-3 to what is actually generic.

### 3. MEDIUM. Absent-value semantics: UX contradicts PRD; spine silent at the divergence point
- PRD UJ-1 edge case and FR-17: a weight-only Entry has empty Sleep. EXPERIENCE.md: the Sleep slider defaults to 6.0 h and an untouched slider saves 6.0 h; weight-only requires pressing "x" first. AD-2 only says "absent is absent, never 0" and does not say who owns the default, so Today, Entry edit and History/stat code can each behave differently (and "This week"/Report averages would include fabricated 6.0 values).
- Fix: record an AD or an explicit open question that resolves this (form default vs. stored value, and that edit shows the stored value or cleared state), and flag the PRD/UX conflict upstream.

### 4. MEDIUM. AD-8 and AD-2 have gaps/contradictions in the rules and write semantics
- AD-8 first allows read/write on `users/{uid}/**`, then says "everything else is denied." The preferences document (`users/{uid}/preferences/app`) gets no shape validation (accent in the six, language in `it|en`) and, as written, falls under the wildcard. State the preferences rule explicitly.
- AD-2 says clearing a value deletes the field and rules require an exact field set, but does not state whether `save` is a full-document `setDoc` (replace) or a merge. With merge, removal needs `deleteField()`; units will diverge and rules may reject or accept stale fields. Mandate full replace.
- "Entries cannot be created for a day later than todayKey()" is client-only (rules cannot know the device date); say so, or bound it in rules with `request.time` plus a tolerance for time zones.
- Ranges exist in both `dimensions.ts` and `firestore.rules` with no parity check (see finding 2).

### 5. MEDIUM. Shared concepts with no owner: Range, combined-chart scale, "bridged"
- Range: FR-18 (presets, default 30 d, "all", persists through rotation, one Range for all charts) and the Deferred note refer to "the Range service in `features/report`", which appears nowhere else in the spine. Who computes the day list for a Range relative to `todayKey()`, where the selection lives (store vs. view state, which matters because the Conventions say features hold only view state and rotation must not lose it), and whether "This week" shares the definition are all undecided. Add a `domain/range.ts` and a state owner.
- Combined chart scale (PRD Open Question 2, resolved by UX as "each line has its own scale"): the spine never records it. Without it the combined chart and per-Dimension charts can be built with different axis/normalization rules, and the registry has no `axis` field. Add it to AD-3/AD-6.
- AD-6 "bridged" definition: "a segment is bridged when either end has no Real entry or a Day between them has none." With `spanGaps: true`, Chart.js passes only non-null points to `segment` callbacks, so "either end has no Real entry" can never be true; the definition should be "the two Real points are not on consecutive Days." Also specify how the per-Dimension rule (a Day lacking Sleep bridges the sleep line only) maps to the combined chart, and the sparse case (single point, zero points) output shape for FR-23.

### 6. MEDIUM. Deployment, operations and NFR coverage are thin (AD-11 only partly covers the altitude)
- Not decided, deferred or listed as open: performance mechanics for FR-27 (lazy-loaded routes so Chart.js stays out of the Today bundle, bundle budget, Angular zoneless vs. zone.js (zone.js is in the Stack but nothing says it is needed), History virtual scrolling at 365 rows); a Hosting config (SPA rewrite, cache headers, security headers); rules deploy ordering and a pre-deploy test gate (AD-8 says tests exist but "no CI" means nothing forces them to run before `firebase deploy`); backup/restore of health data (NFR-5 durability only covered structurally; no Firestore scheduled backup/PITR decision or explicit "accepted risk"); error/uptime monitoring (can be "none in v1" but should be said); Firebase Auth project settings the PRD depends on (email-enumeration protection for FR-3, authorized domains, password policy minimum for FR-1, persistence `local` for FR-2); the browser matrix for FR-26 (browserslist, Playwright projects, mobile Safari).
- No decision on multi-device behavior given "load once, no listeners": last-write-wins and stale History after an edit on another device is a consequence of AD-5 worth one line as accepted.

### 7. LOW. Smaller items
- AD-10: UX left the other five accent palettes' container/on-container/gradient/confetti tones and AA contrast undecided; the spine assumes a theme-class switch but sets no check (e.g. a contrast unit test over all six). Also `lang` attribute follows Language (FR-25) and reduced-motion handling for the Happy effect are not assigned to any AD.
- Deferred "Custom Range input (FR-18)": PRD lists custom Range as in scope (assumption); deferral is acceptable but must be recorded as a PRD deviation, and it only stays non-divergent once the Range owner (finding 5) exists.
- AD-9: "Password-reset responses never reveal whether registered" is a UI rule plus a Firebase console setting; registration necessarily reveals "email in use" (FR-1). Clarify scope.
- Stack: zone.js/Angular 22 and `ng2-charts` 11 versions are asserted without a note on how they were verified; fine if verified, otherwise flag.

## Checklist summary

| Check | Result |
| --- | --- |
| Fixes real divergence points, misses none | Mostly; misses Range, chart scale, absent-value/default ownership, write semantics (set vs merge), preferences shape |
| Every AD Rule enforceable and prevents its divergence | AD-1, AD-8 (with fixes) yes; AD-5 fails for FR-14; AD-3, 4, 7 lack enforcement; AD-6 definition flawed |
| Deferred cannot let two units diverge | Mostly safe; Custom Range depends on an undefined Range owner |
| Every FR/NFR covered or consciously deferred | FR-14 covered on paper but not achievable; FR-18 custom, FR-26 browsers, FR-27 mechanics, FR-25 `lang`/reduced motion not assigned; NFR-4/NFR-5 thin |
| Altitude dimensions decided/deferred/open (deploy, envs, ops) | Environments and release decided; ops, backup, monitoring, hosting config, auth project settings undecided and unlisted |
