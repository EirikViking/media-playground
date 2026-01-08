import { test, expect } from '@playwright/test';

test('admin panel - auth and summary', async ({ page }) => {
    await page.goto('/admin');

    // Check strict auth UI
    await expect(page.getByText('Restricted Access')).toBeVisible();
    await expect(page.getByTestId('admin-password-input')).toBeVisible();

    // Attempt with wrong password (mocking not strictly needed as real backend handles it, but for E2E we can try)
    // Note: For local E2E against real worker, we rely on the worker having checks.
    // We'll trust the happy path for smoke test.

    // Enter password
    await page.getByTestId('admin-password-input').fill('eirik123');
    await page.getByTestId('admin-unlock-button').click();

    // Should see dashboard
    await expect(page.getByTestId('admin-summary')).toBeVisible();
    await expect(page.getByText('Total Projects')).toBeVisible();
});
