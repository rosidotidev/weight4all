import { expect, test } from '@playwright/test';
import { createAccount, dayKey, seedEntries, setLanguage, signIn, TestAccount } from './support';

// Story 5.3: a window change keeps unsaved input on Today and the selected Range on Report,
// and a wrong password shows an error and reaches no Tab.
let account: TestAccount;

test.beforeAll(async () => {
  account = await createAccount();
  const days: Record<string, Record<string, number>> = {};
  for (let offset = -40; offset <= -1; offset += 2) {
    days[dayKey(offset)] = { weight: 72 + (offset % 4) * 0.4, mood: 5 + (offset % 4), sleep: 6.5 };
  }
  await seedEntries(account.uid, days);
});

/** Resizes the window and checks that the viewport really changed, so the test covers a real window change. */
async function resizeTo(page: import('@playwright/test').Page, width: number): Promise<void> {
  await page.setViewportSize({ width, height: 800 });
  await expect
    .poll(() => page.evaluate(() => window.innerWidth), { message: `viewport after resize to ${width} px` })
    .toBe(width);
}

test('typed weight on Today survives a window change', async ({ browser }) => {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await setLanguage(page, 'en');
    await page.setViewportSize({ width: 360, height: 800 });
    await signIn(page, account);

    // The id sits on the weight input itself (entry-form.component.html, the numeric field).
    const weight = page.locator('#w4a-field-weight');
    await weight.waitFor({ timeout: 20_000 });
    await weight.fill('71.4');
    await expect(weight, 'weight before any resize').toHaveValue('71.4');

    for (const width of [1280, 768, 360]) {
      await resizeTo(page, width);
      await expect(weight, `weight field after resize to ${width} px`).toHaveValue('71.4');
    }
  } finally {
    await context.close();
  }
});

test('selected Range on Report survives a window change', async ({ browser }) => {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await setLanguage(page, 'en');
    await page.setViewportSize({ width: 360, height: 800 });
    await signIn(page, account);

    await page.goto('/report');
    // Exact name: "90 d" in English. Other radio groups on the page do not match.
    const ninety = page.getByRole('radio', { name: '90 d', exact: true });
    await ninety.waitFor({ timeout: 20_000 });
    await ninety.click();
    await expect(ninety, 'Range 90 d before any resize').toHaveAttribute('aria-checked', 'true');

    for (const width of [1280, 768, 360]) {
      await resizeTo(page, width);
      await expect(ninety, `Range 90 d after resize to ${width} px`).toHaveAttribute('aria-checked', 'true');
      await expect(
        page.getByRole('radio', { checked: true }),
        `only one Range checked after resize to ${width} px`,
      ).toHaveCount(1);
    }
  } finally {
    await context.close();
  }
});

test('wrong password shows an error and leaves no session', async ({ browser }) => {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await setLanguage(page, 'en');
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/login');
    await page.locator('#login-email').fill(account.email);
    await page.locator('#login-password').fill('wrong-password-123');
    await page.locator('form button[type="submit"]').click();

    // Wrong credentials show one message under the email field (login.component.ts). English only: Italian is a known gap.
    await expect(page.locator('#login-email-error'), 'sign-in error message').toContainText(/do not match/, {
      timeout: 20_000,
    });
    expect(new URL(page.url()).pathname, 'path after failed sign-in').toBe('/login');
    // No session was kept: a Tab redirects back to login.
    await page.goto('/today');
    await expect(page, 'Today redirects to login without a session').toHaveURL(/\/login$/);
  } finally {
    await context.close();
  }
});
