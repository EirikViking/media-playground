import { test, expect } from '@playwright/test';

const API_BASE = process.env.VERIFY_API_BASE || 'http://127.0.0.1:8787';

test.describe('Admin Actions', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            (window as any).__E2E__ = true;
        });
    });

    test('community project delete flow UI', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        // Mock using regex to match any host and query params
        await page.route(/\/api\/projects/, async route => {
            console.log('Intercepted projects request');
            const json = [
                {
                    id: 'test-project-123',
                    title: 'Test Project',
                    data: '{}',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ];
            await route.fulfill({ json });
        });

        await page.goto('/');
        await page.waitForSelector('[data-testid="app-ready"]');

        // Navigate via UI to avoid strict 404s on some preview servers
        await page.getByTestId('card-studio').click();
        await expect(page).toHaveURL('/studio');
        await page.waitForSelector('[data-testid="app-ready"]');

        // Check if we can see the "Recent Projects" section.     
        await expect(page.getByText('Recent Projects')).toBeVisible();

        // Check if our mocked project is there
        await expect(page.getByText('Test Project')).toBeVisible();

        // Check delete button exists (it should always exist for everyone, but triggers admin modal)
        const deleteBtn = page.getByTestId('delete-project-test-project-123');
        await expect(deleteBtn).toBeVisible();

        // Hover to show button
        await page.getByText('Test Project').hover();

        // Click delete (force because it might be hidden by opacity)
        await deleteBtn.click({ force: true });

        // Expect Modal
        await expect(page.getByTestId('admin-password-modal')).toBeVisible();
        await expect(page.getByText('Delete "Test Project"?')).toBeVisible();

        // Check input
        await expect(page.getByTestId('admin-password-input')).toBeVisible();

        // Close modal
        await page.getByText('Cancel').click();
        await expect(page.getByTestId('admin-password-modal')).not.toBeVisible();
    });
});
