import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL?.trim() || 'http://127.0.0.1:3100'
const databaseURL = process.env.DATABASE_URL?.trim()

if (!databaseURL) {
  throw new Error(
    'E2E tests require DATABASE_URL. Copy .env.e2e.example to .env.e2e before running them locally.',
  )
}

let databaseName: string
try {
  databaseName = new URL(databaseURL).pathname.replace(/^\/+/, '')
} catch {
  throw new Error('E2E tests require a valid PostgreSQL DATABASE_URL.')
}

if (!/(?:_e2e|_test)$/.test(databaseName)) {
  throw new Error(
    'Refusing to run automated tests against database "' +
      databaseName +
      '". Use a database whose name ends in _e2e or _test.',
  )
}

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  outputDir: 'test-results',
  projects: [
    {
      name: 'integration',
      testMatch: /integration\/.*\.spec\.ts/,
    },
    {
      name: 'e2e-chromium',
      testMatch: /e2e\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  retries: process.env.CI ? 1 : 0,
  testDir: './tests',
  timeout: 90_000,
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3100',
    env: {
      ...process.env,
      CANDIDATE_EMAIL_PROVIDER: 'capture',
      NEXT_PUBLIC_SERVER_URL: baseURL,
      PAYLOAD_JOBS_AUTORUN: 'false',
      SENSITIVE_DATA_ACTIVE_KEY_ID: 'synthetic-e2e',
      SENSITIVE_DATA_ENCRYPTION_KEYS: 'synthetic-e2e:' + Buffer.alloc(32, 7).toString('base64'),
      SENSITIVE_DATA_FINGERPRINT_KEY: Buffer.alloc(32, 8).toString('base64'),
      OBSERVABILITY_TOKEN: 'synthetic-observability-token-for-tests-only',
    },
    reuseExistingServer: !process.env.CI,
    stderr: 'pipe',
    stdout: 'pipe',
    timeout: 120_000,
    url: `${baseURL}/api/health`,
  },
  workers: 1,
})
