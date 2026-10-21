
- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-create-the-angular-project-with-the-quality-gate.md`
  summary: Add lint fixtures for domain purity (rxjs, zone.js imports and DOM globals beyond window).
  evidence: Verification-gap review found removal of those ban entries would not fail any test; low severity.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-create-the-angular-project-with-the-quality-gate.md`
  summary: Run rules tests through `firebase emulators:exec` when the first rules test lands (Story 1.2).
  evidence: `scripts/test-rules.mjs` runs plain vitest, which cannot reach a Firestore emulator; unverified until tests exist.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-create-the-angular-project-with-the-quality-gate.md`
  summary: Make `npm run deploy` build and deploy rules then Hosting once `firebase.json` exists.
  evidence: Currently `check && firebase deploy`; no firebase.json or build step until Story 1.2 / 5.6.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-connect-to-firebase-and-protect-each-account-s-data.md`
  summary: Verify that a production build resolves `environment` to the prod values (no `127.0.0.1` or `demo-weight4all` in the output).
  evidence: `fileReplacements` in `angular.json` is covered by no check; removing it keeps `firebase.spec.ts` and `ng build` green. Fits Story 5.6 when real prod config lands (unverified severity: medium).
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-connect-to-firebase-and-protect-each-account-s-data.md`
  summary: Fail `npm run deploy` while `environment.prod.ts` still holds `PLACEHOLDER_*` values.
  evidence: `check` passes with placeholders, so a deploy could ship an invalid Firebase config; belongs with the Story 5.6 release checklist.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-4-set-up-the-material-3-theme-and-design-tokens.md`
  summary: Make the `--w4a-*` role colors follow the active `.theme-<id>` and run the contrast test per accent against the resolved tokens.
  evidence: Role tokens are fixed on `:root` (primary `#5a46d6` vs Material `#5945d5`) and `describe.each(ACCENTS)` ignores its argument, so adding an accent in Story 1.10 would change Material colors only and skip contrast checks (unverified severity: medium).
- source_spec: `_bmad-output/implementation-artifacts/spec-1-4-set-up-the-material-3-theme-and-design-tokens.md`
  summary: Tighten the chart-token isolation test to every selector mentioning `theme-` and drop the synthetic half in `app.spec.ts`.
  evidence: `tokensOf` matches exact selectors, so `:root.theme-violet { --w4a-chart-weight: ... }` would pass; the `app.spec` check only asserts its own injected CSS.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-5-register-with-email-and-password.md`
  summary: Bring the initial bundle back under the 500 kB budget (lazy-load auth routes or `firebase/auth`).
  evidence: `ng build` warns the initial bundle is 780.58 kB (budget 500 kB, was ~205 kB) because `firebase/auth` enters the initial chunk through eager routes (unverified severity: medium; the performance budget is Story 5.4).

- source_spec: `_bmad-output/implementation-artifacts/spec-1-6-log-in-stay-logged-in-and-log-out.md`
  summary: Load a store that registers with `SessionScope` after the user is already signed in.
  evidence: `registerStore` only pushes the store and `last` is seeded from the current session, so a lazily created store is never loaded (unverified severity: medium; matters from the first real store, Stories 2.1/2.2).
- source_spec: `_bmad-output/implementation-artifacts/spec-1-6-log-in-stay-logged-in-and-log-out.md`
  summary: Redirect to `/login` when the session becomes `signedOut` without a navigation (token expiry, sign-out in another tab).
  evidence: The guard runs only on navigation; the stores are reset but the private screen stays visible (unverified severity: medium).
- source_spec: `_bmad-output/implementation-artifacts/spec-1-6-log-in-stay-logged-in-and-log-out.md`
  summary: Make spec files that import the real `core/data/firebase` safe from module-cache order effects in the Angular Vitest runner.
  evidence: `auth.service.spec.ts` once failed all 18 tests in a `npm run check` run because the real module was cached before `firebase/auth` was mocked; 9 later runs passed, and `vi.resetModules()` is the current workaround (unverified severity: medium, a flaky gate).

- source_spec: `_bmad-output/implementation-artifacts/spec-1-6-log-in-stay-logged-in-and-log-out.md`
  summary: Keep a signed-out page from reappearing with stale content when the browser restores it from its back/forward cache after logout.
  evidence: Seen in Chrome against the local app: after Log out, browser Back showed the old `/today` screen (a fresh load went to `/login`). Harmless for the placeholder, but it would show Entry data once Today is real (AD-9, Story 1.6 AC: back navigation shows no Entry data). Candidate fixes: `Cache-Control: no-store` on Hosting, or clear the view on `pageshow` when the page was restored from cache and the session is signed out.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-7-reset-a-forgotten-password.md`
  summary: Story 5.6 release checklist: enable email-enumeration protection in the Firebase console (Authentication > Settings > User actions).
  evidence: It is a console setting, no code can enable it; the client maps `auth/user-not-found` to ok, but only the setting hides the difference for sign-in and sign-up (AD-11, FR-3).

- source_spec: `_bmad-output/implementation-artifacts/spec-1-7-reset-a-forgotten-password.md`
  summary: Send the password-reset email in the app Language and give the Firebase page a way back to the app.
  evidence: Nothing sets the Firebase `languageCode` from the Language and `sendPasswordResetEmail` gets no `ActionCodeSettings`, so an Italian user receives an English email with no continue link (unverified severity: low, nice-to-have; fits Story 1.9).

- source_spec: `_bmad-output/implementation-artifacts/spec-1-8-move-between-four-tabs-on-any-screen-size.md`
  summary: Reset the scroll position of the shell's `.content` scroller when the Tab changes.
  evidence: `.content` scrolls internally and router scroll restoration targets the window, so a new Tab can open at the previous Tab's offset; invisible with the current placeholders (unverified severity: medium, Epic 2+).

- source_spec: `_bmad-output/implementation-artifacts/spec-1-9-choose-the-language-in-settings-and-keep-it-for-my-account.md`
  summary: Keep a stored accent when the preferences read failed before the first save.
  evidence: `setLanguage` writes the full document with the remembered accent, which stays `violet` after a failed read, so a stored `teal` is overwritten (unverified severity: medium once Story 1.10 makes the accent visible; fix needs a retry of the read or a re-read before the write).
- source_spec: `_bmad-output/implementation-artifacts/spec-1-9-choose-the-language-in-settings-and-keep-it-for-my-account.md`
  summary: Reconcile a Language save that timed out and may commit later.
  evidence: The 10 s race rolls the UI back, but the Firestore write stays queued and can commit afterward, so the next load flips the Language (unverified severity: low-medium; EntryStore will need the same re-read pattern, Story 2.2).
- source_spec: `_bmad-output/implementation-artifacts/spec-1-9-choose-the-language-in-settings-and-keep-it-for-my-account.md`
  summary: Make `formatDay` and `formatNumber` safe for bad input (malformed day key, years below 100, NaN, `-0`) when Story 2.1 extends them.
  evidence: `formatDay('abc', …)` throws a RangeError from Intl and `formatNumber(-0.04, 1, …)` renders `-0.0` (unverified severity: low until callers pass user input).

- source_spec: `_bmad-output/implementation-artifacts/spec-1-10-choose-an-accent-color.md`
  summary: Stop one preference's save from persisting the other's unconfirmed value (merge-write the changed key, or serialize saves and write confirmed values).
  evidence: `save()` writes `{accent, language}` from live signals, so a Language save during a pending accent save, or any save before `load` returns, can write an unconfirmed or cached value; a later rollback leaves the document and the screen apart (unverified severity: medium, rare).
- source_spec: `_bmad-output/implementation-artifacts/spec-1-10-choose-an-accent-color.md`
  summary: Decide whether an Account without a saved accent should fall back to violet instead of inheriting the previous user's cached accent (and Language).
  evidence: `reset()` leaves accent and Language untouched by design, so a second user with no saved value keeps the first user's and the next save writes it (unverified severity: medium on shared devices).

- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-load-the-entries-into-the-app.md`
  summary: Make `EntryStore.save` and `remove` refuse or merge when called while `status` is not `ready`.
  evidence: A write confirmed during the initial read is replaced by the load snapshot (unverified severity: medium); Story 2.2's form must gate on `ready`, which hides it today.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-load-the-entries-into-the-app.md`
  summary: Put a timeout on the initial `getDocs` so an offline stalled read reaches `error` and Retry.
  evidence: Writes have a 10 s race but the read does not; Today could stay on the skeleton (unverified severity: medium; settle with an offline run).

- source_spec: `_bmad-output/implementation-artifacts/spec-2-3-never-lose-typed-values-when-a-save-fails.md`
  summary: Track a timed-out delete in `EntryStore.remove` and clear the timeout mark there, as `save` does (Story 2.9).
  evidence: `remove` ignores the timed-out Day set, so a delete that timed out can still commit and a later write for that Day is not re-read first (unverified severity: medium; Story 2.9 owns delete failure).
- source_spec: `spec-4-3-compare-the-three-dimensions-on-one-chart.md`
  summary: On the combined Report chart at 360 px and 768 px, the "kg" axis title overlaps the "87,00" tick label and the "Umore" axis title overlaps the right-hand ticks.
  evidence: Browser check in this session (Report inside a 360 px and a 768 px frame, signed in as the test account). Not fixed here: owned by the chart stories.
- source_spec: `spec-4-2-see-each-dimension-on-its-own-chart-with-dashed-gaps.md`
  summary: The Mood axis on the combined chart is drawn at 0 to 1 with no data when the Range has only Weight, so empty axes show next to the Weight line.
  evidence: Browser check, 1280 px, 30 d Range with only Weight entries. The 4.3 spec allows datasets with no bounds; a reader may still find the empty axes confusing.
- source_spec: `spec-5-1-operate-the-whole-app-with-keyboard-and-screen-reader.md`
  summary: The Today week card says "1 giorni su 7 registrati" (plural with a singular count).
  evidence: Browser check, Today at 1280 px. The copy comes from the Today stories, not from 5.1.
