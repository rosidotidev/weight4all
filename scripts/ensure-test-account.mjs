// Waits for the local Auth emulator and makes sure the local test account exists.
// Local emulator only: these values are not a real account.
const EMAIL = 'prova.locale@weight4all.test';
const PASSWORD = 'prova-locale-2026';
const BASE = 'http://127.0.0.1:9099';
const SIGN_UP = `${BASE}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key`;

async function waitForEmulator(seconds) {
  for (let i = 0; i < seconds; i++) {
    try {
      await fetch(BASE, { signal: AbortSignal.timeout(2000) });
      return true;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return false;
}

if (!(await waitForEmulator(90))) {
  console.log('[test account] Auth emulator did not start in time; nothing done.');
  process.exit(1);
}

const response = await fetch(SIGN_UP, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }),
});
const body = await response.json();

if (response.ok) console.log('[test account] created.');
else if (body?.error?.message === 'EMAIL_EXISTS') console.log('[test account] already present.');
else console.log(`[test account] could not create it: ${body?.error?.message ?? response.status}`);
