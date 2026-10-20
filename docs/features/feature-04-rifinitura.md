# Feature 4 — Polish and Quality (Epic 5) + Closure

Overview: [../weight4all.md](../weight4all.md) · Previous: [feature-03-report.md](feature-03-report.md)

**Prerequisite:** Feature 3 closed.
**Goal:** release-level quality: WCAG 2.1 AA accessibility, verified layout on three screen sizes and four browsers in both Languages, the performance budget, the three key journeys end to end, and a safe release. Offline use, installable-app behavior and data export are **not** in v1 (PRD §5).
**Source of truth:** `_bmad-output/planning-artifacts/epics.md` (Epic 5, 6 stories).

Each command goes in a **fresh chat** (`/clear` first). Confirm story numbers in `sprint-status.yaml`.

---

## Step 1 — Build the stories (in order)

| Story | Command | Delivers |
|---|---|---|
| 5.1 | `/bmad-build story 5.1` | Keyboard, screen reader, focus, live region, reduced motion, axe in Playwright (FR-25) |
| 5.2 | `/bmad-build story 5.2` | Never color alone: numbers, markers, dashes, tables, accent contrast audit (FR-25) |
| 5.3 | `/bmad-build story 5.3` | Layout at 360/768/1280 px, four browsers, both Languages (FR-26) |
| 5.4 | `/bmad-build story 5.4` | Performance budget: Today within 3 s, Range switch within 1 s at 365 entries (FR-27) |
| 5.5 | `/bmad-build story 5.5` | The three journeys UJ-1, UJ-2, UJ-3 end to end, plus network-cut retry |
| 5.6 | `/bmad-build story 5.6` | `npm run deploy`, release checklist, rollback walkthrough, PRD validated against the build |

## Step 2 — Review the whole product

```
/bmad-review <path or branch of the full implementation>
/bmad-code-review
```

## Step 3 — Full end-to-end suite

```
/bmad-qa-generate-e2e-tests complete flows on mobile, tablet and desktop in English and Italian: daily entry of weight, mood and sleep; edit and delete from History; Report charts and Range selection
```

## Step 4 — Close the epic

```
/bmad-retrospective 5
```

## Step 5 — Project closure

```
/bmad-sprint-planning show sprint status
/bmad-project-context refresh
/bmad-prd validate the PRD at <prd path> against what was built
```
Reconcile PRD and architecture with the delivered product (`/bmad-prd update …`, `/bmad-architecture update …`) if they diverged.

---

## Done when

- No blocking accessibility defects on the main flows; performance budget met or documented.
- `npm run deploy` works and the rollback has been walked through once.
- Retrospective closed; PRD and architecture reconciled with what was built.
