import { test, expect } from '@playwright/test';

// Use a larger viewport to ensure desktop navigation is visible
test.use({ viewport: { width: 1280, height: 720 } });

test.describe('Navigation and Hub', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            (window as any).__E2E__ = true;
        });
    });

    test('home page displays hub with all sections', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('app-ready').waitFor();

        // Check title
        await expect(page).toHaveTitle(/Kurt Edgar/i);

        // Check main heading strict match inside h1
        await expect(page.locator('h1').getByText('PLAYGROUND')).toBeVisible();

        // Check hero text
        await expect(page.getByTestId('hero-text')).toBeVisible();
        await expect(page.getByTestId('hero-text')).toHaveText(/Kurt Edgar bravely clicks everything/);

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
        await page.getByTestId('app-ready').waitFor();

        await page.getByTestId('card-about-eirik').click();

        await expect(page).toHaveURL('/about/eirik');
        await expect(page.getByRole('heading', { name: /About Eirik/i })).toBeVisible();
        await expect(page.getByText(/financially independent technologist/i)).toBeVisible();

        // Test back navigation using Main Menu Logo
        await page.getByTestId('nav-home').click();
        await expect(page).toHaveURL('/');
    });

    test('navigate to About Kurt Edgar page', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('app-ready').waitFor();

        await page.getByTestId('card-about-kurt').click();

        await expect(page).toHaveURL('/about/kurt-edgar');
        await expect(page.getByRole('heading', { name: /About Kurt Edgar/i })).toBeVisible();
        await expect(page.getByText(/active his whole life/i)).toBeVisible();

        await page.getByTestId('nav-home').click();
        await expect(page).toHaveURL('/');
    });

    test('navigate to Gaming page', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('app-ready').waitFor();

        await page.getByTestId('card-gaming').click();

        await expect(page).toHaveURL('/games');
        await expect(page.getByRole('heading', { name: /Game Center/i })).toBeVisible();
    });

    test('navigate to Studio page', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('app-ready').waitFor();

        await page.getByTestId('card-studio').click();

        await expect(page).toHaveURL('/studio');
        // Should show Studio heading (Updated)
        await expect(page.getByRole('heading', { name: /Studio Workspace/i })).toBeVisible();

        // Assert explanation block exists
        await expect(page.getByTestId('studio-explanation')).toBeVisible();
    });

    test('header navigation menu works', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('app-ready').waitFor();

        // Test each navigation link
        await page.getByTestId('nav-about-eirik').click();
        await expect(page).toHaveURL('/about/eirik');
        await page.goto('/');
        await page.getByTestId('app-ready').waitFor();

        await page.getByTestId('nav-about-kurt').click();
        await expect(page).toHaveURL('/about/kurt-edgar');
        await page.goto('/');
        await page.getByTestId('app-ready').waitFor();

        await page.getByTestId('nav-gaming').click();
        await expect(page).toHaveURL('/games');
        await page.goto('/');
        await page.getByTestId('app-ready').waitFor();

        await page.getByTestId('nav-studio').click();
        await expect(page).toHaveURL('/studio');
        await page.goto('/');
        await page.getByTestId('app-ready').waitFor();

        await page.getByTestId('nav-music').click();
        await expect(page).toHaveURL('/music');
    });

    test('admin route still accessible', async ({ page }) => {
        await page.goto('/admin');
        await expect(page).toHaveURL('/admin');
        await expect(page.getByText('Restricted Access')).toBeVisible();
    });
});
