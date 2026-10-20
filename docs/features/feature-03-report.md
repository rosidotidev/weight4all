# Feature 3 — Report Tab with Charts (Epic 4)

Overview: [../weight4all.md](../weight4all.md) · Previous: [feature-02-umore-sonno.md](feature-02-umore-sonno.md) · Next: [feature-04-rifinitura.md](feature-04-rifinitura.md)

**Prerequisite:** Feature 2 closed (stable data format).
**Goal:** the Report tab shows Weight, Mood and Sleep over a selected Range: Statistics, one chart per Dimension, one combined chart, dashed lines over gaps, friendly empty states, adaptive layout.
**Source of truth:** `_bmad-output/planning-artifacts/epics.md` (Epic 4, 5 stories). Charting decisions are already made (Chart.js 4.5.1 + ng2-charts 11.0.0, AD-6); no research step is needed.

Each command goes in a **fresh chat** (`/clear` first). Confirm story numbers in `sprint-status.yaml`.

---

## Step 1 — Build the stories (in order)

| Story | Command | Delivers |
|---|---|---|
| 4.1 | `/bmad-build story 4.1` | Range chips (7 d, 30 d, 90 d, 1 y, All; default 30 d) and Statistics; extends `stats.ts` (FR-18, FR-21) |
| 4.2 | `/bmad-build story 4.2` | One chart per Dimension, dashed over gaps, markers, lazy-loaded Chart.js (FR-20, FR-22) |
| 4.3 | `/bmad-build story 4.3` | Combined chart with three independent y axes (FR-19) |
| 4.4 | `/bmad-build story 4.4` | Empty and sparse states, Retry on failed load (FR-23) |
| 4.5 | `/bmad-build story 4.5` | Layout for compact, medium, expanded; "Show data as table"; a year of data without freeze (FR-24) |

## Step 2 — Human review of the visual part

```
/bmad-walkthrough
```
Optional: `/bmad-code-review`.

## Step 3 — End-to-end tests

```
/bmad-qa-generate-e2e-tests Report tab: with a known dataset verify the weight, mood and sleep charts and the Statistics; change the Range and see all charts update together; handle an empty dataset, a single entry and missing days (dashed); check 360, 768 and 1280 px
```

## Step 4 — Status

```
/bmad-sprint-planning show sprint status
```

## Step 5 — Close the epic

```
/bmad-retrospective 4
```

---

## Done when

- The three charts and the Statistics reflect the saved data, including gaps, one entry and an empty dataset.
- Verified at 360, 768 and 1280 px.
- Retrospective closed.
