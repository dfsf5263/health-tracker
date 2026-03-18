import { expect, test } from './fixtures'

test.describe('migraine analytics page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/analytics/migraines')
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('page loads with heading and stat cards', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Migraine Breakdown' })).toBeVisible()
    await expect(page.getByText('Total Migraines')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Key Findings')).toBeVisible()
  })

  test('displays range filter pills', async ({ page }) => {
    await expect(page.getByRole('button', { name: '30 days' })).toBeVisible()
    await expect(page.getByRole('button', { name: '90 days' })).toBeVisible()
    await expect(page.getByRole('button', { name: '1 year' })).toBeVisible()
  })

  test('displays stat cards after load', async ({ page }) => {
    // Wait for data to load — either stat values or "0" appear
    await expect(page.getByText('Total Migraines')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Avg Pain Level')).toBeVisible()
    await expect(page.getByText('Avg Duration')).toBeVisible()
  })

  test('can switch range filter', async ({ page }) => {
    await expect(page.getByText('Total Migraines')).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: '30 days' }).click()

    // Stats should still be visible after switching
    await expect(page.getByText('Total Migraines')).toBeVisible()
  })
})
