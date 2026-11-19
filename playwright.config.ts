import { defineConfig, devices } from '@playwright/test';

const port = 3002;
const baseURL = process.env.NEXT_PUBLIC_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 0 : 0,
  workers: 1,
  // CI stops after 3 failures: one broken flow fails several tests in a row, and each failure waits out its timeout.
  // Locally every test runs, so one run shows every failure.
  maxFailures: process.env.CI ? 3 : 0,
  // Every test fits the 60s default; the slowest green CI runs take under 30s. Do not raise it per test or per file.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Recording slows every test, and with no retries the trace and screenshot already cover a failure.
    video: process.env.CI ? 'off' : 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
      grep: /UX-02|PUB-02 mobile/,
    },
  ],
  webServer: {
    command: `yarn start --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
