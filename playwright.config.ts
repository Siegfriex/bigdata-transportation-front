import { defineConfig, devices } from '@playwright/test'

const isProductionE2E = process.env.PLAYWRIGHT_MODE === 'production'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: isProductionE2E ? 'production-e2e.spec.ts' : '**/*.spec.ts',
  timeout: 30_000,
  fullyParallel: false,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/guide',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
