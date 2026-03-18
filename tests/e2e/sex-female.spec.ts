import { expect, test } from './fixtures'

test.describe('female UI — sex-specific sections visible', () => {
  test.describe.configure({ mode: 'serial' })

  test('dashboard shows period and birth control sections', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('main')).toBeVisible()

    // Wait for calendar data to load
    await expect(page.getByText('Loading event data...')).not.toBeVisible({ timeout: 15000 })

    // Period and Birth Control event sections should be visible
    await expect(page.getByText('Period', { exact: true })).toBeVisible()
    await expect(page.getByText('Birth Control', { exact: true })).toBeVisible()
  })

  test('add-event shows Period and Birth Control buttons', async ({ page }) => {
    await page.goto('/dashboard/add-event')
    await expect(page.getByRole('main')).toBeVisible()

    await expect(page.getByRole('button', { name: 'Period', exact: true })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByRole('button', { name: 'Birth Control', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Irregular Physical Event' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Normal Physical Event' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Migraine', exact: true })).toBeVisible()
  })

  test('manage event types includes Birth Control option', async ({ page }) => {
    await page.goto('/dashboard/manage-event-types')
    await expect(page.getByRole('main')).toBeVisible()

    // Open the event type dropdown
    await page.getByRole('combobox').click()

    // Birth Control option should be present
    await expect(page.getByRole('option', { name: 'Birth Control' })).toBeVisible()

    // Close dropdown
    await page.keyboard.press('Escape')
  })

  test('profile settings shows birth control ring fields', async ({ page }) => {
    await page.goto('/dashboard/settings/profile')
    await expect(page.getByRole('main')).toBeVisible()

    // Wait for the form to load from the API
    await expect(page.locator('[id="sex"]')).toBeVisible({ timeout: 10000 })

    // Birth control ring day fields should be visible for Female
    await expect(page.getByLabel('Days without birth control ring')).toBeVisible()
    await expect(page.getByLabel('Days with birth control ring')).toBeVisible()
  })

  test('account settings shows Email Preferences', async ({ page }) => {
    await page.goto('/dashboard/settings/account')
    await expect(page.getByRole('main')).toBeVisible()

    // Wait for settings to load
    await expect(page.getByText('Email Preferences')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Birth Control Reminders')).toBeVisible()
  })

  test('sidebar shows Cycle Tracking link', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Cycle Tracking' })).toBeVisible()
  })
})
