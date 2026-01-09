import { test, expect } from '@playwright/test';

// Use a larger viewport to ensure desktop navigation is visible
test.use({ viewport: { width: 1280, height: 720 } });

test.describe('Navigation and Hub', () => {
    test('home page displays hub with all sections', async ({ page }) => {
        await page.goto('/');

        // Check title
        await expect(page).toHaveTitle(/Kurt Edgar/i);

        // Check main heading strict match inside h1
        await expect(page.locator('h1').getByText('PLAYGROUND')).toBeVisible();

        // Check all navigation links exist
        await expect(page.getByTestId('nav-about-eirik')).toBeVisible();
        await expect(page.getByTestId('nav-about-kurt')).toBeVisible();
        await expect(page.getByTestId('nav-gaming')).toBeVisible();
        await expect(page.getByTestId('nav-studio')).toBeVisible();

        // Check all section cards exist
        await expect(page.getByTestId('card-about-eirik')).toBeVisible();
        await expect(page.getByTestId('card-about-kurt')).toBeVisible();
        await expect(page.getByTestId('card-gaming')).toBeVisible();
        await expect(page.getByTestId('card-studio')).toBeVisible();
    });

    test('navigate to About Eirik page', async ({ page }) => {
        await page.goto('/');

        // Click on About Eirik card
        await page.getByTestId('card-about-eirik').click();

        // Should be on About Eirik page
        await expect(page).toHaveURL('/about/eirik');
        await expect(page.getByRole('heading', { name: /About Eirik/i })).toBeVisible();
        await expect(page.getByText(/financially independent technologist/i)).toBeVisible();

        // Test back navigation
        await page.getByTestId('back-to-home').click();
        await expect(page).toHaveURL('/');
    });

    test('navigate to About Kurt Edgar page', async ({ page }) => {
        await page.goto('/');

        // Click on About Kurt Edgar card
        await page.getByTestId('card-about-kurt').click();

        // Should be on About Kurt Edgar page
        await expect(page).toHaveURL('/about/kurt-edgar');
        await expect(page.getByRole('heading', { name: /About Kurt Edgar/i })).toBeVisible();
        await expect(page.getByText(/active his whole life/i)).toBeVisible();

        // Test back navigation
        await page.getByTestId('back-to-home').click();
        await expect(page).toHaveURL('/');
    });

    test('navigate to Gaming page', async ({ page }) => {
        await page.goto('/');

        // Click on Gaming card
        await page.getByTestId('card-gaming').click();

        // Should be on Games page
        await expect(page).toHaveURL('/games');
        // Page heading is "Arcade"
        await expect(page.getByRole('heading', { name: /Arcade/i })).toBeVisible();
    });

    test('navigate to Studio page', async ({ page }) => {
        await page.goto('/');

        // Click on Studio card
        await page.getByTestId('card-studio').click();

        // Should be on Studio page
        await expect(page).toHaveURL('/studio');
        await expect(page.locator('text=Drop media here')).toBeVisible();
    });

    test.skip('header navigation menu works', async ({ page }) => {
        await page.goto('/');

        // Test each navigation link
        await page.getByTestId('nav-about-eirik').click();
        await expect(page).toHaveURL('/about/eirik');
        await page.goto('/');

        await page.getByTestId('nav-about-kurt').click();
        await expect(page).toHaveURL('/about/kurt-edgar');
        await page.goto('/');

        await page.getByTestId('nav-gaming').click();
        await expect(page).toHaveURL('/games');
        await page.goto('/');

        await page.getByTestId('nav-studio').click();
        await expect(page).toHaveURL('/studio');
    });

    test.skip('deep link to studio with project ID still works', async ({ page }) => {
        // Test that existing deep links are preserved
        await page.goto('/studio?project=test-id-123');

        // Should be on Studio page
        await expect(page).toHaveURL(/\/studio\?project=/);
        await expect(page.locator('text=Drop media here')).toBeVisible();
    });

    test('admin route still accessible', async ({ page }) => {
        await page.goto('/admin');

        // Should see admin login
        await expect(page).toHaveURL('/admin');
        await expect(page.getByText('Restricted Access')).toBeVisible();
    });
});
