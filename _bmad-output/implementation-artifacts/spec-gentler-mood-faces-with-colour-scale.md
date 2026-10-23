---
title: 'Gentler mood faces that show the level with colour'
type: 'feature'
created: '2026-10-23'
status: 'done'
baseline_commit: '4d5c4703a8ac43a09b8159894c38c9b69ca41b99'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The ten mood faces run from a deep frown (1) to a wide smile (10). The faces at both ends (1–2, 9–10) look bad because the mouth curve is too strong.

**Approach:** Draw every face with a gentle mouth, like the faces in the middle of today's scale, and show the level mostly through the face's fill colour. The colour changes step by step from 1 to 10. The number stays next to (row) or under (picker) every face, so the meaning never relies on colour alone.

**Decisions (2026-10-23):**
- Shape C: ten faces, the mouth control y mapped linearly from about 23.9 (1, light frown) to 39.1 (10, light smile), no extreme curves.
- Colour P1, cool to sunny: 1 periwinkle `#B9C3F0`, `#BCCBEE`, `#BFD6E6`, `#C3E0D6`, `#CCE8C2`, `#DCEBAA`, `#ECEA93`, `#F8E27A`, `#FFD35C`, 10 gold `#FFC23D`. Strokes: `#2F3A66` for 1–4, `#3D4A1E` for 5–7, `#5C4300` for 8–10. The palette does not follow the accent colour.

## Boundaries & Constraints

**Always:** One source of truth for the shape and colour of level n, used by the picker (Today, Entry edit), the History rows and Today's recent list. Colours live in `_tokens.scss` as tokens. The stroke stays readable on its fill (at least 3:1 for the face outline and features), and the selected-face ring in the picker stays clearly visible on every fill. Keep the face sizes (50 px picker, 26 px row), the radio-group behaviour, the labels and the numbers unchanged. Update DESIGN.md (colors and the Mood card and History row descriptions) to match.

**Never:** No change to the stored mood values, the charts (`chart-mood`) or the Report. No emoji or image assets: faces stay drawn SVG. No red or warning colour that reads as an error or as judging a low mood.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Ends of scale | Levels 1 and 10 | Gentle mouth; clearly different fill colours | N/A |
| Neighbours | Levels n and n+1 | Fill colours distinguishable side by side | N/A |
| Selected in picker | Any level selected | Ring visible against that face's fill; number bold | N/A |
| Row | Entry with mood 3 | 26 px face with level 3 colour, then "3" | N/A |
| Accent change | User picks another accent (Story 1.10) | Face colours do not change | N/A |

</frozen-after-approval>

## Code Map

- `src/app/shared/mood-face.component.ts` -- `CENTER`, `mouthPath(n)` (mouth control y = 11.6 at 1 to 51.4 at 10; 31.5 is flat) and the 26 px row face. Becomes the single place for level → mouth and level → colour tokens.
- `src/app/shared/mood-faces.component.{ts,html,scss}` -- the 50 px picker (radiogroup, ring `r=23.25` in `primary`/`primary-container`, `.head/.feature/.mouth` classes). Reuse `mouthPath`; give each face its level colours.
- `src/styles/_tokens.scss` -- `--w4a-mood-face-fill` / `--w4a-mood-face-stroke` (lines 31–32). Replace with per-level tokens.
- `src/app/shared/mood-face.component.spec.ts`, `src/app/shared/mood-faces.component.spec.ts` -- extend.
- `src/app/features/history/history.component.html`, `src/app/features/today/recent-entries.component.html` -- use `<w4a-mood-face [level]>`; no change expected.
- `_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-10-19/DESIGN.md` -- colors `mood-face-fill/stroke` (lines 25–26), components `mood-face` (129–132), Mood card and History row prose (293, 300).
- Mockups `mock-01-today.svg`, `mock-03-history.svg` -- they show today's yellow faces; this change deliberately departs from them, and DESIGN.md becomes the reference for faces.

## Tasks & Acceptance

**Execution:**
- [x] `src/styles/_tokens.scss` -- add fill and stroke tokens for levels 1–10 from the chosen palette; remove the single-colour pair -- one place for colours.
- [x] `src/app/shared/mood-face.component.ts` -- gentle `mouthPath` per the chosen shape; export a `faceColours(n)` giving the fill/stroke token names; bind them in the row face -- single source of truth.
- [x] `src/app/shared/mood-faces.component.{ts,html,scss}` -- use the same per-level fill/stroke in the picker -- picker matches rows.
- [x] `src/app/shared/mood-face.component.spec.ts`, `mood-faces.component.spec.ts` -- test: mouth curve stays within the gentle range for 1–10, monotonic per the chosen shape; each level gets its own fill token; picker and row use the same values.
- [x] `DESIGN.md` -- describe the new faces and colour scale.

**Acceptance Criteria:**
- Given the Mood card, when it shows the ten faces, then no mouth is curved more than the gentlest faces of the old middle range, and the level reads from colour plus the number.
- Given History and Today's recent list, when an Entry has a mood, then the small face uses the same shape and colour as that level in the picker.
- Given any level selected in the picker, when looking at the face, then the selection ring and bold number are clearly visible.

## Design Notes

Gentle range: the old mouth control y for levels 4 to 7 spans about 26.5 to 39.8. Option C maps 1–10 linearly onto 23.9–39.1 (`31.5 + (n − 5.5) × 7.6 / 4.5`). Colours per level should be tokens, e.g. `--w4a-mood-1-fill`, `--w4a-mood-1-stroke`, so the SVG uses `fill: var(...)` and no hex sits in components.

## Verification

**Commands:**
- `npx ng test --watch=false --include='src/app/shared/**/*.spec.ts' --include='src/app/features/**/*.spec.ts'` -- expected: pass
- `npx eslint src` and `npm run test:lint` -- expected: pass
- `npm run build` -- expected: success

**Manual checks (if no CLI):**
- `UX check`: Today Mood card (picker, every level selected once) and History rows at 360, 768 and 1280 px; compare with the chosen preview option and DESIGN.md. Mood faces are a deliberate deviation from the mockups.

## Implementation Notes

- Implemented by a subagent from this spec: per-level tokens in `_tokens.scss`, `mouthPath`/`faceColours` in `mood-face.component.ts` as the single source, the picker binds the same local `--w4a-face-fill/stroke` properties, DESIGN.md updated.
- The Design Notes formula (`× 1.6`) disagreed with the frozen ends 23.9/39.1; the code follows the frozen decision (step 7.6 / 4.5 ≈ 1.69) and the Design Notes now say so.
- The Code Map said the old levels 4–7 span 26.5–39.8; the real old values are 24.9–38.1. The approved ends (±7.6 from flat) are a little stronger than old 4/7 (±6.6), as in the preview the user chose.
- Browser check (signed in, emulator, nothing saved): Today Mood card at 1536 px and in a 360 px frame. Faces go periwinkle → gold with gentle mouths; the ring and bold number are clearly visible with level 1 and with level 10 selected (selection cleared afterwards). History rows: the account has no Entry with a mood, so row faces are covered by unit tests only.

## Review Triage Log

- [verification-gap] Colour chain from `faceColours` to tokens to CSS untested — medium, patch: the theme lint now ties `faceColours(n)` var names to `:root` tokens; the computed fill was checked by eye in the browser (a Playwright computed-style test was not added).
- [blind+edge] DESIGN.md "never stronger than the middle faces" is false — low, patch: reworded to the true geometry.
- [blind+edge] Test upper bound 39.8 vacuous and asymmetric — low, patch: bounds 23.9..39.1 plus a mirror check.
- [blind] Old `--w4a-mood-face-stroke` removal and leftover references unchecked — low, patch (with the theme test).
- [blind+edge] `faceColours`/`mouthPath` with level outside 1–10 renders a black face — false: `firestore.rules` `validMood` only accepts integers 1–10 and the picker only emits 1–10; nothing else writes mood.
- [edge] No CSS fallback in `var(--w4a-face-fill)` — false for the same reason: every level 1–10 has a token, and the theme lint checks that.
- [blind] DESIGN.md stroke uses three band names while CSS has ten per-level tokens — low, rejected: values match (the theme lint checks contrast per level); unifying them adds indirection for no user-facing gain.
- [blind] DESIGN.md component values `{colors.mood-<n>-fill}` are not resolvable references — low, rejected: no tooling resolves DESIGN.md in this repo.
- [blind] Mockups still show yellow faces — low, defer: DESIGN.md records the deliberate departure; updating the SVG mockups is UX work.
- [blind] Selected disc/ring contrast on cool fills untested for every accent — maybe-false, rejected as at most low: the ring is `primary` 3.5 px outside the face, verified visible for levels 1 and 10 with the default accent.
- [blind] Neighbouring fills close (1 vs 2, 3 vs 4) — low, rejected: the user chose this palette from the preview, and the number always shows the level.
- [blind] Face markup duplicated between picker and row face — low, rejected: existed before this change; the new test keeps the two in step.
- [blind] Forced-colors mode and future dark theme — low, rejected: existed before this change (the old yellow fill behaved the same); the number keeps the meaning; no dark theme is planned.
