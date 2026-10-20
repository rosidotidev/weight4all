---
title: "Weight4All — Product Brief"
status: complete
created: 2026-10-19
updated: 2026-10-19
---

# Product Brief: Weight4All

## Executive Summary

Weight4All is a personal daily tracker, built as a responsive web app for phone, tablet and desktop. Each day the user records three values: body weight (kg), emotional level (1–10) and hours slept. A Report tab then shows how these values move together over time.

The product has two purposes. The first is to teach Bob the BMad Method end to end by building something real. The second is to give him a tracker he owns and can reshape: existing apps record weight, mood or sleep separately, and none lets him freely add the dimensions he cares about. Its core value is helping him understand how his weight, mood and sleep relate to each other.

It starts as a one-user tool, with family members as a possible later audience. Because it is a passion and learning project, the brief stays small and favors a version 1 that actually gets finished.

## The Problem

Weight, mood and sleep influence each other, but they usually live in separate apps or in a spreadsheet nobody opens. Seeing the relationship means collecting the numbers in one place, and daily logging only survives if it is nearly effortless. Bob wants one fast entry and one readable picture, on any device, in an app he can customize later.

## The Solution

- **Daily entry, one screen.** Weight, mood (emoji faces, 1–10) and sleep. Weight is required; mood and sleep are optional, so a weight-only day is valid.
- **Happy feedback.** After saving, the app shows the change against yesterday with a colorful, never-shaming effect.
- **Missing-entry sign.** If today has no entry, the home screen shows a visible in-app flag. There are no emails or push notifications.
- **Report tab.** One combined chart of all three values, plus a dedicated chart and statistics (average, min, max, change over the range) per dimension, with date-range filters. Missing days, and days missing a single value, are bridged by a dashed line; statistics use real entries only.
- **Look and feel.** Modern, happy and colorful but not gaudy. The user picks accent colors from a small palette.

## What Makes This Different

Honestly: no market moat. The differences are that Bob owns it, it is designed around the three values together, and it can grow with new dimensions without migrating old data. The real payoff is learning BMad on a project he will actually use.

## Who This Serves

Bob, now. Family members may join later, so each user's data is kept separate from the start (Firebase Authentication with email and password; data stored on Firebase). Multi-user features such as sharing are out of scope.

## Success Criteria

- Entering a day's values takes **under 30 seconds** on the entry screen. The login and the app launch are not counted.
- The Report is **readable on phone, tablet and desktop**.
- After about three weeks of use, Bob still opens it regularly and has used the combined chart to spot links between mood, weight and sleep.
- Bob has taken the app from brief to working software using the BMad Method.

## Scope

**In version 1**
- Email/password registration and login
- Daily entry (one record per day, one screen)
- Happy post-save effect
- Missing-entry sign
- Report tab with combined and per-dimension charts, date-range filters, statistics, and dashed lines over gaps
- Accent color palette

**Out of version 1**
- Notifications and data export
- Streaks, greeting by name, mood-driven backgrounds, tap-to-highlight on charts, catch-up prompts
- Computed correlation insights
- New dimensions (physical activity, how he ate that day)
- Multi-user and sharing features

## Risks

| Risk | Mitigation |
|---|---|
| Losing the habit of logging | The under-30-second entry, the happy feedback effect and the visible missing-entry sign |
| Firebase proving too complicated | A small version 1: one record per day per user, no multi-user features, offline support only if the architecture step shows it is cheap |
| Not finishing the BMad path | A deliberately reduced version 1, so a working app is reachable |

## Open Questions (for PRD and architecture)

- Firestore or Realtime Database; per-user security rules; offline persistence; hosting.
- Sleep input format (step size and range) and the exact start point of the 30-second timing.

## Vision

Version 1 is a dependable personal tracker. Next come the first computed insights, such as how sleep length relates to mood, then new dimensions (physical activity, eating quality), and possibly family accounts. The data model stays simple so each of these can be added without migrating existing entries.
