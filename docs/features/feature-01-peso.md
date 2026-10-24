# Feature 1 — Daily Weight Entry (Epic 2)

Overview: [../weight4all.md](../weight4all.md) · Previous: [feature-00-fondazioni.md](feature-00-fondazioni.md) · Next: [feature-02-umore-sonno.md](feature-02-umore-sonno.md)

**Prerequisite:** Feature 0 closed (retrospective done).
**Goal:** Bob logs his Weight for each day, gets a warm response, sees when today is missing, browses History, and edits, adds or deletes any day. Introduces the daily Entry and its form that Feature 2 extends.
**Source of truth:** `_bmad-output/planning-artifacts/epics.md` (Epic 2, 10 stories).

Each command goes in a **fresh chat** (`/clear` first). Confirm story numbers in `sprint-status.yaml`.

---

## Step 0 — Only if Feature 0 changed a decision (otherwise skip)

```
/bmad-architecture update the architecture at <architecture path>: <what changed>
/bmad-correct-course <description of the change>
```

## Step 1 — Build the stories (in order)

| Story | Command | Delivers |
|---|---|---|
| 2.1 | `/bmad-build story 2.1` | `day.ts`, `ClockService`, `entry.ts`, Dimension registry (Weight), `EntryStore` with skeleton loading |
| 2.2 | `/bmad-build story 2.2` | `EntryFormComponent`, `DraftStore`, Today Weight card, validation, save (FR-7) |
| 2.3 | `/bmad-build story 2.3` | Failed save is never silent: error codes, timeout, retry (FR-14) |
| 2.4 | `/bmad-build story 2.4` | Weight pre-fill, plus/minus 0.1 kg, decimal comma or point (FR-8) |
| 2.5 | `/bmad-build story 2.5` | Missing-entry sign (FR-10) |
| 2.6 | `/bmad-build story 2.6` | Happy effect (FR-9) |
| 2.7 | `/bmad-build story 2.7` | History list with missing-day rows, virtual scroll (FR-11) |
| 2.8 | `/bmad-build story 2.8` | Edit an entry or add a forgotten day (FR-12) |
| 2.9 | `/bmad-build story 2.9` | Delete with confirmation (FR-13) |
| 2.10 | `/bmad-build story 2.10` | "This week" card and last 5 Entries on wide screens; creates `stats.ts` with `average` (FR-29) |

Optional after each build: `/bmad-code-review`.

## Step 2 — End-to-end tests

```
/bmad-qa-generate-e2e-tests entering, editing and deleting the daily weight: enter weight on Today, see the Happy effect, edit a past day from History, add a missing day, delete after confirmation, reload and verify the data persists; verify only one entry per day and the Missing-entry sign
```

## Step 3 — Status

```
/bmad-sprint-planning show sprint status
```

## Step 4 — Close the epic

```
/bmad-retrospective 2
```

---

## Change requests (after the epic)

**CR-2 — Weight jump warning** (in review, not yet committed): when a saved weight is more than 1% above the most recent earlier Entry, the save still succeeds and a warning (not an error) tells the user to pay attention to what they eat, in Italian and English.

- **Today:** the Happy card for a gain shows an amber face in place of the check and a solid amber pill with the warning. The face and the pill appear once and stay; with reduced motion they appear without animation.
- **Past Days (History):** the edit dialog closes, then a snackbar shows the same warning, with a dismiss action.
- **No warning** when there is no earlier Entry, when the change is exactly 1% or less, or when the weight went down. A decrease keeps its current Happy card.

Build with `/bmad-build CR-2` (text in [../cr-set-1.md](../cr-set-1.md)).

## Done when

- Weight is saved, edited, deleted and persists after reload; one Entry per day, covered by tests.
- Failed saves keep the typed values and say so.
- Correct layout on compact, medium and expanded windows.
- Retrospective closed; open items carried into Feature 2.
