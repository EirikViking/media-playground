import { test, expect } from '@playwright/test';

test.describe('Music Library', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            (window as any).__E2E__ = true;
            // Stub Audio plays
            window.HTMLMediaElement.prototype.play = () => Promise.resolve();
            window.HTMLMediaElement.prototype.pause = () => { };
        });
        await page.goto('/music');
    });

    test('renders music library correctly', async ({ page }) => {
        await expect(page.getByTestId('music-page')).toBeVisible();
        await expect(page.getByRole('heading', { name: /Awesome Music/i })).toBeVisible();
        await expect(page.getByTestId('hero-play-btn')).toBeVisible();
    });

    test('playlist renders items', async ({ page }) => {
        const items = page.getByTestId('playlist-item');
        await expect(items.first()).toBeVisible();
        const count = await items.count();
        expect(count).toBeGreaterThan(0);
    });

    test('search filters tracks', async ({ page }) => {
        const input = page.getByTestId('search-input');
        await expect(input).toBeVisible();

        // Find a title to search for
        const firstTitleWithText = await page.getByTestId('playlist-item').first().textContent();
        // Assuming title text is inside, grab a word.
        // Actually the component generated titles are deterministic: 'The ... of ...'

        await input.fill('Kurt');
        // Check filtering happened? Hard to verify exact count without knowing seeds, 
        // but verify it doesn't crash and shows "No tracks" if nonsense

        await input.fill('Xiuaosdiuawbe');
        await expect(page.getByText('No tracks found')).toBeVisible();
    });

    test('kurt mode toggles', async ({ page }) => {
        const toggle = page.getByTestId('kurt-mode-toggle');
        const initialText = await toggle.textContent();

        await toggle.click();

        // Should update text or state
        await expect(toggle).not.toHaveText(initialText!);
    });

    test('mini player appears', async ({ page }) => {
        await expect(page.getByTestId('mini-player')).toBeVisible();
    });
});
