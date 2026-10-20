# Weight4All — Brainstorm Intent

Source: brainstorming session 2026-10-19 (techniques: Metamorphosis Stages, Morphological Analysis). Canonical record: `.memlog.md` in this folder. Intended as direct input for `bmad-product-brief` / `bmad-prd`.

## Goals
- Learn the BMad Method end to end by building a real app.
- Get a usable web app, reachable from any device, that tracks **weight**, **emotional state (1–10)** and **hours slept** over time.

## Decisions (made by the user)

| Area | Decision |
|---|---|
| Delivery | Web app in the browser (adaptive: desktop, tablet, mobile) |
| Login | Firebase Authentication (for now) |
| Data | Stored on Firebase |
| Reminders | In-app visual sign only — today's missing entry is flagged on the home screen; no email, no push |
| Missing days in charts | Connect points with a **dashed line** over the gap |
| Data export | None for now |
| Look and feel | User picks accent colors from a small palette |

## Product shape (the "metamorphosis" arc)

1. **Core:** one number a day — weight. Opening the app and saving takes seconds.
2. **Feedback:** after saving, show *"you lost 0.3 kg vs yesterday"* with a colorful, happy effect.
3. **Daily entry:** weight, mood and sleep on **one screen** — emoji faces for mood (1–10) and sliders (mood/sleep as appropriate).
4. **Report tab:** one **combined chart** with all three values, plus **dedicated charts per dimension**, with **date-range filters** and **statistics**.

## Ideas offered by the coach (to accept, change or drop)

- Weight field pre-filled with yesterday's value, adjusted with +/− buttons.
- Feedback tone depends on direction: confetti on loss, calm and never shaming on gain.
- Screen background shifts with the chosen mood face; sleep slider shows a moon that fills with hours.
- Tapping a point on the combined chart highlights that day across all charts and shows its three values.
- Dashed segments excluded from statistics (averages use real entries only) and labeled "estimated".
- Streak counter of consecutive days logged; missing-day sign becomes a gentle catch-up prompt ("Yesterday is missing, add it?"); dashed gap segments offer tap-to-fill.
- Chosen palette also tints the happy-delta effect and charts; weight, mood and sleep each keep a distinct color.
- Accent color follows the week's average mood.
- Greeting by name with streak count on the home screen.
- After saving, today's point animates on the combined chart.
- Keep the data model simple (one record per day) so CSV export can be added later without migration.

## Open questions for the architecture step
- Firestore vs Realtime Database; per-user security rules.
- Offline persistence; Firebase Hosting.
- Whether mood/sleep are required or optional in a daily entry; one entry per day.
- Sleep input format (step size / range).
