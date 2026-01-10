import { test, expect } from '@playwright/test';

test.describe('Beer Calculator Wisdom', () => {

    test('should update Kurt Wisdom when clicking One More', async ({ page }) => {
        // Go to Beer Calculator
        await page.goto('/beers');

        // Wait for page load
        await expect(page.getByTestId('kurt-advice-text')).toBeVisible();

        // Get initial wisdom
        const initialWisdom = await page.getByTestId('kurt-advice-text').textContent();
        expect(initialWisdom).toBeTruthy();

        // Detect "One More" button
        const oneMoreBtn = page.getByText('One More');
        await expect(oneMoreBtn).toBeVisible();

        // Retry click + check loop to avoid random repeats failing the test
        await expect(async () => {
            await oneMoreBtn.click();
            await page.waitForTimeout(100); // Brief wait for React state update
            const newWisdom = await page.getByTestId('kurt-advice-text').textContent();
            expect(newWisdom).not.toBe(initialWisdom);
        }).toPass({ timeout: 10000 });
    });

    test('should NOT update Kurt Wisdom on decrement', async ({ page }) => {
        await page.goto('/beers');

        // Increment first to get count > 0
        await page.getByRole('button', { name: 'One More' }).click();

        // Wait for update
        await page.waitForTimeout(500);
        const wisdomAfterInc = await page.getByTestId('kurt-advice-text').textContent();

        // Decrement
        await page.getByRole('button', { name: 'Less' }).click();

        // Wait a bit
        await page.waitForTimeout(500);

        // Expect wisdom to remain same
        const wisdomAfterDec = await page.getByTestId('kurt-advice-text').textContent();
        expect(wisdomAfterDec).toBe(wisdomAfterInc);
    });

});
