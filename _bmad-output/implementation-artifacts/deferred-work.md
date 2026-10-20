
- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-create-the-angular-project-with-the-quality-gate.md`
  summary: Add lint fixtures for domain purity (rxjs, zone.js imports and DOM globals beyond window).
  evidence: Verification-gap review found removal of those ban entries would not fail any test; low severity.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-create-the-angular-project-with-the-quality-gate.md`
  summary: Run rules tests through `firebase emulators:exec` when the first rules test lands (Story 1.2).
  evidence: `scripts/test-rules.mjs` runs plain vitest, which cannot reach a Firestore emulator; unverified until tests exist.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-create-the-angular-project-with-the-quality-gate.md`
  summary: Make `npm run deploy` build and deploy rules then Hosting once `firebase.json` exists.
  evidence: Currently `check && firebase deploy`; no firebase.json or build step until Story 1.2 / 5.6.
