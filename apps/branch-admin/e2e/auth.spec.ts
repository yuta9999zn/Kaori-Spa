import { test, expect } from '@playwright/test';

/**
 * Smoke test: a fresh browser hits / and gets redirected to /vi/login.
 * After invalid credentials, the form shows an error.
 */

test.describe('auth', () => {
  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/vi\/login$/);
    await expect(page.getByRole('heading', { name: /natural beauty/i })).toBeVisible();
  });

  test('rejects bad credentials', async ({ page }) => {
    await page.goto('/vi/login');
    await page.getByLabel(/email/i).fill('miko@naturalbeauty.vn');
    await page.getByLabel(/mật khẩu/i).fill('wrong-password');
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    await expect(page.locator('text=/Email hoặc mật khẩu không đúng|incorrect/i')).toBeVisible({
      timeout: 10_000
    });
  });
});
