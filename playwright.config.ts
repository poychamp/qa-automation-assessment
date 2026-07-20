import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'ui',
      testDir: './tests/ui',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://www.saucedemo.com',
        // saucedemo marks elements with data-test, not the default data-testid
        testIdAttribute: 'data-test',
        // Demo/debug aid for headed runs, off by default (SLOWMO=600 to enable)
        launchOptions: { slowMo: Number(process.env.SLOWMO ?? 0) },
      },
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: 'https://restful-booker.herokuapp.com',
        // public Heroku sandbox cold-starts; allow a slow first response
        extraHTTPHeaders: { Accept: 'application/json' },
      },
      timeout: 30_000,
    },
  ],
});
