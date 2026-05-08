import { test, expect } from '@playwright/test';

/**
 * Critical path: create a booking after login.
 *
 * Skipped in CI for now — needs the full backend stack (auth, catalog,
 * availability) running. The plumbing here documents the expected flow so
 * tests can be enabled once docker-compose CI is wired.
 */

test.describe('booking creation', () => {
  test.skip(({ }, testInfo) => process.env.CI === 'true' && !process.env.RUN_E2E,
    'requires backend services');

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('kaori.accessToken', 'test-jwt-stub');
      window.localStorage.setItem('kaori.refreshToken', 'test-refresh-stub');
      window.localStorage.setItem('kaori.user', JSON.stringify({
        id: 'test-user', email: 'miko@naturalbeauty.vn', locale: 'vi',
        roles: ['BRANCH_MANAGER']
      }));
    });
  });

  test('end-to-end booking — search customer, pick service, confirm', async ({ page }) => {
    await page.goto('/vi/booking/new');
    await expect(page.getByRole('heading', { name: /tạo booking/i })).toBeVisible();

    // Step 1: search a customer.
    await page.getByPlaceholder(/tìm theo tên/i).fill('Miko');
    // Wait for the dropdown.
    const firstResult = page.locator('button:has-text("KH-2026-")').first();
    if (await firstResult.isVisible()) await firstResult.click();

    // Step 2: pick the first service.
    const firstService = page.locator('[role="button"]:has-text("phút")').first();
    if (await firstService.isVisible()) await firstService.click();

    // Step 3: search slots.
    await page.getByRole('button', { name: /tìm slot trống/i }).click();
    const firstSlot = page.locator('button:has-text("·")').first();
    if (await firstSlot.isVisible()) await firstSlot.click();

    // Confirm button should now be enabled.
    const confirm = page.getByRole('button', { name: /xác nhận đặt lịch/i });
    await expect(confirm).toBeEnabled();
  });
});
