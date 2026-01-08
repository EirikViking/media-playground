import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/playwright',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: [['list'], ['html', { open: 'never' }]],
    timeout: 60000,

    use: {
        baseURL: process.env.VERIFY_WEB_BASE || 'http://127.0.0.1:5173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'off',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
