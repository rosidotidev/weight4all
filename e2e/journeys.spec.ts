import { expect, Locator, Page, test } from '@playwright/test';
import {
  createAccount,
  dayKey,
  readEntry,
  seedEntries,
  seedEntriesBatch,
  setLanguage,
  signIn,
} from './support';

// Story 5.5: the three key journeys, end to end, against the local emulators. The journeys drive the real
// controls; the only writes outside the UI are the seeds (seedEntries, seedEntriesBatch) and the emulator read
// (readEntry). The UJ-1 time budget is a hard cap and is not to be tightened or loosened to pass a run.
const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };
const UJ1_BUDGET_MS = 30_000;

/** The Weight field on Today and in Entry edit. */
const weightField = (page: Page) => page.locator('#w4a-field-weight');

/** The Report's combined chart text alternative, opened with "Show data as table". */
async function openCombinedTable(page: Page): Promise<void> {
  await page
    .locator('section.combined')
    .getByRole('button', { name: 'Show data as table' })
    .click();
  await expect(
    page.locator('section.combined table tbody tr').first(),
    'combined table rows',
  ).toBeVisible();
}

/** The Weight cell of the combined table for a Day, `offset` Days from today (0 is today; the range ends today). */
function weightCell(page: Page, offset: number, rangeDays: number) {
  return page
    .locator('section.combined table tbody tr')
    .nth(rangeDays - 1 + offset)
    .locator('td')
    .nth(0);
}

/**
 * Records, per canvas, how many dashed segments Chart.js sets (non-empty setLineDash) and how many strokes it
 * draws. Installed before the page loads, so every Report visit in the test is covered.
 */
async function installChartProbe(page: Page): Promise<void> {
  await page.addInitScript(() => {
    type Probed = HTMLCanvasElement & { __dashDraws?: number; __strokes?: number };
    const proto = CanvasRenderingContext2D.prototype;
    const originalDash = proto.setLineDash;
    proto.setLineDash = function (this: CanvasRenderingContext2D, segments: number[]) {
      const canvas = this.canvas as Probed;
      if (segments.length > 0) canvas.__dashDraws = (canvas.__dashDraws ?? 0) + 1;
      return originalDash.call(this, segments);
    };
    const originalStroke = proto.stroke;
    proto.stroke = function (this: CanvasRenderingContext2D, ...args: unknown[]) {
      const canvas = this.canvas as Probed;
      canvas.__strokes = (canvas.__strokes ?? 0) + 1;
      return (originalStroke as (...rest: unknown[]) => void).apply(this, args);
    };
  });
}

interface CanvasProbe {
  readonly dashed: number;
  readonly strokes: number;
}

/** The probe counts of every canvas in the locator, in document order. */
function probeOf(canvases: Locator): Promise<CanvasProbe[]> {
  return canvases.evaluateAll((elements) =>
    elements.map((element) => {
      const canvas = element as HTMLCanvasElement & { __dashDraws?: number; __strokes?: number };
      return { dashed: canvas.__dashDraws ?? 0, strokes: canvas.__strokes ?? 0 };
    }),
  );
}

/** Zeroes the dashed counts of the canvases in the locator, before a Range change. */
function resetDashed(canvases: Locator): Promise<void> {
  return canvases.evaluateAll((elements) => {
    for (const element of elements) {
      (element as HTMLCanvasElement & { __dashDraws?: number }).__dashDraws = 0;
    }
  });
}

/** The Report's chart canvases: the combined chart first, then Weight, Mood and Sleep. */
const reportCanvases = (page: Page) => page.locator('section.chart-card canvas');

/** Waits until all four Report charts have drawn, then returns the total dashed segments drawn over them. */
async function reportDashedTotal(page: Page): Promise<number> {
  await expect
    .poll(
      async () => {
        const probes = await probeOf(reportCanvases(page));
        return probes.length === 4 && probes.every((probe) => probe.strokes > 0);
      },
      { message: 'all four Report charts drawn' },
    )
    .toBe(true);
  return (await probeOf(reportCanvases(page))).reduce((sum, probe) => sum + probe.dashed, 0);
}

test.describe('UJ-1 log today on a phone', () => {
  test.use({ viewport: PHONE });

  test('adjust Weight, pick a face, set Sleep, Save: Happy effect, banner gone, Entry exists, under 30 s', async ({
    page,
  }) => {
    const account = await createAccount();
    await seedEntries(account.uid, { [dayKey(-1)]: { weight: 72.5, sleep: 6.5 } });
    await setLanguage(page, 'en');
    await signIn(page, account);

    // The clock starts when Today is opened and stops when the Save is confirmed (the Happy effect shows).
    const started = performance.now();
    await test.step('open Today with the Missing-entry banner', async () => {
      await page.goto('/today');
      await expect(weightField(page), 'Weight starts from the last Weight').toHaveValue('72.5');
      await expect(page.locator('.banner'), 'Missing banner before Save').toBeVisible();
    });
    await test.step('adjust Weight by one step', async () => {
      await page.getByRole('button', { name: 'Increase weight by 0.1 kg' }).click();
      await expect(weightField(page)).toHaveValue('72.6');
    });
    await test.step('pick the face for Mood 7', async () => {
      const seven = page.getByRole('radio', { name: 'Mood 7 of 10', exact: true });
      await seven.click();
      await expect(seven, 'Mood 7 selected').toHaveAttribute('aria-checked', 'true');
    });
    await test.step('set Sleep to 7.5 h with the keyboard', async () => {
      const slider = page.locator('#w4a-field-sleep input');
      await slider.focus();
      for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
      await expect(slider, 'Sleep slider at 7.5').toHaveValue('7.5');
    });
    await test.step('Save and see the Happy effect', async () => {
      await page.locator('button.save').click();
      await expect(page.locator('#w4a-effect-title'), 'Happy effect title').toHaveText('Saved!');
    });
    const elapsed = Math.round(performance.now() - started);
    console.log(
      `[journey] UJ-1 phone: Today opened to Save confirmed in ${elapsed} ms (target ${UJ1_BUDGET_MS} ms)`,
    );

    await test.step('the Missing banner is gone and the Entry exists', async () => {
      await expect(page.locator('.banner'), 'Missing banner after Save').toHaveCount(0);
      expect(await readEntry(account.uid, dayKey(0)), 'today Entry in the emulator').toEqual({
        weight: 72.6,
        mood: 7,
        sleep: 7.5,
      });
    });
    expect(elapsed, `UJ-1 took ${elapsed} ms, target ${UJ1_BUDGET_MS} ms`).toBeLessThanOrEqual(
      UJ1_BUDGET_MS,
    );
  });
});

test.describe('UJ-1 offline Save on a phone', () => {
  test.use({ viewport: PHONE });

  test('network cut before Save: error shows, values stay, retry after restore succeeds', async ({
    page,
    context,
  }) => {
    const account = await createAccount();
    await seedEntries(account.uid, { [dayKey(-1)]: { weight: 72.5, sleep: 6.5 } });
    await setLanguage(page, 'en');
    await signIn(page, account);

    await test.step('log today up to Save', async () => {
      await page.goto('/today');
      await expect(weightField(page)).toHaveValue('72.5');
      await page.getByRole('button', { name: 'Increase weight by 0.1 kg' }).click();
      await page.getByRole('radio', { name: 'Mood 7 of 10', exact: true }).click();
      const slider = page.locator('#w4a-field-sleep input');
      await slider.focus();
      for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
      await expect(slider).toHaveValue('7.5');
    });

    await test.step('Save while offline shows the error and keeps the values', async () => {
      await context.setOffline(true);
      await page.locator('button.save').click();
      await expect(page.locator('#w4a-message-weight'), 'inline save error').toContainText(
        /Couldn't save/,
        { timeout: 25_000 },
      );
      await expect(weightField(page), 'typed Weight kept').toHaveValue('72.6');
      await expect(
        page.getByRole('radio', { name: 'Mood 7 of 10', exact: true }),
        'Mood kept',
      ).toHaveAttribute('aria-checked', 'true');
      await expect(page.locator('#w4a-field-sleep input'), 'Sleep kept').toHaveValue('7.5');
      await expect(
        page.locator('#w4a-effect-title'),
        'no Happy effect for an unsaved Entry',
      ).toHaveCount(0);
      await expect(page.locator('.banner'), 'Missing banner still shown').toBeVisible();
    });

    await test.step('restore the network and retry Save', async () => {
      await context.setOffline(false);
      await page.locator('button.save').click();
      await expect(page.locator('#w4a-effect-title'), 'Happy effect after the retry').toHaveText(
        'Saved!',
        {
          timeout: 30_000,
        },
      );
    });

    await test.step('the Entry exists in the emulator', async () => {
      expect(await readEntry(account.uid, dayKey(0)), 'today Entry in the emulator').toEqual({
        weight: 72.6,
        mood: 7,
        sleep: 7.5,
      });
    });
  });
});

test.describe('UJ-2 fix History on a phone', () => {
  test.use({ viewport: PHONE });

  test('add a forgotten day, edit a wrong value, delete after confirming; Report Gap follows', async ({
    page,
  }) => {
    const account = await createAccount();
    // Day -3 is the forgotten one; day -1 holds the wrong Weight; day -4 is deleted at the end.
    await seedEntries(account.uid, {
      [dayKey(-6)]: { weight: 74.0, mood: 5, sleep: 7 },
      [dayKey(-5)]: { weight: 73.8, mood: 6, sleep: 6.5 },
      [dayKey(-4)]: { weight: 73.5, mood: 6, sleep: 7 },
      [dayKey(-2)]: { weight: 73.0, mood: 5, sleep: 7 },
      [dayKey(-1)]: { weight: 79.9, mood: 5, sleep: 7 },
    });
    await installChartProbe(page);
    await setLanguage(page, 'en');
    await signIn(page, account);

    const row = (offset: number) => page.locator(`a.row.entry[href="/history/${dayKey(offset)}"]`);
    const addLink = (offset: number) => page.locator(`a.add[href="/history/${dayKey(offset)}"]`);
    let dashedBefore = 0;

    await test.step('the Report shows a Gap for the missing day, drawn dashed', async () => {
      await page.goto('/report');
      await openCombinedTable(page);
      await expect(weightCell(page, -3, 30), 'Weight for the missing day').toHaveText('—');
      dashedBefore = await reportDashedTotal(page);
      expect(dashedBefore, 'dashed segments over the Gap before the day is added').toBeGreaterThan(
        0,
      );
    });

    await test.step('add the forgotten day from History', async () => {
      await page.goto('/history');
      await expect(addLink(-3), 'the missing day has an Add action').toBeVisible();
      await addLink(-3).click();
      await expect(weightField(page), 'Entry edit for the missing day').toBeVisible();
      await weightField(page).fill('73.2');
      await page.locator('button.save').click();
      await page.waitForURL(/\/history$/);
      await expect(row(-3), 'added day shows its value in History').toContainText('73.2');
    });

    await test.step('the filled day no longer bridges: fewer dashed segments', async () => {
      await page.goto('/report');
      const dashedAfter = await reportDashedTotal(page);
      expect(
        dashedAfter,
        `dashed segments after the day is filled (before: ${dashedBefore})`,
      ).toBeLessThan(dashedBefore);
      await page.goto('/history');
    });

    await test.step('edit the wrong value', async () => {
      await row(-1).click();
      await expect(weightField(page)).toHaveValue('79.9');
      await weightField(page).fill('72.4');
      await page.locator('button.save').click();
      await page.waitForURL(/\/history$/);
      await expect(row(-1), 'edited value shows in History').toContainText('72.4');
      await expect(row(-1), 'wrong value is gone').not.toContainText('79.9');
    });

    await test.step('delete a Day after confirming', async () => {
      const item = page.locator('.item', { has: row(-4) });
      await item.locator('button.more').click();
      await page.locator('button.delete-item').click();
      const dialog = page.getByRole('alertdialog');
      await expect(dialog, 'delete confirmation').toBeVisible();
      await dialog.locator('button.confirm').click();
      await expect(row(-4), 'deleted day is gone from History').toHaveCount(0);
      await expect(addLink(-4), 'deleted day shows as missing again').toBeVisible();
      expect(await readEntry(account.uid, dayKey(-4)), 'deleted Entry in the emulator').toBeNull();
    });

    await test.step('the Report Gap for the added day is solid', async () => {
      await page.goto('/report');
      await openCombinedTable(page);
      await expect(weightCell(page, -3, 30), 'Weight for the added day').toHaveText('73.2 kg');
      await expect(weightCell(page, -4, 30), 'Weight for the deleted day').toHaveText('—');
    });
  });
});

test.describe('UJ-3 read the Report on a desktop', () => {
  test.use({ viewport: DESKTOP });

  test('change Range: every chart and Statistics update, the empty week is a dashed bridge', async ({
    page,
  }) => {
    // Entries every day for the last 60 Days except a week with no log (offsets -10 to -16).
    const days: Record<string, Record<string, number>> = {};
    for (let k = 1; k <= 60; k++) {
      if (k >= 10 && k <= 16) continue;
      days[dayKey(-k)] = {
        weight: 75 + ((k * 37) % 17) * 0.1,
        mood: 1 + ((k * 3) % 10),
        sleep: 5 + ((k * 5) % 9) * 0.5,
      };
    }
    const account = await createAccount();
    await seedEntriesBatch(account.uid, days);

    await installChartProbe(page);
    await setLanguage(page, 'en');
    await signIn(page, account);

    /** The mean of the Real values of one Dimension over the last `rangeDays` Days, ending today. */
    const expectedAverage = (key: 'weight' | 'mood' | 'sleep', rangeDays: number): number => {
      const values: number[] = [];
      for (let k = 0; k < rangeDays; k++) {
        const value = days[dayKey(-k)]?.[key];
        if (value !== undefined) values.push(value);
      }
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    };
    const averageOf = (name: string) =>
      page
        .locator(`section.card[aria-label="${name}"] .cell`, {
          has: page.locator('dt', { hasText: 'Average' }),
        })
        .locator('dd');
    const readAverage = async (name: string): Promise<number> => {
      const text = (await averageOf(name).innerText()).trim();
      const match = /-?\d+(?:\.\d+)?/.exec(text);
      if (!match) throw new Error(`No number in the ${name} average: "${text}"`);
      return Number(match[0]);
    };
    const expectStatistics = async (rangeDays: number) => {
      for (const [name, key] of [
        ['Weight', 'weight'],
        ['Mood', 'mood'],
        ['Sleep', 'sleep'],
      ] as const) {
        await expect
          .poll(() => readAverage(name), { message: `${name} average over ${rangeDays} Days` })
          .toBeCloseTo(expectedAverage(key, rangeDays), 1);
      }
    };
    // Each dimension chart has its own "Show data as table" toggle; the text tables give the Days each chart draws.
    const openDimensionTables = async () => {
      const toggles = page.locator('div.charts section.chart-card button.toggle');
      for (let i = 0; i < 3; i++) {
        if ((await toggles.nth(i).getAttribute('aria-expanded')) !== 'true')
          await toggles.nth(i).click();
      }
    };
    const expectRows = async (rows: number) => {
      await expect(
        page.locator('section.combined table tbody tr'),
        `combined chart Days in the Range`,
      ).toHaveCount(rows);
      await expect(
        page.locator('div.charts section.chart-card table tbody tr'),
        `dimension charts Days in the Range`,
      ).toHaveCount(rows * 3);
    };

    /** Each chart (combined, Weight, Mood, Sleep) draws at least one dashed segment: the bridge is on every chart. */
    const expectDashedOnEveryChart = async (message: string) => {
      await expect
        .poll(async () => (await probeOf(reportCanvases(page))).map((probe) => probe.dashed > 0), {
          message,
        })
        .toEqual([true, true, true, true]);
    };

    await test.step('the 30 d Report shows the combined and dimension charts and Statistics', async () => {
      await page.goto('/report');
      await expect(page.locator('.card .caption').first()).toHaveText('last 30 days');
      await openCombinedTable(page);
      await openDimensionTables();
      await expect(
        page.locator('div.charts canvas').first(),
        'a dimension chart canvas is drawn',
      ).toBeVisible();
      await expectRows(30);
      await expectStatistics(30);
    });

    await test.step('the empty week is a dashed bridge on every chart at 30 d', async () => {
      await expect(weightCell(page, -13, 30), 'Weight in the empty week').toHaveText('—');
      await expect(weightCell(page, -9, 30), 'Weight before the empty week').not.toHaveText('—');
      await expectDashedOnEveryChart(
        'combined, Weight, Mood and Sleep charts each draw a dashed segment (30 d)',
      );
    });

    await test.step('the Sleep chart shows its seeded value at 30 d', async () => {
      // Offset -1 is seeded with sleep 7.5 (k = 1: 5 + (5 mod 9) x 0.5).
      const sleepRows = page
        .locator('div.charts section.chart-card')
        .nth(2)
        .locator('table tbody tr');
      await expect(
        sleepRows
          .nth(30 - 1 - 1)
          .locator('td')
          .nth(0),
        'Sleep for yesterday',
      ).toHaveText('7.5 h');
    });

    await test.step('change Range to 7 d: every chart and Statistic follows', async () => {
      await page.getByRole('radio', { name: '7 d', exact: true }).click();
      await expect(page.locator('.card .caption').first()).toHaveText('last 7 days');
      await expectRows(7);
      await expectStatistics(7);
    });

    await test.step('change Range to 90 d: the empty week stays a dashed bridge on every chart', async () => {
      await resetDashed(reportCanvases(page));
      await page.getByRole('radio', { name: '90 d', exact: true }).click();
      await expect(page.locator('.card .caption').first()).toHaveText('last 90 days');
      await expectRows(90);
      await expectStatistics(90);
      await expect(weightCell(page, -13, 90), 'Weight in the empty week (90 d)').toHaveText('—');
      await expectDashedOnEveryChart(
        'combined, Weight, Mood and Sleep charts each draw a dashed segment (90 d)',
      );
    });
  });
});
