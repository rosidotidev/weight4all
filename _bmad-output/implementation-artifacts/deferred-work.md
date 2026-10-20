
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
