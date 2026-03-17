import { test, expect } from './fixtures'

const testId = Date.now()
const createName = `E2E Trigger ${testId}`
const editName = `E2E Renamed Trigger ${testId}`

test.describe('manage event types — migraine triggers', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/manage-event-types')
    await expect(page.getByRole('main')).toBeVisible()

    // Select "Migraine - Trigger" from the event type dropdown
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: /migraine - trigger/i }).click()
  })

  test('seeded trigger types are visible', async ({ page }) => {
    // "Stress" is one of the prepopulated types
    await expect(page.getByRole('heading', { name: 'Stress' })).toBeVisible()
  })

  test('create trigger type: appears in list after submit', async ({ page }) => {
    await page.getByRole('button', { name: 'Add New Type' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByLabel(/name/i).fill(createName)
    await dialog.getByRole('button', { name: /create/i }).click()
    await expect(dialog).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('heading', { name: createName })).toBeVisible()
  })

  test('edit trigger type: updated name shown in list', async ({ page }) => {
    const card = page.locator('[class*="card"], [class*="Card"], .border.rounded', {
      hasText: createName,
    })
    await card.getByRole('button', { name: /edit/i }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByLabel(/name/i).fill(editName)
    await dialog.getByRole('button', { name: /update|save/i }).click()
    await expect(dialog).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('heading', { name: editName })).toBeVisible()
  })

  test('delete trigger type: removed from list', async ({ page }) => {
    const card = page.locator('[class*="card"], [class*="Card"], .border.rounded', {
      hasText: editName,
    })
    await card
      .getByRole('button', { name: /delete/i })
      .last()
      .click()

    // Confirm deletion in the confirmation dialog
    const confirmDialog = page.getByRole('alertdialog').or(page.getByRole('dialog'))
    await confirmDialog.getByRole('button', { name: /delete|confirm|yes/i }).click()

    await expect(page.getByRole('heading', { name: editName })).not.toBeVisible({ timeout: 10000 })
  })

  test('client-side validation: empty name prevents submission', async ({ page }) => {
    await page.getByRole('button', { name: 'Add New Type' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Try to submit without filling in name — HTML required attribute prevents it
    await dialog.getByRole('button', { name: /create/i }).click()
    await expect(dialog).toBeVisible()
  })
})
