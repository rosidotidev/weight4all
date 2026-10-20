---
title: "Weight4All — PRD"
status: final
created: 2026-10-19
updated: 2026-10-20
---

# PRD: Weight4All
*Working title — confirm.*

## 0. Document Purpose

This PRD defines version 1 of Weight4All for its owner and builder (Bob), and for the downstream BMad workflows that follow it: UX design, architecture, epics and stories. It builds on the product brief (`_bmad-output/planning-artifacts/briefs/brief-bmad612_home-2026-10-19/`) and the brainstorm intent (`_bmad-output/brainstorming/brainstorm-weight4all-2026-10-19/`), and does not repeat them. Vocabulary is anchored in the Glossary (§3). Features (§4) are ordered F0–F4, the order in which they are built, with functional requirements (FR) nested under each. Inferred points are tagged `[ASSUMPTION]` inline and indexed in §9. Rigor target: professional, 6 out of 10 — complete and testable, without launch-grade ceremony.

## 1. Vision

Weight4All is a personal daily tracker that lives in the browser. Each day Bob records his body weight and, if he wants, his emotional level and hours of sleep. A Report then shows how the three move together over time.

Existing apps record weight, mood or sleep separately, or bury them in a spreadsheet nobody opens. Weight4All keeps the three in one place, makes the daily entry quick enough to survive as a habit, and gives one readable picture of the relationships between them. Bob owns it and can reshape it, and new dimensions (physical activity, how he ate) can be added later without migrating old data.

The product has a second purpose: it is the real project through which Bob learns the BMad Method end to end. Version 1 is therefore deliberately small, so that a working app is reachable.

## 2. Target User

### 2.1 Jobs To Be Done

- **Functional:** when I have just woken up, I want to log today's weight, mood and sleep in seconds, so that the data exists without effort.
- **Functional:** when I look back over weeks, I want to see weight, mood and sleep on one chart, so that I can spot links between them.
- **Emotional:** when I log a day, I want a friendly response and never a judgment, so that I keep coming back.
- **Contextual:** I want the same app on my phone, tablet and computer, from one web address.
- **Builder:** I want to learn the BMad Method on something I will actually use.

### 2.2 Non-Users (v1)

- Family members: possible later audience. Each Account is separate from the start, but there are no sharing or family features in v1.
- Clinicians and coaches: the app is not a medical device and gives no health advice.

### 2.3 Key User Journeys

*Drafted from the brief; Bob to confirm. [ASSUMPTION: the scenes below are inferred, not narrated by Bob.]*

- **UJ-1. Bob logs his day in under 30 seconds.**
  - **Persona + context:** Bob, the only user, picks up his phone after waking up and wants to log without thinking.
  - **Entry state:** logged in from an earlier session, on the Today tab, no Entry for today yet; the Missing-entry sign is visible.
  - **Path:** the weight field shows his last weight; he adjusts it, taps the mood face that fits, sets his sleep hours, and taps Save.
  - **Climax:** the Happy effect plays, showing the change against his previous Entry in a warm, colorful way.
  - **Resolution:** the Missing-entry sign is gone; today's Entry is saved and can be edited later.
  - **Edge case:** he is in a hurry and enters only the weight. The Entry saves; mood stays empty and Sleep hours store the default 6.0 h, unless he first empties the sleep control with its clear button to leave Sleep empty. Both can be changed later.

- **UJ-2. Bob repairs a forgotten day.**
  - **Persona + context:** Bob forgot to log yesterday and notices it in the evening.
  - **Entry state:** logged in, on the History tab.
  - **Path:** he scrolls to yesterday, which shows no Entry, opens it, enters the values and saves.
  - **Climax:** yesterday now appears in History, and the dashed line on the Report disappears for that day.
  - **Resolution:** the history is complete; no guilt message was shown.
  - **Edge case:** he typed the wrong weight in an old Entry. He edits it, or deletes the whole Entry after a confirmation.

- **UJ-3. Bob looks for patterns on his laptop.**
  - **Persona + context:** Bob, after about three weeks of use, sits at a desktop and wants to know whether short nights go with low mood.
  - **Entry state:** logged in, on the Report tab, with the default Range.
  - **Path:** he reads the combined chart, switches the Range to 90 days, then opens the sleep chart and its statistics.
  - **Climax:** he sees on the combined chart that low-mood days follow short nights.
  - **Resolution:** he knows what to watch; he closes the app. The same Report is readable on his phone.
  - **Edge case:** he skipped a week of logging. The chart bridges that week with a dashed line, and the statistics ignore it.

## 3. Glossary

- **Account** — A person's login (email and password, Firebase Authentication). Owns all of its Entries. Entries are never visible to other Accounts.
- **Day** — A calendar date in the device's local time zone. An Account has at most one Entry per Day.
- **Entry** — The record of one Day: Weight (required), Mood level and Sleep hours (optional).
- **Weight** — Body weight in kilograms, one decimal place.
- **Mood level** — The emotional level of the Day, an integer from 1 (lowest) to 10 (highest), chosen through emoji faces.
- **Sleep hours** — Hours slept the night before the Day, a number with a half-hour step, from 0 to 24 `[ASSUMPTION]`. The sleep control starts at 6.0 h for any Day without an Entry, so an untouched control saves 6.0 h; the user empties it with a clear control.
- **Dimension** — One of the tracked values: Weight, Mood level, Sleep hours. New Dimensions may be added after v1.
- **Real entry** — A value actually recorded by the user for a Day, as opposed to a gap bridged on a chart.
- **Gap** — A Day with no Entry, or an Entry that lacks the value for a given Dimension.
- **Dashed line** — The chart line style that bridges a Gap between two Real entries.
- **Missing-entry sign** — The visible in-app flag on the Today tab when today has no Entry. Never an email or push notification.
- **Happy effect** — The colorful, never-shaming feedback shown after saving an Entry, comparing its Weight with the previous Entry.
- **Range** — The span of Days the Report displays.
- **Report** — The tab showing the combined chart, one chart per Dimension, and statistics for the Range.
- **Statistics** — Average, minimum, maximum and change over the Range, per Dimension, computed from Real entries only.
- **Accent palette** — The small set of accent colors the user chooses from.
- **Tabs** — The four top-level sections: Today, History, Report, Settings.
- **Settings** — The tab where the user configures the app: Accent palette and Language.
- **Language** — The language of the interface, Italian or English. Chosen in Settings.

## 4. Features

### 4.1 F0 — Foundations and adaptive shell

**Description:** Everything the other features stand on: registration and login with Firebase Authentication, per-Account data separation, the adaptive layout with the four Tabs, and the Settings tab, where the Accent palette and the Language (Italian or English) are chosen. After login, Bob lands on the Today tab. The layout adapts to phone, tablet and desktop. Realizes UJ-1, UJ-2, UJ-3.

**Functional Requirements:**

#### FR-1: Register with email and password

A visitor can create an Account with an email address and a password.

**Consequences (testable):**
- A new Account is created for a valid, unused email and a password meeting the Firebase minimum.
- An email already in use, an invalid email or a too-short password is rejected with a clear message and no Account is created.

**Out of Scope:** email verification `[ASSUMPTION]`; social login; any other sign-in method.

#### FR-2: Log in, stay logged in, log out

An Account owner can log in, stay logged in across browser restarts, and log out.

**Consequences (testable):**
- Without a session, any address of the app shows only the login screen; no Entry data is loaded.
- After login, reopening the app in the same browser does not ask for credentials again until logout.
- Logout returns to the login screen and a back navigation does not reveal Entry data.

#### FR-3: Reset a forgotten password

An Account owner can request a password reset email from the login screen. `[ASSUMPTION: included because a lost password would otherwise lock Bob out of his own data.]`

**Consequences (testable):**
- A reset email is sent for a registered address; the response does not reveal whether an address is registered.

#### FR-4: Per-Account data separation

Each Account can read and write only its own Entries.

**Consequences (testable):**
- A signed-in Account A cannot read, create, change or delete an Entry belonging to Account B, even by calling the data service directly.
- An unauthenticated request cannot read or write any Entry.

#### FR-5: Adaptive shell with four Tabs

The signed-in app shows the Tabs Today, History, Report and Settings and adapts its layout to the screen size.

**Consequences (testable):**
- The four Tabs are reachable from every screen of the app in one tap or click.
- On phone widths the navigation sits where the thumb reaches it (a bottom bar); on tablet and desktop widths it uses the extra space (a side or top bar). `[ASSUMPTION: exact pattern is for the UX step.]`
- No horizontal page scrolling is needed from 360 px wide upwards.

#### FR-6: Choose an Accent palette

An Account owner can choose accent colors from a small palette in the Settings tab, and the choice is remembered.

**Consequences (testable):**
- The palette offers a small fixed set of options (about 5–8 `[ASSUMPTION]`).
- The selected accent applies to the interface and the Happy effect, and persists across sessions and devices of the same Account.
- Weight, Mood level and Sleep hours keep distinct colors in charts regardless of the chosen accent. `[ASSUMPTION]`

#### FR-28: Choose the interface Language

An Account owner can use the app in Italian or English and switch between them in the Settings tab. Realizes UJ-1, UJ-3.

**Consequences (testable):**
- Settings offers exactly two Languages, Italian and English; switching applies at once to every screen, message, label and chart text, without reloading the app or losing unsaved input.
- The choice persists across sessions and devices of the same Account.
- Before any choice is made, including on the login screen, the Language is English.
- Dates and numbers follow the Language, for example the decimal comma in Italian and the decimal point in English; a Weight entered in either format is stored as the same value.
- Entries are language-independent: switching Language never changes stored data.
- No text appears in a Language other than the selected one, except the user's own typed values.

**Out of Scope:** languages beyond Italian and English; automatic translation of user input.

**Feature-specific NFRs:**
- Authentication and data separation are enforced on the server side (security rules), not only in the interface.

### 4.2 F1 — Daily weight entry, history, edit and delete

**Description:** The core loop. On the Today tab Bob records today's Weight and saves; the Happy effect answers. If today has no Entry, the Missing-entry sign is visible. The History tab lists all Entries and lets Bob open, edit or delete any of them, including adding an Entry for a past Day that has none. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-7: Record today's Weight

An Account owner can save an Entry for today with a Weight. Realizes UJ-1.

**Consequences (testable):**
- Weight is required; saving without it is blocked with a clear message.
- Weight accepts kilograms with one decimal place, within a plausible range (20.0–400.0 kg `[ASSUMPTION]`); other values are rejected with a clear message.
- Saving when today already has an Entry updates that Entry; it never creates a second Entry for the same Day.

#### FR-8: Quick weight input

The Weight field starts from the most recent Entry's Weight and can be adjusted with plus and minus buttons as well as typed. `[ASSUMPTION: from the brainstorm ideas; confirm.]` Realizes UJ-1.

**Consequences (testable):**
- With no previous Entry, the field starts empty.
- One tap on plus or minus changes the value by 0.1 kg.

#### FR-9: Happy effect

After a save, the app shows the change in Weight against the previous Entry with a colorful, happy effect. Realizes UJ-1.

**Consequences (testable):**
- The comparison uses the most recent earlier Entry, and states its date when it is not yesterday. `[ASSUMPTION]`
- On a loss the effect is celebratory; on a gain or no change it is calm and encouraging. No text or visual shames the user for any outcome.
- With no earlier Entry, a welcoming message appears instead of a comparison.
- The effect uses the chosen Accent palette and does not block further interaction for more than a few seconds `[ASSUMPTION: dismissible, under 3 s]`.

#### FR-10: Missing-entry sign

When today has no Entry, the Today tab shows the Missing-entry sign; once an Entry exists for today, it disappears. Realizes UJ-1.

**Consequences (testable):**
- The sign is visible on opening the Today tab whenever today has no Entry, and not otherwise.
- The sign disappears right after today's Entry is saved, and reappears if that Entry is deleted.
- The app sends no email and no push notification.

#### FR-11: Browse History

An Account owner can see all of their Entries in the History tab, newest first. Realizes UJ-2.

**Consequences (testable):**
- Each row shows the Day and the values present in that Entry.
- Days without an Entry between the first and the last Entry are visibly shown as missing and can be opened to add an Entry.
- The list stays usable with a year of daily Entries (365 rows).

#### FR-12: Edit or add a past Entry

An Account owner can change the values of any Entry, and can create an Entry for any past Day. Realizes UJ-2.

**Consequences (testable):**
- The edit enforces the same rules as FR-7.
- Entries cannot be created for future Days.
- Saving an edit shows no Happy effect for past Days `[ASSUMPTION]`.

#### FR-13: Delete an Entry

An Account owner can delete an Entry after an explicit confirmation. Realizes UJ-2.

**Consequences (testable):**
- Cancelling the confirmation leaves the Entry untouched.
- After deletion the Day shows as missing in History and as a Gap in the Report.

#### FR-14: Failed save is never silent

If a save or delete cannot reach the server, the app says so and keeps what the user typed.

**Consequences (testable):**
- With the network disconnected, saving shows an error message and the form values remain.
- No Entry is shown as saved unless the server has confirmed it.

#### FR-29: "This week" summary on wide screens

On wide screens (desktop), the Today tab also shows a "This week" summary of the last 7 Days. Realizes UJ-1. `[ASSUMPTION: added from the approved desktop mockup; "week" means the 7 Days ending today.]`

**Consequences (testable):**
- It shows how many of the 7 Days have an Entry, and the average Weight, Mood level and Sleep hours over them, from Real entries only.
- A Dimension with no Real entry in the 7 Days shows "no data", not zero.
- It updates after an Entry is saved, edited or deleted.
- On phone and tablet widths it is not shown.

**Feature-specific NFRs:**
- The Today tab is usable for entry within the 30-second target (SM-1); the form has no required field other than Weight.

**Notes:** Offline use is not in v1 (see §5).

### 4.3 F2 — Emotional level and sleep hours

**Description:** The daily Entry gains two optional values on the same screen: Mood level (1–10, emoji faces) and Sleep hours (a slider that starts at 6.0 h). A weight-only Entry stays valid (Sleep emptied with the clear control), and mood or sleep can be added or removed later by editing the Entry. Realizes UJ-1, UJ-2, UJ-3.

**Functional Requirements:**

#### FR-15: Record Mood level

An Account owner can optionally set a Mood level from 1 to 10 by tapping an emoji face. Realizes UJ-1.

**Consequences (testable):**
- Ten distinct faces map to the integers 1 to 10, with a text or number alternative visible or announced for each.
- An Entry can be saved with no Mood level.
- Selecting the selected face again clears it `[ASSUMPTION]`.

#### FR-16: Record Sleep hours

An Account owner can optionally set Sleep hours in half-hour steps from 0 to 24. The sleep control starts at 6.0 h for any Day without an Entry. `[ASSUMPTION: step and range resolve the brief's open question; confirm.]` Realizes UJ-1.

**Consequences (testable):**
- Values outside the range or off the step are not accepted.
- For a Day without an Entry (today or a past Day), the control starts at 6.0 h, and saving without touching it stores 6.0 h.
- A clear control next to the slider empties the value (shown as an em dash); an Entry can be saved with no Sleep hours after it is used.
- When editing an existing Entry that has no Sleep hours, the control shows the cleared state, not 6.0 h.
- The input is quick on a phone (slider or stepper, UX decides).

#### FR-17: See and edit all three values everywhere an Entry appears

History rows and the edit screen show Mood level and Sleep hours alongside Weight, and all three can be edited, added or cleared. Weight cannot be cleared. Realizes UJ-2.

**Consequences (testable):**
- An Entry without Mood level, or with Sleep hours emptied by the user, shows the missing value as absent, not as zero.
- Clearing Mood level or Sleep hours on an existing Entry saves a valid Entry.

### 4.4 F3 — Report with charts and Range selection

**Description:** The Report tab shows how Weight, Mood level and Sleep hours move over a selected Range: one combined chart with all three, one chart for each Dimension, and Statistics. A Dashed line bridges every Gap, and Statistics use Real entries only. Realizes UJ-3.

**Functional Requirements:**

#### FR-18: Select a Range

An Account owner can choose the Range the Report displays. Realizes UJ-3.

**Consequences (testable):**
- Presets: last 7 days, 30 days, 90 days, 1 year, and all time. A custom start and end Day is deferred out of v1 (see §6.2).
- One Range applies to every chart and to the Statistics at once.
- The default Range on opening is 30 days `[ASSUMPTION]`.

#### FR-19: Combined chart

The Report shows one chart with Weight, Mood level and Sleep hours over the Range, each Dimension readable despite different units and scales. Realizes UJ-3.

**Consequences (testable):**
- Each Dimension has a distinct color and is identified in a legend.
- Dimensions are not identified by color alone (see FR-25).
- Scale handling (separate axes or normalization) is chosen so that all three lines are legible. `[NOTE FOR PM: decide in UX step.]`

#### FR-20: Per-Dimension charts

The Report shows a dedicated chart for each Dimension over the Range. Realizes UJ-3.

**Consequences (testable):**
- Three charts, one per Dimension, with a labeled value axis in the Dimension's unit.
- Charts are generated per Dimension (not hard-coded for three), so a new Dimension can add a chart (see §6.2 vision).

#### FR-21: Statistics per Dimension

For the Range, the Report shows average, minimum, maximum and change for each Dimension. Realizes UJ-3.

**Consequences (testable):**
- Only Real entries inside the Range are used; Gaps never contribute a value.
- Change is the last Real entry minus the first Real entry in the Range for that Dimension.
- With no Real entry in the Range for a Dimension, Statistics for it show "no data", not zero.

#### FR-22: Dashed line over Gaps

On every chart, a Gap between two Real entries is bridged by a Dashed line; Real entries are connected by solid segments. Realizes UJ-2, UJ-3.

**Consequences (testable):**
- A missing Day is bridged by a Dashed line on all charts.
- A Day with an Entry that lacks, say, Sleep hours is bridged by a Dashed line on the sleep line only; the other lines stay solid through that Day.
- Adding the missing Entry later replaces the Dashed segment by a solid one.

#### FR-23: Sparse and empty states

The Report explains itself when there is too little data. 

**Consequences (testable):**
- With no Entries, the Report shows a friendly message pointing to the Today tab, not empty axes.
- With a single Real entry in the Range, a Dimension shows that point and Statistics without error.

#### FR-24: Report fits every device

The Report adapts to phone, tablet and desktop. Realizes UJ-3.

**Consequences (testable):**
- At 360 px, 768 px and 1280 px widths, all charts and Statistics are fully visible, axis labels are legible, and no horizontal page scrolling is needed.
- Changing orientation or window size re-lays out the charts without losing the selected Range.

**Feature-specific NFRs:**
- A year of daily Entries renders in the Report without a visible freeze (see FR-27).

### 4.5 F4 — Polish: accessibility and performance

**Description:** A pass over everything built so far to make it usable by everyone and fast. This is not new functionality. Installable-app behavior and offline use are not part of v1 (see §5).

**Functional Requirements:**

#### FR-25: Accessible interface

The whole app meets WCAG 2.1 level AA. `[ASSUMPTION: AA as the target level.]`

**Consequences (testable):**
- Every function is usable with the keyboard alone, with a visible focus indicator, on desktop.
- Text and essential graphics meet the AA contrast ratio in every Accent palette option.
- The page declares the selected Language so screen readers pronounce text correctly.
- Form fields have labels; errors are announced to screen readers; touch targets are at least 44 × 44 px on phones.
- Mood faces, Happy effect and charts do not rely on color alone: lines also differ by marker or pattern, and each chart's data is available as text or a table.
- Motion in the Happy effect respects the reduced-motion setting of the device.

#### FR-26: Responsive layout verified

The layout is verified on phone, tablet and desktop in current browsers.

**Consequences (testable):**
- Latest two versions of Chrome, Edge, Firefox and Safari (desktop and mobile) show all four Tabs with no layout breakage, in both Languages (Italian text may be longer than English) `[ASSUMPTION]`.

#### FR-27: Performance budget

The app loads quickly and stays responsive with a long history.

**Consequences (testable):**
- On a mid-range phone over a typical mobile connection, a logged-in visitor can interact with the Today tab within 3 seconds of opening the app `[ASSUMPTION]`.
- With 365 Entries, switching Range on the Report updates all charts within 1 second `[ASSUMPTION]`.
- With 365 Entries, History scrolls without visible jank.

## 5. Non-Goals (Explicit)

- Not a native or installable app: Weight4All is a web app reached by its address. No app-store version, no installable-app behavior in v1.
- Not an offline tool: an internet connection is required. `[NON-GOAL for MVP]`
- Not a health or coaching product: no goals, targets, diagnoses, advice or body-mass calculations.
- Not a reminder system: no email, no push notifications, no scheduled prompts. Only the in-app Missing-entry sign.
- Not a data-export tool: no CSV or other export in v1.
- Not a social product: no sharing, family views or public profiles.
- Not an insight engine: the app displays data; it does not compute or announce correlations.

## 6. MVP Scope

### 6.1 In Scope

- Email/password registration, login, logout, password reset (F0)
- Adaptive shell with Today, History, Report and Settings tabs; Accent palette and Italian/English Language chosen in Settings (F0)
- Daily Entry: Weight required; Mood level and Sleep hours optional (F1, F2)
- Edit and delete any Entry; add past Entries; History (F1)
- Happy effect after save; Missing-entry sign; "This week" summary on desktop (F1)
- Report: combined chart, per-Dimension charts, Statistics, Range selection, Dashed line over Gaps (F3)
- Accessibility, responsive verification and performance pass (F4)

### 6.2 Out of Scope for MVP

- Offline use and installable-app behavior: decided out of v1 by the user on 2026-10-19; revisit after v1 if daily use shows the need. `[NOTE FOR PM]`
- Custom start and end Day for the Report Range: deferred out of v1 (the presets stay); builds later on the same Range logic with no data impact.
- Data export (CSV and others): not wanted for now.
- Email or push notifications: replaced by the in-app sign.
- Streaks, greeting by name, mood-driven background, moon-fill sleep slider, tap-to-highlight on charts, catch-up prompts and tap-to-fill on Gaps, accent following average mood, "estimated" labels on dashed segments, animating today's point: deferred brainstorm ideas, listed in the brief addendum.
- Computed correlation insights, e.g. sleep length against mood: first candidate after v1, once enough data exists.
- New Dimensions (physical activity, how he ate that day, others): later, with no migration of existing Entries (see NFR-2).
- Family Accounts and sharing.
- Interface languages other than Italian and English.

## 7. Success Metrics

**Primary**
- **SM-1**: Time to log a day — under 30 seconds from the moment the Today tab is ready to the moment the Entry is saved, with weight, mood and sleep all entered. Login and app launch are excluded. Measured by hand with a stopwatch on phone and desktop. Validates FR-7, FR-8, FR-15, FR-16. `[ASSUMPTION: resolves the brief's open question about the timing start point.]`
- **SM-2**: Habit holds — after about three weeks, Bob still opens the app regularly, defined as an Entry on at least 5 days in each of the last 2 weeks `[ASSUMPTION]`. Validates FR-7, FR-10.
- **SM-3**: Insight delivered — Bob reports having used the combined chart to spot at least one link between mood, weight and sleep. Validates FR-19, FR-22.

**Secondary**
- **SM-4**: Report readable on phone, tablet and desktop — the FR-24 checks pass at 360, 768 and 1280 px. Validates FR-24.
- **SM-5**: BMad path completed — the app goes from brief to working software through the BMad Method.

**Counter-metrics (do not optimize)**
- **SM-C1**: Number of Entries or days logged in a row is not a target in itself. Optimizing it leads to guilt mechanics, which the product refuses (no streaks, no notifications, no shaming copy). Counterbalances SM-2.
- **SM-C2**: Speed of entry must not be won by dropping care for the data. Mood and sleep stay one tap or slide away, and correcting a value stays easy. Counterbalances SM-1.

## Cross-Cutting Requirements

- **NFR-1 Security and privacy:** all traffic over HTTPS; every data access requires authentication and is limited to the owning Account (FR-4). An Entry is personal health data; it is stored on Firebase and used only to serve its owner.
- **NFR-2 Extensible data model:** an Entry must be able to gain a new Dimension without migrating or rewriting existing Entries (new values are optional fields), and the Report must derive its charts and Statistics from the list of Dimensions, not from hard-coded names.
- **NFR-3 Time handling:** a Day is the calendar date on the device where the Entry is made; the Missing-entry sign and "today" follow the device's local date.
- **NFR-4 Hosting and availability:** reachable at a stable web address on Firebase-backed infrastructure; best-effort availability, no formal service level.
- **NFR-5 Data durability:** a saved Entry is not lost by a later save of a different Day.

## Aesthetic and Tone

Modern, happy and colorful, not gaudy. The user picks accent colors from a small palette (FR-6) and the Language, Italian or English (FR-28), in the Settings tab. Every product-generated text exists in both Languages with the same warm tone. All product-generated text is warm and encouraging and never shames the user for a gain, a missed day or a low mood.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Logging habit fades | Under-30-second entry, Happy effect, visible Missing-entry sign (SM-1, FR-9, FR-10) |
| Firebase proves more complex than expected | Small data model: one Entry per Day per Account; no multi-user features; no offline in v1 |
| BMad path not finished | Deliberately reduced v1 with five small features built in order |
| Charts unreadable on a phone | FR-24 checked at three widths; scale handling decided in the UX step (FR-19) |

## 8. Open Questions

1. **Firestore or Realtime Database; security rules; hosting.** For the architecture step. Not blocking the PRD.
2. **Combined chart scales.** Separate axes or normalized values for three Dimensions with different units (FR-19). UX step.
3. **Palette content.** Which accent colors (FR-6). UX step.

## 9. Assumptions Index

- §2.3 — The three journeys are drafted from the brief, not narrated by Bob.
- §3 Glossary / FR-16 — Sleep hours: 0–24 in half-hour steps; the control starts at 6.0 h for any Day without an Entry and can be emptied with a clear control.
- FR-1 — No email verification.
- FR-3 — Password reset is included.
- FR-5 — Bottom bar on phone, side or top bar on larger screens.
- FR-6 — Palette of about 5–8 colors; each Dimension keeps its own chart color whatever the accent.
- FR-7 — Plausible Weight range 20.0–400.0 kg.
- FR-29 — "This week" summary added from the approved desktop mockup; week = the 7 Days ending today.
- FR-8 — Weight field pre-filled with the last Weight, with plus/minus 0.1 kg buttons.
- FR-9 — Comparison against the most recent earlier Entry (date shown if not yesterday); effect dismissible, under 3 seconds.
- FR-12 — No Happy effect when editing past Days.
- FR-15 — Tapping the selected face again clears Mood level.
- FR-18 — Presets 7 d, 30 d, 90 d, 1 y, all; default 30 days. Custom Range deferred out of v1.
- FR-25 — WCAG 2.1 AA target.
- FR-26 — Latest two versions of Chrome, Edge, Firefox, Safari.
- FR-27 — Today tab interactive within 3 s; Range switch within 1 s at 365 Entries.
- SM-1 — The 30-second timing starts when the Today tab is ready, and includes all three values.
- SM-2 — "Regular use" means Entries on at least 5 days in each of the last 2 weeks.
