# Weight4All — Addendum

## Parked roadmap (post-v1, user-stated)
- Additional daily dimensions the user wants to add later: **physical activity** and **how he ate that day** (scale from healthy to unhealthy), "and more".
- Implication for the data model/architecture: a daily record should be able to gain new dimensions without migrating old data (e.g. optional fields per day, Report charts generated per dimension rather than hard-coded).

## Deferred brainstorm ideas (not in v1, user choice 2026-10-19)
Streak counter; greeting by name; screen background following mood; moon-fill sleep slider; tap a chart point to highlight the day across charts; catch-up prompt / tap-to-fill on dashed gaps; accent color following weekly average mood; dashed segments labeled "estimated" and excluded from statistics (statistics-on-real-entries-only should still be settled in the PRD); today's point animating on the combined chart.

## Parked: correlation insights
Computed relationships between dimensions (e.g. "on nights under 6 h of sleep, mood averages 4.2 vs 7.1"). Deferred from v1: needs several weeks of data to mean anything, and v1 already supports spotting links visually on the combined chart. Candidate first post-v1 feature, as it serves the user's core purpose ("understand how mood, weight and sleep are linked").
