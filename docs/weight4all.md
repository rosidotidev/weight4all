# Weight4All — Project Overview and BMad Method Approach

This document is the **overview**: what Weight4All is, how the BMad Method is used on it, and how the project is split into features. It contains **no step-by-step commands**. The exact commands, with the exact text to pass as argument, live in the files linked below — follow them in order.

> Sources: official documentation (https://docs.bmad-method.org/ — *Choose a Planning Path*, *Define Requirements and a Specification*, *Design UX and Architecture*, *Build a Change*, *Finish an Epic*, *Skills and Agents*) and the `SKILL.md` files / `_bmad/_config/bmad-help.csv` of the version **installed in this repo: BMad 6.12.4** (modules `core`, `bmm`, `bmb`).

---

## 1. The product

**Weight4All** is an **adaptive** web app (desktop, tablet, mobile) with a polished, modern look. Every day the user records:

| Data | Constraints |
|---|---|
| Weight | number (kg), one per day |
| Emotional level | integer from **1 to 10** |
| Hours slept | number (hours), one per day |

A **Report** tab charts the trend of the three values over time.

Platform: a responsive **web app** reached by its address, one codebase for desktop, tablet and mobile. Decided in the PRD: no installable-app (PWA) behavior, no offline use and no data export in v1; revisit after v1 if daily use shows the need.

---

## 2. How BMad is used here

We follow the BMad **full path** (project-sized work): analysis → planning → epics/stories → build loop per feature → retrospective.

```
PLANNING (done once, product-wide)        → docs/planning.md
  A  Analysis            (optional)
  B  Brief → PRD → UX → Architecture
  C  Epics & stories → readiness check → sprint status

BUILD (repeated per feature = one Epic)   → docs/features/feature-NN-*.md
  per story:  /bmad-build → review → QA tests
  per epic:   /bmad-retrospective

CLOSURE                                   → end of feature-04 file
```

### Version note

The online docs describe a newer BMad (Product Owner agent "Sofia" `bmad-agent-po`, ticket tree `tickets.toml`). **This repo has BMad 6.12.4**, which has no `bmad-agent-po`: epics/stories are produced by `bmad-create-epics-and-stories` and tracked by `bmad-sprint-planning` (`sprint-status.yaml`). All instruction files use **the commands actually installed**. To move to the newer version, run `/bmad` or `/bmad-help` and follow the update instructions.

### Working rules (valid for every instruction file)

1. Skills are Claude Code slash commands: `/<skill-name> <free-text argument>`. Almost none have flags; the argument is free text, a file path, or a story reference. Real, verified flags/arguments are used only where they exist (`-H <epic>` for `bmad-retrospective`; intents `setup | adopt | refresh | record | audit` for `bmad-project-context`; intents *create / update / validate* for the planning skills).
2. **Use a fresh chat (`/clear`) for every planning skill and every `bmad-build`.** The context is the file produced, not the conversation.
3. Planning skills ask for an **intent** (create / update / validate) and a **path**: **Fast** (full draft with `[ASSUMPTION]` tags) or **Coaching** (guided questions). The instruction files say which to answer.
4. Every planning artifact is **validated** before moving to the next phase.
5. Output locations (from `_bmad/bmm/config.yaml`): planning → `_bmad-output/planning-artifacts/`, implementation → `_bmad-output/implementation-artifacts/`, project docs → `docs/`.
6. If lost at any time: `/bmad-help <your question>`.

---

## 3. Project breakdown

The project is split into **a planning phase + 5 features**. Each feature is **one Epic** in `epics.md`. The order is binding: each feature builds on the previous one.

| Step | Name | What it delivers | Depends on | Instructions |
|---|---|---|---|---|
| — | **Planning** | Brief, PRD, UX (`DESIGN.md` + `EXPERIENCE.md`), architecture, epics & stories, sprint status | — | [planning.md](planning.md) |
| F0 | **Foundations and adaptive shell** (Epic 1, 10 stories) | Project and quality gate, Firebase with security rules, IT/EN dictionary, M3 theme, register/login/reset, four-tab adaptive shell, Language and accent | Planning | [features/feature-00-fondazioni.md](features/feature-00-fondazioni.md) |
| F1 | **Daily weight entry** (Epic 2, 10 stories) | Weight by date, Happy effect, Missing-entry sign, History, edit/add/delete, "This week"; introduces the Entry, its store and its form | F0 | [features/feature-01-peso.md](features/feature-01-peso.md) |
| F2 | **Emotional level and sleep hours** (Epic 3, 3 stories) | Mood 1–10 (faces) and sleep hours (slider, default 6.0 h) added to the daily entry | F1 | [features/feature-02-umore-sonno.md](features/feature-02-umore-sonno.md) |
| F3 | **Report tab with charts** (Epic 4, 5 stories) | Range, Statistics, per-Dimension and combined charts, dashed gaps, adaptive view | F2 | [features/feature-03-report.md](features/feature-03-report.md) |
| F4 | **Polish and quality** (Epic 5, 6 stories) | Accessibility, layout across devices and browsers, performance, key journeys end to end, safe release, closure | F3 | [features/feature-04-rifinitura.md](features/feature-04-rifinitura.md) |

Notes:
- Weight, mood and sleep are three values of the **same daily entry**. F1 introduces the model, F2 extends it. The architecture (planning step B4) must fix this so both features stay consistent.
- Epic and story numbers in the feature files match `epics.md` (34 stories: 10 + 10 + 3 + 5 + 6), aligned on 2026-10-20. After planning step C3, check `sprint-status.yaml` still agrees.

---

## 4. Progress checklist

- [ ] Planning (A optional, B1–B4, C1–C3) — [planning.md](planning.md)
- [ ] F0 — Foundations and adaptive shell
- [ ] F1 — Daily weight entry
- [ ] F2 — Emotional level and sleep hours
- [ ] F3 — Report tab with charts
- [ ] F4 — Polish and quality + closure
