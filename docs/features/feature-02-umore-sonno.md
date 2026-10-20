# Feature 2 — Emotional Level and Sleep Hours (Epic 3)

Overview: [../weight4all.md](../weight4all.md) · Previous: [feature-01-peso.md](feature-01-peso.md) · Next: [feature-03-report.md](feature-03-report.md)

**Prerequisite:** Feature 1 closed.
**Goal:** extend the same Entry with an optional **Mood level (integer 1–10, emoji faces)** and optional **Sleep hours (0–24, half-hour steps, default 6.0 h)**. The data format must be stable at the end of this feature: Feature 3 reads it.
**Source of truth:** `_bmad-output/planning-artifacts/epics.md` (Epic 3, 3 stories). No data migration is needed: Mood and Sleep are new optional fields (NFR-2), and the Dimension registry means forms, History and the "This week" card pick them up.

Each command goes in a **fresh chat** (`/clear` first). Confirm story numbers in `sprint-status.yaml`.

---

## Step 0 — Check that the documents agree (otherwise skip)

The PRD must already say Sleep defaults to 6.0 h (done with the PRD update before sprint planning). If not:
```
/bmad-prd update the PRD at <prd path>: sleep defaults to 6.0 h; the user empties it with the clear control
```

## Step 1 — Build the stories (in order)

| Story | Command | Delivers |
|---|---|---|
| 3.1 | `/bmad-build story 3.1` | Mood faces: radio group, tap again to clear, rules vectors (FR-15) |
| 3.2 | `/bmad-build story 3.2` | Sleep slider: default 6.0 h, clear "x", rules vectors (FR-16) |
| 3.3 | `/bmad-build story 3.3` | All three values in History, Entry edit and "This week" (FR-17) |

Optional after each build: `/bmad-code-review`.

## Step 2 — End-to-end tests

```
/bmad-qa-generate-e2e-tests entering weight, mood 1-10 and sleep hours in the daily entry: untouched sleep saves 6.0 h, clearing mood and sleep, boundary values (mood 1 and 10, sleep 0 and 24), invalid values, editing from History, weight-only entry shown with dashes, and persistence after reload
```

## Step 3 — Status

```
/bmad-sprint-planning show sprint status
```

## Step 4 — Close the epic

```
/bmad-retrospective 3
```

---

## Done when

- Mood accepts only integers 1–10; Sleep only 0–24 in half hours; both persist and can be cleared.
- Existing Feature 1 entries are intact and show em dashes for absent values, never 0.
- Retrospective closed; data format stable.
