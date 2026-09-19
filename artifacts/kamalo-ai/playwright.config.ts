import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.KAMALO_AI_TEST_PORT || process.env.PORT || 18797);
const baseURL = process.env.KAMALO_AI_BASE_URL || `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './test/browser',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    browserName: 'chromium',
    headless: true,
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || '/repl/tools/bin/chromium',
      args: [
        '--no-sandbox',
        '--use-fake-device-for-media-stream',
        '--use-fake-ui-for-media-stream',
        '--autoplay-policy=no-user-gesture-required',
      ],
    },
    permissions: ['microphone'],
    trace: 'retain-on-failure',
  },
  webServer: process.env.KAMALO_AI_BASE_URL
    ? undefined
    : {
        command: 'pnpm run dev',
        cwd: import.meta.dirname,
        env: {
          ...process.env,
          BASE_PATH: '/',
          PORT: String(port),
        },
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        url: baseURL,
      },
});