# Planning — Exact BMad Commands (done once, before any feature)

Back to the overview: [weight4all.md](weight4all.md)

## STATO ATTUALE (aggiornato 2026-10-20) — RIPARTI DA QUI

**Fatto ✅:** A1 brainstorm · B1 brief · B2 PRD · B3 UX · B4 architettura (creata, validata, corretta) · C1 epics e storie (`epics.md`, 5 epiche, **34 storie**) · C2 prima esecuzione: **CONCERNS**, correzioni applicate (vedi sotto).

**Correzioni applicate dopo C2 (2026-10-20):**
- `epics.md`: nuova storia 1.4 (tema M3 e token, prima delle schermate); 2.1 divisa in 2.1 (dominio e store) e 2.2 (form Today con `EntryFormComponent`, `DraftStore`, salvataggio); `stats.ts` nasce in 2.10 con `average` e la 4.1 lo estende; AC di 5.6 sul PRD aggiornato. Numerazione: Epica 1 = 10 storie, Epica 2 = 10, Epica 3 = 3, Epica 4 = 5, Epica 5 = 6.
- `docs/features/feature-00…04-*.md` e `weight4all.md` riscritti dalle storie reali: niente più PWA, offline, export.

**C2.1 ✅ FATTO (2026-10-20):** PRD aggiornato con `/bmad-prd update` (versione leggera: niente reviewer né polish, `status` resta `final`).
- Sonno: il controllo parte da 6,0 h per ogni giorno senza Entry; un salvataggio senza toccarlo registra 6,0 h; il tasto "x" lo svuota. Modificati FR-16, FR-17, UJ-1 (caso limite), Glossario, descrizione F2, indice assunzioni.
- Range: l'intervallo personalizzato è rimandato oltre la v1 (restano 7 g, 30 g, 90 g, 1 a, Tutto; predefinito 30 g). Modificati FR-18, indice assunzioni, §6.2 Out of Scope.
- Decisioni registrate nel `.memlog.md` del PRD.

**C2.2 ✅ FATTO (2026-10-20):** controllo di prontezza rilanciato → **PASS**. C2 chiuso.

**C3 ✅ FATTO (2026-10-20):** `/bmad-sprint-planning run sprint planning` → creato `_bmad-output/implementation-artifacts/sprint-status.yaml`: 5 epiche, 34 storie, 5 retrospettive (opzionali), 44 voci in tutto; le 39 tra epiche e storie sono in `backlog`. Nessun orfano, nessuno stato illegale.

**Prossimo passo ➡️ C4 — contesto del repo** (chat nuova, `/clear` prima):
```
/bmad-project-context setup
```
Poi si entra nel ciclo di costruzione: vedi **Phase D** in fondo a questo file (34 comandi `/bmad-build story N.M`, in ordine).

**Dove sono i file** (tutti sotto `_bmad-output/planning-artifacts/`):
- PRD: `prds/prd-bmad612_home-2026-10-19/prd.md`
- UX: `ux-designs/ux-bmad612_home-2026-10-19/` (`DESIGN.md`, `EXPERIENCE.md`)
- Architettura: `architecture/architecture-bmad612_home-2026-10-19/` — `ARCHITECTURE-SPINE.md` (contratto, AD-1…AD-15), `SOLUTION-DESIGN.md` (spiegazione, italiano), `SOLUTION-DESIGN.pptx` (inglese), `reviews/VALIDATION-REPORT.html`
- Epiche e storie: `epics.md`

**Decisioni prese (non rimetterle in discussione):** Angular 22.2 (CLI locale, Material 22.2.3, TypeScript ~6.0.3) · Firestore con un documento per giorno `users/{uid}/entries/AAAA-MM-GG`, campi separati `weight`/`mood`/`sleep` · SDK `firebase` 12.19.0 usato direttamente (niente `@angular/fire`) · Chart.js 4.5.1 + ng2-charts 11.0.0 · testi IT/EN in un solo file `strings.ts` · **sonno predefinito 6,0 h ovunque** · **niente PWA, offline o export in v1** · test a tre livelli (Vitest, emulatore Firebase per le regole, Playwright) · ambienti: local (emulatore) e prod, rilascio manuale con `npm run deploy`.

**Cose rimaste in sospeso (non bloccanti):**
- `SOLUTION-DESIGN.md` e il `.pptx` sono un po' indietro rispetto allo spine (mancano `core/state`, AD-15, `npm run check`). Lo spine vince in caso di divergenza.
- Lo spine corretto dopo la validazione non è stato rivalidato da un revisore indipendente.
- Le stringhe italiane marcate `[ASSUMPTION]` in `EXPERIENCE.md` vanno confermate da te.
- Storia 5.4 (performance) è ampia: spezzarla solo se in build risulta troppo grande.

---

Run the steps **in order**, each in a **fresh chat** (`/clear` first). Text in code blocks is the exact command with the argument to pass. `<…>` marks a path you must fill in with the file the previous step created (look in `_bmad-output/planning-artifacts/`).

When a skill asks a question, use the "When asked" answers listed under the step.

---

## Flow at a glance

```
A1 brainstorm ──► B1 product brief ──► B2 PRD ──► B3 UX ──► B4 architecture ──► C1 epics & stories ──► C2 readiness ──► C3 sprint status ──► C4 project context
   ✅ done           ✅ done           ✅ done     ✅ done    ✅ done (validated)    ✅ done               ✅ C2 PASS (dopo fix, C2.1, C2.2)   ✅ C3 done   ➡️ C4 next
```

| Step | Skill | Takes as input | Produces |
|---|---|---|---|
| A1 ✅ | `bmad-brainstorming` | the idea | `brainstorm-intent.md` |
| B1 ✅ | `bmad-product-brief` | `brainstorm-intent.md` | product brief |
| B2 ✅ | `bmad-prd` | brief + `brainstorm-intent.md` | PRD |
| B3 ✅ | `bmad-ux` | PRD | `DESIGN.md` + `EXPERIENCE.md` |
| B4 ✅ | `bmad-architecture` | PRD + `DESIGN.md` + `EXPERIENCE.md` | architecture |
| C1 ✅ | `bmad-create-epics-and-stories` | PRD + UX + architecture | `epics.md` |
| C2 ✅ | `bmad-sprint-planning` (readiness) | all of the above | PASS / CONCERNS / FAIL. 1st run: CONCERNS, fixes applied 2026-10-20 |
| C2.1 ✅ | `bmad-prd` (update) | PRD | PRD aligned with spine and epics (Sleep 6.0 h, custom Range deferred) |
| C2.2 ✅ | `bmad-sprint-planning` (readiness, re-run) | all of the above | PASS, closes C2 |
| C3 ✅ | `bmad-sprint-planning` (sprint planning) | `epics.md` | `sprint-status.yaml` (5 epics, 34 stories) |
| C4 ➡️ | `bmad-project-context` (setup) | the repo | `AGENTS.md` block |

**Note on B3:** the shortest flow is A1 → B1 → B2 → B4, but **B3 (UX) is in the flow on purpose**: this app depends heavily on its look and behavior (single-screen entry with emoji faces and sliders, happy feedback effect, combined and per-dimension charts, adaptive layout), and `bmad-ux` is strongly recommended when the UI is a major part of the project. B4 also reads `DESIGN.md` and `EXPERIENCE.md`. Skip B3 only if you accept designing those details later, during the builds.

Run each step in a fresh chat (`/clear`), and validate each document before moving to the next step.

---

## Phase A — Analysis (optional)

Skip all of A if you want to go faster; A3 alone is the most useful single step.

**A1 — Brainstorm** ✅ **DONE (2026-10-19)**
Output already in the repo: `_bmad-output/brainstorming/brainstorm-weight4all-2026-10-19/` — `brainstorm-intent.md` (decisions + ideas, used as input from B1 on) and `.memlog.md` (full session record). Do not re-run unless you want a new session.
Command used, for reference:
```
/bmad-brainstorming Weight4All: an adaptive web app to log daily weight, emotional level (1-10) and hours slept, with a Report tab that charts them. Explore features, UX ideas and data-visualization ideas.
```
Output: `_bmad-output/brainstorming/…`

**A2 — Pressure-test the idea**
```
/bmad-forge-idea Weight4All: a personal daily tracker for weight, mood (1-10) and sleep hours with a Report tab of charts, as a responsive web app/PWA.
```
Output: `forge-<slug>.md` (only if the idea hardens).

**A3 — Competitive research**
```
/bmad-deep-recon competitive: apps that track daily weight, mood and sleep (e.g. Libra, Happy Scale, Daylio, Bearable). What do they do well, what is missing, what makes charts and daily entry pleasant on mobile?
```
Output: `_bmad-output/planning-artifacts/research/research-<topic>.md`

---

## Phase B — Product-wide planning

### B1 — Product brief

```
/bmad-product-brief Create a product brief for Weight4All, an adaptive web app (desktop, tablet, mobile) with a beautiful modern look. Use the brainstorming result at _bmad-output/brainstorming/brainstorm-weight4all-2026-10-19/brainstorm-intent.md as the main input and treat its "Decisions" table as settled (Firebase Authentication for login, data on Firebase, in-app missing-entry sign instead of notifications, dashed line over missing days in charts, no data export, accent colors chosen from a small palette). Each day the user records: (1) body weight in kg, (2) emotional level as an integer from 1 to 10, (3) hours slept. A Report tab shows one combined chart of the three values plus dedicated charts per dimension, with date-range filters and statistics. Goals: learn the BMad Method by building a real app, and have a personal tracker usable from any device. Success: entering a day takes under 30 seconds and the Report is readable on phone, tablet and desktop.
```
**When asked:** intent → **create**; path → **Fast** (or Coaching if you want to refine). Treat the "Ideas offered by the coach" section of the intent file as candidates: accept, change or drop each one.
**Then validate** (fresh chat):
```
/bmad-product-brief validate the brief at <brief path>
```

### B2 — PRD

```
/bmad-prd Create the PRD for Weight4All using the brief at <brief path> and the brainstorming intent at _bmad-output/brainstorming/brainstorm-weight4all-2026-10-19/brainstorm-intent.md. Already decided: Firebase Authentication login, data on Firebase, in-app missing-entry sign (no email/push), dashed line over missing days, no export, accent color palette. Features in order: (F0) foundations and adaptive shell with Today/History/Report tabs; (F1) daily weight entry with edit/delete and history; (F2) emotional level 1-10 and hours slept added to the daily entry; (F3) Report tab with charts of weight, mood and sleep over time with range selection; (F4) polish: PWA installability, offline, accessibility, performance. Platforms: desktop, tablet and mobile with adaptive layout.
```
**When asked:** intent → **create**; path → **Coaching** → entry point **Vision + Features**. Settle explicitly: one entry per day (yes/no), are all three values required, mood scale 1–10 integers only, sleep format (hours with .5 steps or minutes), units (kg only or kg/lb), user accounts (yes/no), data location (local only vs backend), data export (in/out of scope).
**Then validate** (fresh chat):
```
/bmad-prd validate the PRD at <prd path>
```
Fix findings with `/bmad-prd update the PRD at <prd path>: <what to change>`.

### B3 — UX (look and behavior)

```
/bmad-ux Create the UX documents for Weight4All from the PRD at <prd path>. The app must look beautiful and modern and be fully adaptive: bottom tab bar on mobile, side navigation on tablet/desktop; tabs Today, History, Report. Needs: a fast daily entry form (weight, mood 1-10 control, hours slept), a clear history list, and readable charts with range selection on every screen size. Include light and dark themes, accessible color choices for charts, empty/error states, and touch-friendly controls.
```
**When asked:** intent → **create**; path → **Coaching** for a polished result (Fast if short on time).
Outputs: `DESIGN.md` (how it looks) and `EXPERIENCE.md` (how it behaves).
**Then validate** (fresh chat):
```
/bmad-ux validate the UX documents at <ux folder>
```

### B4 — Architecture

```
/bmad-architecture Create the architecture for Weight4All from the PRD at <prd path>, DESIGN.md and EXPERIENCE.md at <ux folder>. Already decided (do not reopen): web app in the browser, Firebase Authentication for login, data stored on Firebase. Decide: Firestore vs Realtime Database, per-user security rules, offline persistence, Firebase Hosting; front-end framework and build tooling; the "daily entry" data model with weight, mood 1-10 and sleep hours (one entry per day, extended across features F1 and F2); charting library for the Report tab; responsive/layout approach and design-token strategy; testing strategy (unit + end-to-end); offline behavior.
```
**When asked:** intent → **create**; path → **Coaching** (you choose between the alternatives it shows).
**Then validate** (fresh chat):
```
/bmad-architecture validate the architecture at <architecture path>
```

---

## Phase C — Epics, stories and sprint planning

### C1 — Epics and stories

```
/bmad-create-epics-and-stories Create the epics and stories list from the PRD, UX documents and architecture. Create exactly five epics, in this order, one per feature: Epic 1 Foundations and adaptive shell; Epic 2 Daily weight entry; Epic 3 Emotional level and sleep hours; Epic 4 Report tab with charts; Epic 5 Polish and quality. Every story needs acceptance criteria.
```
Output: `epics.md`. **Check the epic/story numbers** and align the feature files if they differ.

### C2 — Readiness check

```
/bmad-sprint-planning check implementation readiness
```
Expected: **PASS**. On **FAIL/CONCERNS**: fix the planning documents (`/bmad-prd`, `/bmad-ux`, `/bmad-architecture` with intent update, or `/bmad-create-epics-and-stories` again) and re-run C2. If something major changes later: `/bmad-correct-course <description of the change>`.

### C3 — Sprint status file

```
/bmad-sprint-planning run sprint planning
```
Output: `_bmad-output/implementation-artifacts/sprint-status.yaml`.

### C4 — Repo context (before the first build)

```
/bmad-project-context setup
```
Output: `AGENTS.md` managed block. It is refreshed after Epic 1 (see the Feature 0 file).

---

## Phase D — Build loop (34 stories, in order)

`/bmad-build` does **not** pick the next story by itself: you give it the story number each time. It then updates `sprint-status.yaml` (`in-progress` while working, `review` when done). Run **one story per fresh chat** (`/clear` first), strictly in order: each story depends only on earlier ones. The story list per epic, with what each one does, is in the matching `features/feature-0N-*.md`.

Per story: `/bmad-build story N.M` → optional `/bmad-code-review` → optional `/bmad-qa-generate-e2e-tests`.
Per epic (optional): `/bmad-retrospective N`. After Epic 1 and Epic 5: `/bmad-project-context refresh`.

### Epic 1 — Foundations and adaptive shell (10 stories)
```
/bmad-build story 1.1
/bmad-build story 1.2
/bmad-build story 1.3
/bmad-build story 1.4
/bmad-build story 1.5
/bmad-build story 1.6
/bmad-build story 1.7
/bmad-build story 1.8
/bmad-build story 1.9
/bmad-build story 1.10
/bmad-retrospective 1
/bmad-project-context refresh
```

### Epic 2 — Daily weight entry (10 stories)
```
/bmad-build story 2.1
/bmad-build story 2.2
/bmad-build story 2.3
/bmad-build story 2.4
/bmad-build story 2.5
/bmad-build story 2.6
/bmad-build story 2.7
/bmad-build story 2.8
/bmad-build story 2.9
/bmad-build story 2.10
/bmad-retrospective 2
```

### Epic 3 — Emotional level and sleep hours (3 stories)
```
/bmad-build story 3.1
/bmad-build story 3.2
/bmad-build story 3.3
/bmad-retrospective 3
```

### Epic 4 — Report tab with charts (5 stories)
```
/bmad-build story 4.1
/bmad-build story 4.2
/bmad-build story 4.3
/bmad-build story 4.4
/bmad-build story 4.5
/bmad-retrospective 4
```

### Epic 5 — Polish and quality (6 stories)
```
/bmad-build story 5.1
/bmad-build story 5.2
/bmad-build story 5.3
/bmad-build story 5.4
/bmad-build story 5.5
/bmad-build story 5.6
/bmad-retrospective 5
/bmad-project-context refresh
```

Check progress any time (fresh chat): `/bmad-sprint-planning show sprint status`.

---

## Done when

- Brief, PRD, UX documents and architecture exist and are **validated**.
- `epics.md` has 5 epics matching F0–F4.
- Readiness check is **PASS** and `sprint-status.yaml` exists (both ✅ 2026-10-20).

Next: Phase D above, then [features/feature-00-fondazioni.md](features/feature-00-fondazioni.md)

---

## Optional improvement tools (any time, fresh chat)

```
/bmad-advanced-elicitation <path of the document or section to improve>
/bmad-review <path of the document to review>
```
