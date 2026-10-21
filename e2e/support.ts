import { randomUUID } from 'node:crypto';
import { expect, Page } from '@playwright/test';

// Emulator-only helpers. The project id and API key match scripts/emulators.mjs and src/environments/environment.ts.
const AUTH = 'http://localhost:9099';
const FIRESTORE = 'http://localhost:8080';
const PROJECT = 'demo-weight4all';
const API_KEY = 'demo-api-key';
// The emulator's admin token: bypasses the security rules for seeding only.
const ADMIN = { Authorization: 'Bearer owner' };

export interface TestAccount {
  readonly email: string;
  readonly password: string;
  readonly uid: string;
}

/** A fetch to a local emulator, with a message that names the emulator when it is not running. */
async function emulatorFetch(url: string, init: RequestInit, name: string, port: number): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (cause) {
    throw new Error(`The ${name} emulator is not reachable on localhost:${port}. Run "npm run emulators" first.`, {
      cause,
    });
  }
}

/** Creates a fresh account on the Auth emulator. Nothing here reaches a real project. */
export async function createAccount(): Promise<TestAccount> {
  const email = `e2e-${randomUUID()}@weight4all.test`;
  const password = 'e2e-password-123';
  const response = await emulatorFetch(
    `${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
    'Auth',
    9099,
  );
  expect(response.ok, 'emulator sign-up').toBe(true);
  const body = (await response.json()) as { localId: string };
  return { email, password, uid: body.localId };
}

/** Writes Entries for a user: `days` maps a Day key to its values (Dimension key to number). */
export async function seedEntries(uid: string, days: Record<string, Record<string, number>>): Promise<void> {
  for (const [day, values] of Object.entries(days)) {
    const fields: Record<string, { doubleValue: number }> = {};
    for (const [key, value] of Object.entries(values)) fields[key] = { doubleValue: value };
    const url = `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/users/${uid}/entries/${day}`;
    const response = await emulatorFetch(
      url,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...ADMIN },
        body: JSON.stringify({ fields }),
      },
      'Firestore',
      8080,
    );
    expect(response.ok, `seed ${day}`).toBe(true);
  }
}

/** Signs in through the login form, the same way a user does. */
export async function signIn(page: Page, account: TestAccount): Promise<void> {
  await page.goto('/login');
  await page.locator('#login-email').fill(account.email);
  await page.locator('#login-password').fill(account.password);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(/\/today$/);
}

/** Sets the Language before the app starts, through the cache the app reads first. */
export async function setLanguage(page: Page, language: 'en' | 'it'): Promise<void> {
  await page.addInitScript((lang) => localStorage.setItem('w4a.language', lang), language);
}

/** Local day key `YYYY-MM-DD` for `offset` days from today. */
export function dayKey(offset: number): string {
  // The seeded keys must match the device-local Day the app uses (NFR-3). The AD-4 clock rule guards app code,
  // not this test fixture, so the one clock read is allowed here on purpose. The keys are computed once per run
  // by the caller; a run that crosses midnight may disagree with the app about "today".
  // eslint-disable-next-line no-restricted-syntax
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
