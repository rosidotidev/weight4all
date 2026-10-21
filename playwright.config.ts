import { defineConfig, devices } from '@playwright/test';

// End-to-end checks against the local emulators (Auth 9099, Firestore 8080) and the dev server (4200).
// The emulators are not started here: run `npm run emulators` first. The dev server is started below
// unless one is already running. Only local hosts are used.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  reporter: [['list']],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 180_000,
  },
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
