import { test, expect } from './fixtures'

test.describe('dashboard overview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
  })

  test('dashboard page loads successfully', async ({ page }) => {
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('navigation sidebar is visible with expected links', async ({ page }) => {
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Migraine Breakdown' })).toBeVisible()
    await expect(page.getByRole('link', { name: /manage event types/i })).toBeVisible()
  })

  test('sidebar shows authenticated user email', async ({ page }) => {
    await expect(page.getByText('e2e@test.local')).toBeVisible()
  })

  test('can navigate to migraine analytics page', async ({ page }) => {
    await page.getByRole('link', { name: 'Migraine Breakdown' }).click()
    await expect(page).toHaveURL('/dashboard/analytics/migraines')
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('analytics redirects to migraine breakdown', async ({ page }) => {
    await page.goto('/dashboard/analytics')
    await expect(page).toHaveURL('/dashboard/analytics/migraines')
  })

  test('can navigate to manage event types page', async ({ page }) => {
    await page.getByRole('link', { name: /manage event types/i }).click()
    await expect(page).toHaveURL('/dashboard/manage-event-types')
    await expect(page.getByRole('main')).toBeVisible()
  })
})
