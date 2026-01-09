import { test, expect } from '@playwright/test';

const API_BASE = process.env.VERIFY_API_BASE || 'http://127.0.0.1:8787';

test.describe('Admin Actions', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            (window as any).__E2E__ = true;
        });
    });

    test('community project delete flow UI', async ({ page }) => {
        // Mock using regex to match any host and query params
        await page.route(/\/api\/projects\/public/, async route => {
            console.log('Intercepted projects request');
            const json = {
                data: [
                    {
                        id: 'test-project-123',
                        title: 'Test Project',
                        data: '{}',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ]
            };
            await route.fulfill({ json });
        });

        await page.goto('/studio');
        await page.waitForSelector('[data-testid="app-ready"]');

        // Check if we can see the "Community Projects" section.
        await expect(page.getByText('Community Projects')).toBeVisible();

        // Check if our mocked project is there
        await expect(page.getByText('Test Project')).toBeVisible();

        // Check delete button exists (it should always exist for everyone, but triggers admin modal)
        const deleteBtn = page.getByTestId('delete-project-test-project-123');
        await expect(deleteBtn).toBeVisible();

        // Click delete
        await deleteBtn.click();

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
