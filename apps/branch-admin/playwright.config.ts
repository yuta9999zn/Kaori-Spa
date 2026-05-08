import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke + critical-path tests for branch-admin. Runs against a started
 * dev server (or staging URL via PW_BASE_URL).
 *
 * Mobile + desktop projects are both included because the operating
 * surface for receptionists is half tablets / half phones in production.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: process.env.PW_BASE_URL ?? 'http://localhost:3002',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-iphone-14', use: { ...devices['iPhone 14'] } },
    { name: 'tablet-ipad',      use: { ...devices['iPad (gen 7)'] } }
  ],

  webServer: process.env.CI ? undefined : {
    command: 'pnpm dev',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
});
