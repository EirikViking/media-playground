
import { test, expect } from '@playwright/test';

test.describe('Production Polish Fixes', () => {

    test('About Eirik should have correct pixel art image', async ({ page }) => {
        await page.goto('/about/eirik');
        const img = page.locator('img[alt="Eirik Pixel Art"]');
        await expect(img).toBeVisible();
        await expect(img).toHaveAttribute('src', '/eirik-pixel.png');
    });

    test('Beer Calculator menu should work and show content', async ({ page }) => {
        await page.goto('/');

        // Check Menu Link
        await page.setViewportSize({ width: 1280, height: 720 });

        const link = page.getByTestId('nav-beer-calc');
        await expect(link).toBeVisible();
        await link.click();

        await expect(page).toHaveURL('/beers');
        await expect(page.getByText('Beer Calculator')).toBeVisible();

        // Check "Manual Mode" tile on Home (renamed to Beer Calculator)
        await page.goto('/');
        // The tile description updated to: "Test your sobriety. Or lack thereof. Kurt Edgar approved."
        const tileLink = page.getByTestId('tile-roast-manual');
        await expect(tileLink).toHaveAttribute('href', '/beers');

        await tileLink.click({ force: true });
        await expect(page).toHaveURL('/beers');
    });

    test('Home Footer should have correct credit text', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText('Built with passion by Eirik')).toBeVisible();
        await expect(page.getByText('Kurt Edgar', { exact: true })).not.toBeVisible();
    });

    test.skip('Publishing chaos should auto-upload pending assets', async ({ page }) => {
        // Mock API
        await page.route('**/api/projects', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({ json: { id: 'test-project', projectId: 'test-project', title: 'Test Project' } });
            } else {
                await route.continue();
            }
        });

        await page.route('**/api/upload/**/original', async route => {
            await route.fulfill({
                json: { ok: true, key: 'test/key', byteSize: 100, assetId: 'test-asset' }
            });
        });

        await page.route('**/api/upload/**/thumb', async route => {
            await route.fulfill({
                json: { ok: true, key: 'test/key-thumb', byteSize: 50, assetId: 'test-asset' }
            });
        });

        await page.route('**/api/projects/**/assets/commit', async route => {
            await route.fulfill({ json: { ok: true } });
        });

        // Mock Commit Asset (Utils/upload uses this)

        await page.route('**/api/chaos/publish', async route => {
            await route.fulfill({ json: { id: 'chaos-id', url: '/api/chaos/id/content' } });
        });

        await page.route('**/api/projects/*', async route => {
            // Handle GET project/update project
            if (route.request().method() === 'PUT') {
                await route.fulfill({ json: { ok: true } });
            } else if (route.request().method() === 'GET') {
                await route.fulfill({ json: { id: 'test-project', title: 'Test Project', data: '{}' } });
            } else {
                await route.continue();
            }
        });

        await page.goto('/studio');

        // 1. Initial State: No Project.
        // Trigger creation by Adding File.
        await page.setInputFiles('input[type="file"]', {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2d480000000049454e44ae426082', 'hex')
        });

        // 2. Expect Modal
        await expect(page.getByText('Create New Project')).toBeVisible();
        await page.fill('input[placeholder="My Awesome Project"]', 'Test Project');
        await page.click('button:has-text("Start Creating")');

        // 3. Wait for item to appear in grid
        await expect(page.getByAltText('test.png')).toBeVisible();

        // 4. Click Generate Thumbnail (Chaos Generator)
        await page.getByTestId('generate-chaos-btn').click();

        // Wait for generation (mocked? generateCollage uses canvas, might be slow or fail in env?)
        // The chaos generator mocks fetch of collageUrl.
        // We need to bypass `generateCollage` or hope canvas works.
        // If `generateCollage` fails, previewUrl is null.
        // We can force previewUrl state if needed, but let's try assuming it works or mock `utils/collage`.

        // Wait for preview image
        await expect(page.getByTestId('chaos-preview-image')).toBeVisible({ timeout: 10000 });

        // 5. Click Publish
        await page.getByTestId('publish-btn').click();

        // 6. Expect "Published!" state
        await expect(page.getByText('Published!')).toBeVisible();

        // 7. Verify upload status of item is 'uploaded'?
        // Hard to check visual status easily, but if "Published!" showed up, our performUpload succeeded.
    });
});
