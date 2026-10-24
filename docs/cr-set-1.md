# Change Request Set 1

Three change requests for Weight4all. Each one is implemented with `/bmad-build`, in a fresh chat, one at a time, in the order below.

## Commands

Run each one in a fresh chat (`/clear` first):

```
/bmad-build CR-1: <text from section CR-1 below>
/bmad-build CR-2: <text from section CR-2 below>
/bmad-build CR-3: <text from section CR-3 below>
```

Optional after each build: `/bmad-code-review`. Optional at the end: `/bmad-walkthrough` for a human check.

---

## CR-1 — Logout button and navigation icon

**Problem:** Logout is not always reachable. The top-left icon does not match the bottom navigation.

**Requested behaviour:**
- The logout action (exit icon) is always available at the top right of every screen where the user is logged in.
- The top-left icon is the same symbol as the active bottom-navigation tab, shown slightly larger. Example: on Today, the top-left shows the Today symbol, larger. On History, the History symbol. On Report, the Report symbol.
- Tab switching and the mobile/tablet/desktop layout stay as they are.

**Text to add to `/bmad-build`:**
> Make logout always reachable: an exit icon button at the top right on every logged-in screen. Replace the top-left element with the icon of the currently active tab (same symbol as the bottom navigation, slightly larger). Keep tabs, layout per screen size, and the existing accessibility labels (translated IT/EN). Add or update tests for the visible icons and the logout button.

---

## CR-2 — Weight jump warning

**Problem:** A large day-to-day weight change is not flagged to the user.

**Requested behaviour:**
- When the user saves a weight that is more than 1% higher than the previous recorded weight, show a warning message, not an error.
- The message tells the user to pay attention to their diet ("warning, pay attention to what you eat"), in Italian and English.
- Saving still succeeds. The warning is informational.
- The comparison uses the most recent earlier entry before the day being saved. If there is no earlier entry, no warning.
- Only increases trigger it (more than 1% above the previous weight). Decreases do not trigger it, and their current handling is already correct: do not change it.

**Text to add to `/bmad-build`:**
> When the user saves a weight that is more than 1% above the most recent earlier entry, show a warning (not an error) telling them to pay attention to what they eat, in IT and EN strings. Saving still succeeds. No warning when there is no earlier entry or when the weight did not increase by more than 1%. Weight decreases must not trigger the warning and their existing behaviour must stay unchanged. Use the existing feedback pattern for the happy message and keep the new strings in the single strings file. Add unit tests for the threshold (exactly 1% is not a warning; just above is).

---

## CR-3 — Documentation update

**Problem:** The feature docs do not yet describe CR-1 and CR-2.

**Requested behaviour:** Update the documentation so the two changes above are recorded.

**Text to add to `/bmad-build`:**
> Update the documentation for CR-1 and CR-2: the relevant entry in `docs/features/` (the feature that owns the navigation and the entry form), `docs/weight4all.md` if it describes these screens or the weight entry, and the screenshots or mockup references in `README.md` only if they now show outdated UI. Keep documentation in English. Do not change unrelated sections.
