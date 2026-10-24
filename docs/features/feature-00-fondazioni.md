# Feature 0 — Foundations and Adaptive Shell (Epic 1)

Overview: [../weight4all.md](../weight4all.md) · Previous: [../planning.md](../planning.md) · Next: [feature-01-peso.md](feature-01-peso.md)

**Prerequisite:** planning complete (readiness **PASS**, `sprint-status.yaml` exists, `AGENTS.md` block created).
**Goal:** a project with no daily-entry features yet but a complete skeleton: pinned Angular stack with the quality gate, Firebase with security rules, IT/EN dictionary, M3 theme, register/login/reset, four-tab adaptive shell, Language and accent in Settings.
**Source of truth:** `_bmad-output/planning-artifacts/epics.md` (Epic 1, 10 stories). Acceptance criteria live there; the commands below only point at the story.

Each command goes in a **fresh chat** (`/clear` first). Confirm story numbers in `_bmad-output/implementation-artifacts/sprint-status.yaml`.

---

## Step 1 — Build the stories (in order)

| Story | Command | Delivers |
|---|---|---|
| 1.1 | `/bmad-build story 1.1` | Angular 22 project, pinned stack, ESLint architecture rules, `npm run check` and `deploy` scripts, version control |
| 1.2 | `/bmad-build story 1.2` | Firebase connection (emulator for `local`), `firestore.rules`, rules tests (FR-4) |
| 1.3 | `/bmad-build story 1.3` | `strings.ts` typed IT/EN dictionary, Language signal, template-scan test |
| 1.4 | `/bmad-build story 1.4` | Material 3 theme and design tokens, default accent, chart color tokens |
| 1.5 | `/bmad-build story 1.5` | Register (FR-1) |
| 1.6 | `/bmad-build story 1.6` | Log in, stay logged in, log out; session scope and route guard (FR-2) |
| 1.7 | `/bmad-build story 1.7` | Reset password (FR-3) |
| 1.8 | `/bmad-build story 1.8` | Four-tab adaptive shell: bottom bar / rail / drawer (FR-5) |
| 1.9 | `/bmad-build story 1.9` | Language in Settings, persisted in preferences, Account card (FR-28) |
| 1.10 | `/bmad-build story 1.10` | Six accent colors, contrast test, persistence (FR-6) |

Optional after each build: `/bmad-code-review` · `/bmad-walkthrough`.

## Step 2 — End-to-end tests

```
/bmad-qa-generate-e2e-tests register, log in, log out, reset-password screen, switching between the four tabs, Language switch, accent switch, and layout at 360, 768 and 1280 px
```

## Step 3 — Status

```
/bmad-sprint-planning show sprint status
```

## Step 4 — Close the epic

```
/bmad-retrospective 1
```
Verdict is `accepted`, `accepted-with-open-items` or `rejected`. Carry open items into Feature 1.

## Step 5 — Refresh repo context (the stack now exists)

```
/bmad-project-context refresh
```

---

## Change requests (after the epic)

**CR-1 — Logout and navigation icon** (implemented, commit `9c88b93`): the logout action (exit icon) is always at the top right of every logged-in screen. The top-left element shows the icon of the active tab, the same symbol as the bottom navigation, shown slightly larger. Tabs and the layout per screen size are unchanged. Build with `/bmad-build CR-1` (text in [../cr-set-1.md](../cr-set-1.md)).

## Done when

- `npm run check` passes and is documented in `AGENTS.md`.
- Rules tests prove one Account cannot touch another's data.
- Layout verified at 360, 768 and 1280 px; Language and accent persist across sessions.
- Retrospective closed.
