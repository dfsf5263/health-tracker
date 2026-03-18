import { test as setup, expect } from '@playwright/test'

setup('set sex to Female', async ({ page }) => {
  await page.goto('/dashboard/settings/profile')
  await expect(page.getByRole('main')).toBeVisible()

  // Wait for the form to load from the API
  const sexTrigger = page.locator('[id="sex"]')
  await expect(sexTrigger).toBeVisible({ timeout: 10000 })

  // Select Female
  await sexTrigger.click()
  await page.getByRole('option', { name: 'Female' }).click()

  // Save
  await page.getByRole('button', { name: 'Save Changes' }).click()
  await expect(page.getByText('Profile updated successfully')).toBeVisible({ timeout: 10000 })
})
