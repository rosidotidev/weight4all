
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
