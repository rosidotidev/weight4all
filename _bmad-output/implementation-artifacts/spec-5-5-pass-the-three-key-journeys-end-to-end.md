---
title: 'Story 5.5: Pass the three key journeys end to end'
type: 'feature'
created: '2026-10-21'
status: 'in-review'
baseline_commit: '84a487c6532930793108f73fe48018323e313a9a'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The three journeys (UJ-1 log today, UJ-2 fix History, UJ-3 read the Report) are only covered piece by piece. Nothing runs them start to finish against the emulators on the viewports they are meant for, and the offline Save path is not proven end to end.

**Approach:** One Playwright suite runs UJ-1 on a phone viewport, UJ-2 on a phone viewport, and UJ-3 on a desktop viewport, against the local emulators. UJ-1 also runs once with the network cut during Save, to show the error, kept values and a successful retry. No product code changes unless a journey fails for a real reason, and then only the smallest fix.

## Decisions

- UJ-1 "well within the 30-second target" is a hard cap of 30 s from opening Today to Save confirmed (option A). The measured time is recorded, not tightened.

## Boundaries & Constraints

**Always:** Run only against the local Auth and Firestore emulators. Seed data with `seedEntries` or `seedEntriesBatch`. Drive the UI through its real controls, not by writing Firestore documents mid-journey. Record the measured time of the UJ-1 run.

**Never:** Change the 30-second target to pass. Touch the Today performance budget from story 5.4. Run `npm run deploy`. Claim a result that was not run in this session.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| UJ-1 on phone | 390x844, signed in, empty today | Weight adjusted, face picked, Sleep set, Save: Happy effect shows, Missing banner gone, Entry exists in emulator | Test fails naming the step |
| UJ-1 timed | Same flow, no throttling | Open Today to Save confirmed under the target | Test fails with the measured time |
| UJ-2 on phone | Seeded History, a missing day, a wrong value | Added day and edited value show in History; deleted day gone after confirming; Report Gap for that day becomes solid | Test fails with the row text found |
| UJ-3 on desktop | 1280x800, seeded data with a week of no logs | Changing Range updates the combined chart, dimension charts, Statistics; the empty week shows a dashed bridge | Test fails naming the element not updated |
| UJ-1 offline Save | Network cut before Save | Inline save error shows, typed values stay; network restored, retry succeeds and the Entry exists | Test fails with the message seen |

## Code Map

- `e2e/journeys.spec.ts` -- new: UJ-1, UJ-2, UJ-3 and the offline UJ-1 variant, using `createAccount`, `signIn`, `seedEntries`.
- `e2e/support.ts` -- reuse as is; add a helper only if the three journeys repeat code.
- `src/app/features/today/today.component.html` -- Missing banner (`.banner`, role status) shown while no Entry for today.
- `src/app/shared/entry-form.component.html` -- Weight input `#w4a-field-weight`, face and slider fields, Save button `button.save`; inline message `.message`.
- `src/app/features/today/happy-effect.component.html` -- Happy effect, title `#w4a-effect-title` with the saved text.
- `src/app/core/data/entry.store.ts:116-140` -- save: `getDocFromServer` then `setDoc`, both bounded by `SAVE_TIMEOUT_MS` (10 s); offline gives a `network` or `timeout` code.
- `src/app/features/history/history.component.html:64` -- missing-day row; `history-day.component.html` and `delete-entry-dialog.component.html` -- add/edit and delete with confirmation.
- `src/app/features/report/chart-config.ts:22-61` -- dashed segments for bridged Gaps; `report.component.html` -- Range chips, combined chart, Statistics.

</frozen-after-approval>

## Tasks & Acceptance

**Execution:**
- [x] `e2e/journeys.spec.ts` -- UJ-1 on a 390x844 viewport, with the timing measurement -- covers the first and second Given.
- [x] `e2e/journeys.spec.ts` -- UJ-2 on a 390x844 viewport: add a forgotten day, edit a value, delete after confirmation -- covers the second Given.
- [x] `e2e/journeys.spec.ts` -- UJ-3 on a 1280x800 viewport: change Range, read Statistics and the Sleep chart, check the dashed bridge -- covers the third Given.
- [x] `e2e/journeys.spec.ts` -- UJ-1 with `context.setOffline(true)` before Save, then `setOffline(false)` and retry -- covers the fourth Given.
- [x] Fix any failing journey with the smallest product change, rerun, and record the result. (No journey failed on its final run; no product code changed.)

**Acceptance Criteria:**
- Given Playwright against the emulators and a phone viewport, when UJ-1 runs, then the Happy effect shows, the Missing banner is gone, the Entry exists, and the time is recorded against the target.
- Given UJ-2 runs, when each action is taken, then its outcome shows in History and the Gap for that day is solid.
- Given UJ-3 runs on desktop, when Range changes, then all charts and Statistics update together and the empty week is a dashed bridge.
- Given the network is cut during UJ-1, when Save is pressed, then the error shows, typed values stay, and a retry succeeds.

## Implementation Notes

- `e2e/journeys.spec.ts` (new): four tests, UJ-1 phone (with the timed cap), UJ-1 offline Save, UJ-2 phone, UJ-3 desktop. Each step is a `test.step`, so a failure names the step.
- `e2e/support.ts`: one helper added, `readEntry(uid, day)`, an admin-token read of one Entry from the emulator. Used by UJ-1 and the offline variant (the Entry-exists check) and by UJ-2 (the deleted Entry is gone). The rest of the file is unchanged.
- The Report's solid and dashed rendering is canvas, so the proofs use a probe installed before the page loads. It counts, per canvas, the non-empty `setLineDash` calls (dashed segments) and the strokes drawn. UJ-2 records the dashed total over the four Report charts before the forgotten day is added and asserts it drops after the day is filled. UJ-3 asserts that the combined chart and each of the Weight, Mood and Sleep charts draw at least one dashed segment at 30 d and at 90 d, and that the Sleep table shows the seeded 7.5 h for yesterday at 30 d. The Gap text is also checked through the "Show data as table" alternative.
- No product code changed.

## Verification

**Commands:**
- `npx playwright test e2e/journeys.spec.ts` -- expected: all four journeys pass; the UJ-1 time is printed.
- `npm run lint` -- expected: no errors.
- `npx ng test --watch=false` -- expected: all pass (no product code changed, so no new unit tests are required).

**Run in this session (2026-10-21, against the local Auth and Firestore emulators and the dev server on 4200):**
- Playwright, `e2e/journeys.spec.ts`: 4 passed (about 23 s). UJ-1 printed `Today opened to Save confirmed in 905 ms` on the first run and `1057 ms` on the final run, against the 30 000 ms cap.
- A first run of UJ-2 failed on the expected text alone: the Report table shows Weight as "73.2 kg", not "73.2". The expectation was corrected; no product change followed.
- `npm run lint`: exit 0.
- `npx ng test --watch=false`: 47 files, 745 tests passed.

**Manual checks (if no CLI):**
- None. The journeys are automated.
