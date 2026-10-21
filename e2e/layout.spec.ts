import { expect, test } from '@playwright/test';
import { createAccount, dayKey, seedEntries, setLanguage, signIn, TestAccount } from './support';

// Story 5.3: the four Tabs at 360, 768 and 1280 px, in English and in Italian, with no horizontal scroll.
// Chromium only: Edge, Firefox, Safari and the mobile browser profiles are recorded as known gaps in the spec.
const WIDTHS = [360, 768, 1280];
const TABS = ['/today', '/history', '/report', '/settings'];

let account: TestAccount;

test.beforeAll(async () => {
  account = await createAccount();
  const days: Record<string, Record<string, number>> = {};
  for (let offset = -20; offset <= -1; offset += 2) {
    days[dayKey(offset)] = { weight: 72 + (offset % 5) * 0.3, mood: 6 + (offset % 3), sleep: 7 };
  }
  await seedEntries(account.uid, days);
});

/**
 * Horizontal overflow of the page and of the Tab content. The shell clips its content (`.content` has
 * overflow-x hidden), so the document alone would miss overflow inside it.
 */
async function overflowPx(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => {
    const doc = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const content = document.querySelector<HTMLElement>('.content');
    const inner = content ? content.scrollWidth - content.clientWidth : 0;
    return Math.max(doc, inner);
  });
}

for (const language of ['en', 'it'] as const) {
  test(`every Tab fits at 360, 768 and 1280 px in ${language}`, async ({ browser }) => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await setLanguage(page, language);
      await signIn(page, account);

      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 800 });
        for (const path of TABS) {
          await page.goto(path);
          // The URL must be the Tab itself, not a redirect to login or to Today.
          await expect(page, `${path} reached at ${width} px in ${language}`).toHaveURL(new RegExp(`${path}$`));
          // Wait for the Tab's own content, not the shell heading, which is there on every page.
          await page.waitForFunction(
            () => (document.querySelector('.content')?.textContent ?? '').trim().length > 40,
            undefined,
            { timeout: 20_000 },
          );
          expect(await overflowPx(page), `overflow of ${path} at ${width} px in ${language}`).toBeLessThanOrEqual(0);
          expect(await page.evaluate(() => document.documentElement.lang), 'html lang').toBe(language);
        }
      }
    } finally {
      await context.close();
    }
  });
}
