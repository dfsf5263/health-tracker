import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

// Load .env file — Playwright's recommended approach for test env vars
dotenv.config({ path: path.resolve(__dirname, '.env') })

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['html'], ['list']],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Auth setup — no storageState dependency, runs first
    {
      name: 'setup',
      testMatch: /setup\/auth\.setup\.ts/,
    },
    // Sex setup — ensures the E2E user is Female before main tests
    {
      name: 'sex-setup',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      testMatch: /setup\/sex\.setup\.ts/,
      dependencies: ['setup'],
    },
    // All tests use the saved session and depend on auth + sex setup
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      testIgnore: /auth\.spec\.ts|sex-(female|male)\.spec\.ts/,
      dependencies: ['setup', 'sex-setup'],
    },
    // Female UI assertions — run after main tests
    {
      name: 'sex-female-tests',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      testMatch: /sex-female\.spec\.ts/,
      dependencies: ['chromium'],
    },
    // Male UI assertions — run after Female tests
    {
      name: 'sex-male-tests',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      testMatch: /sex-male\.spec\.ts/,
      dependencies: ['sex-female-tests'],
    },
    // Auth spec runs last — sign-out invalidates the server session
    {
      name: 'auth-tests',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      testMatch: /auth\.spec\.ts/,
      dependencies: ['sex-male-tests'],
    },
  ],

  webServer: {
    command: process.env.CI
      ? 'npm run build && npm run start -- -p 3000'
      : 'npm run dev -- -p 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      // Point the server at the E2E database, not the dev/prod one
      DATABASE_URL: process.env.DATABASE_URL_E2E ?? process.env.DATABASE_URL ?? '',
      // Ensure Better Auth uses localhost origin for E2E
      APP_URL: 'http://localhost:3000',
    },
  },
})
