---
description: "Use when writing or modifying unit tests (Vitest) or E2E tests (Playwright). Covers mocking patterns, test structure, and console suppression."
applyTo: "**/*.test.{ts,tsx}, tests/e2e/**"
---

# Testing Conventions

## Framework

- Vitest with `vi.fn()`, `vi.mock()`, `vi.mocked()`, `vi.spyOn()`
- `vitest-mock-extended` for complex mocks (e.g., `mockDeep`)
- Test files are co-located: `foo.ts` → `foo.test.ts`

## Structure

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock modules at top level before any other imports
vi.mock('@/lib/prisma', () => ({
  prisma: mockDeep<PrismaClient>(),
}))

describe('featureName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should do the expected thing', async () => {
    // arrange → act → assert
  })
})
```

## Key Patterns

- Place `vi.mock()` calls at the top of the file before other imports
- Suppress console output with `vi.spyOn(console, 'log').mockImplementation(() => {})` in `beforeEach`
- Use `vi.mocked(dependency)` to get typed access to mocked functions
- For API route tests, mock `requireAuth`, `prisma`, and validate both success and error paths

### Running

- All tests: `npm test`
- Watch mode: `npm run test:watch`
- Coverage: `npm run test:coverage`

## E2E Tests (Playwright)

### Setup

- Config: `playwright.config.ts`
- Test directory: `tests/e2e/`
- Base URL: `http://localhost:3000`
- Browsers: Chromium

### Test Execution Order

Projects run with dependencies:
1. `setup` — Creates test user, saves auth state to `tests/e2e/.auth/user.json`
2. `chromium` — Main tests (authenticated, depends on setup)
3. `auth-tests` — Auth-specific tests (runs last, depends on chromium)

### Auth State

- Stored in `tests/e2e/.auth/user.json` after setup
- Reused across test projects via `storageState`
- E2E database: `DATABASE_URL_E2E` env var

### Patterns

```ts
import { test, expect } from '@playwright/test'

test('displays health data', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})
```

### Running

- Full suite: `npm run test:e2e`
- UI mode: `npm run test:e2e:ui`
- E2E database reset: `npm run db:e2e:reset`
- Use `vi.mocked(dependency)` to get typed access to mocked functions
- Use `vi.clearAllMocks()` in `beforeEach` to reset state between tests
- For API route tests, mock `requireAuth`, `prisma`, and validate both success and error paths
