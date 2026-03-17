import { test, expect } from './fixtures'

test.describe('auth flows', () => {
  test.describe('unauthenticated', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('redirects to sign-in when accessing dashboard unauthenticated', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page).toHaveURL(/\/sign-in/, { timeout: 15000 })
    })

    test('sign up redirects appropriately when email verification is disabled', async ({
      page,
    }) => {
      // Skip if Resend is configured — email verification will be required
      test.skip(
        !!process.env.RESEND_API_KEY,
        'Email verification is enabled, sign-up requires email confirmation'
      )

      const uniqueEmail = `signup-test-${Date.now()}@test.local`

      await page.goto('/sign-up')
      await page.getByLabel('First name').fill('Test')
      await page.getByLabel('Last name').fill('User')
      await page.getByLabel('Email').fill(uniqueEmail)
      await page.getByLabel('Password').fill('TestPassword123!')
      await page.getByRole('button', { name: /create account/i }).click()

      // Without email verification configured, should proceed past sign-up
      await expect(page).not.toHaveURL(/\/sign-up/, { timeout: 15000 })
    })
  })

  test('can sign out and sign back in', async ({ page, context }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('main')).toBeVisible()

    // Open sidebar user menu and sign out
    await page.getByText('e2e@test.local').click()
    await page.getByRole('menuitem', { name: /log out/i }).click()
    await expect(page).toHaveURL(/\//, { timeout: 15000 })

    // Navigate to sign-in and re-authenticate
    await page.goto('/sign-in')
    const signInBtn = page.getByRole('button', { name: /sign in/i })
    await signInBtn.waitFor({ state: 'visible' })
    await page.waitForLoadState('networkidle')
    await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
    await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
    await signInBtn.click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 })
    await expect(page.getByRole('main')).toBeVisible()

    // Persist renewed session so any later tests still work
    await context.storageState({ path: 'tests/e2e/.auth/user.json' })
  })
})
