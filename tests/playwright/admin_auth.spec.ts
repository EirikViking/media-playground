import { test, expect } from '@playwright/test';

test.describe('Admin Authentication', () => {

    // Helper to clear storage
    const clearStorage = async (page) => {
        await page.addInitScript(() => {
            sessionStorage.clear();
            localStorage.clear();
        });
    };

    test.beforeEach(async ({ page }) => {
        await clearStorage(page);
    });

    test('should allow login and persist session via remember me', async ({ page }) => {
        // 1. Go to admin page
        await page.goto('/admin');

        // 2. Expect login form
        await expect(page.getByTestId('admin-password-input')).toBeVisible();

        // 3. Login with Remember Me
        await page.getByTestId('admin-password-input').fill('eirik123'); // Default dev password
        await page.getByLabel('Remember me on this device').check();
        await page.getByTestId('admin-unlock-button').click();

        // 4. Verify logged in
        await expect(page.getByText('Total Projects')).toBeVisible({ timeout: 15000 });
        await expect(page.getByTestId('admin-password-input')).not.toBeVisible();

        // 5. Reload page
        await page.reload();

        // 6. Verify still logged in (no login form flash ideally, but definitely eventual state)
        await expect(page.getByText('Total Projects')).toBeVisible({ timeout: 15000 });
        await expect(page.getByTestId('admin-password-input')).not.toBeVisible();

        // 7. Check localStorage has token
        const token = await page.evaluate(() => localStorage.getItem('admin_token'));
        expect(token).toBeTruthy();
    });

    test('should persist session via sessionStorage (default)', async ({ page }) => {
        await page.goto('/admin');
        await page.getByTestId('admin-password-input').fill('eirik123');
        await page.getByTestId('admin-unlock-button').click();

        await expect(page.getByText('Total Projects')).toBeVisible();

        await page.reload();
        // Wait longer for data load, or check for error
        try {
            await expect(page.getByText('Total Projects')).toBeVisible({ timeout: 10000 });
        } catch (e) {
            // If failed, check if we see login form or error
            if (await page.getByTestId('admin-password-input').isVisible()) {
                throw new Error('Logged out after reload (SessionStorage lost)');
            }
            if (await page.getByText('Session expired').isVisible()) {
                throw new Error('Session expired (401) after reload');
            }
            throw e;
        }

        // Check sessionStorage
        const token = await page.evaluate(() => sessionStorage.getItem('admin_token'));
        expect(token).toBeTruthy();

        // Check localStorage is empty
        const localToken = await page.evaluate(() => localStorage.getItem('admin_token'));
        expect(localToken).toBeFalsy();
    });

    test.skip('should logout correctly', async ({ page }) => {
        await page.goto('/admin');
        await page.getByTestId('admin-password-input').fill('eirik123');
        await page.getByTestId('admin-unlock-button').click();
        await expect(page.getByText('Total Projects')).toBeVisible();

        await page.getByRole('button', { name: 'Log Out' }).click();
        await expect(page.getByTestId('admin-password-input')).toBeVisible();

        // Check storage cleared
        const sessionToken = await page.evaluate(() => sessionStorage.getItem('admin_token'));
        const localToken = await page.evaluate(() => localStorage.getItem('admin_token'));
        expect(sessionToken).toBeFalsy();
        expect(localToken).toBeFalsy();
    });

    test.skip('should handle invalid token (401 simulation)', async ({ page }) => {
        // Manually inject invalid token
        await page.addInitScript(() => {
            localStorage.setItem('admin_token', 'invalid_token_data');
        });

        await page.goto('/admin');

        // Should eventually show login form (after fetch fails with 401)
        // Admin page calls loadData() on mount if auth is true.
        // loadData -> authenticatedFetch -> 401 -> clears storage -> setIsAuthenticated(false).

        await expect(page.getByTestId('admin-password-input')).toBeVisible();
        await expect(page.getByText('Session expired or invalid credentials')).toBeVisible();
    });

});
