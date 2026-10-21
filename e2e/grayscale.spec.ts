import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { createAccount, dayKey, seedEntries, setLanguage, signIn, TestAccount } from './support';

// Story 5.2: never rely on color alone. Each screen is viewed in grayscale (a CSS filter on html) and saved as a
// PNG outside the repository, so the cues can be checked by eye. The screenshots are reviewed by hand; this test
// only checks that the screens reach the state being photographed and that the files are written.
const OUT_DIR = 'C:\\Users\\ROBERT~1\\AppData\\Local\\Temp\\claude\\C--Users-Roberto-Sidoti-Desktop-dev-claude-weight4all\\grayscale-5-2';
const GRAYSCALE_STYLE = 'html { filter: grayscale(1) !important; }';

let account: TestAccount;

test.beforeAll(async () => {
  mkdirSync(OUT_DIR, { recursive: true });
  account = await createAccount();
  const days: Record<string, Record<string, number>> = {};
  // Today has a Mood, so one face is selected on the Today screen.
  days[dayKey(0)] = { weight: 72.4, mood: 7, sleep: 7.5 };
  // The last 30 days, with a Gap every third day, so the Report chart shows dashed segments.
  for (let offset = -29; offset <= -1; offset++) {
    if (offset % 3 === 0) continue;
    days[dayKey(offset)] = { weight: 72 + (offset % 5) * 0.3, mood: 5 + (offset % 4), sleep: 6.5 + (offset % 3) * 0.5 };
  }
  await seedEntries(account.uid, days);
});

/** Adds the grayscale filter to the page, then waits a frame so the filter is painted before the capture. */
async function grayscale(page: import('@playwright/test').Page): Promise<void> {
  await page.addStyleTag({ content: GRAYSCALE_STYLE });
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
}

test('Today, Report and Settings in grayscale are saved as screenshots', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await setLanguage(page, 'en');
    await signIn(page, account);

    // Today: Mood faces with a value selected.
    await page.goto('/today');
    await expect(page.locator('.face.selected').first(), 'a Mood face is selected on Today').toBeVisible({
      timeout: 20_000,
    });
    await grayscale(page);
    await page.screenshot({ path: join(OUT_DIR, 'today-mood-grayscale.png'), fullPage: true });

    // Report: the 30 d chip selected, the combined chart with Gaps, and the data table.
    await page.goto('/report');
    const thirty = page.getByRole('radio', { name: '30 d', exact: true });
    await thirty.click();
    await expect(thirty, 'the 30 d chip is selected').toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('section.chart-card.combined w4a-combined-chart'), 'the combined chart is drawn').toBeVisible({
      timeout: 20_000,
    });
    await grayscale(page);
    await page.screenshot({ path: join(OUT_DIR, 'report-chart-grayscale.png'), fullPage: true });

    // Settings: Language segments and accent swatches, one of each selected.
    await page.goto('/settings');
    await expect(page.locator('.segment input:checked').first(), 'a Language segment is selected').toBeAttached({
      timeout: 20_000,
    });
    await expect(page.locator('.swatch input:checked').first(), 'an accent swatch is selected').toBeAttached();
    await grayscale(page);
    await page.screenshot({ path: join(OUT_DIR, 'settings-grayscale.png'), fullPage: true });
  } finally {
    await context.close();
  }
});
