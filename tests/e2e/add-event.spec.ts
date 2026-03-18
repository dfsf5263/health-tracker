import { test, expect, type Page } from './fixtures'
import type { Locator } from '@playwright/test'

/**
 * Return the carousel slide (role=group) that contains the given heading.
 * All form interactions must be scoped to a slide because the Embla Carousel
 * renders every slide in the DOM simultaneously.
 */
function getSlide(page: Page, headingName: string | RegExp): Locator {
  return page
    .locator('role=group')
    .filter({ has: page.getByRole('heading', { name: headingName }) })
}

/**
 * Within the given slide, click the "Select date" trigger, pick today's
 * date from the Drawer calendar, and wait for the Drawer to close.
 */
async function selectTodayDate(page: Page, slide: Locator) {
  const today = new Date()
  // Build a pattern matching the full accessible name, e.g. "Today, Monday, March 16th, 2026"
  const monthName = today.toLocaleString('en-US', { month: 'long' })
  const day = today.getDate()
  const year = today.getFullYear()

  // Click the date trigger
  await slide.getByText('Select date').first().click()

  // The Drawer renders as a dialog element
  const drawer = page.getByRole('dialog', { name: 'Select date' })
  await expect(drawer).toBeVisible()

  // Calendar buttons have full accessible names like "Today, Monday, March 16th, 2026"
  const datePattern = new RegExp(`${monthName} ${day}\\w*,? ${year}`)
  await drawer.getByRole('button', { name: datePattern }).click()

  // Drawer auto-closes after selection
  await expect(drawer).not.toBeVisible({ timeout: 5000 })
}

/**
 * Within the given slide, wait for loading to finish, then toggle a type
 * by clicking its label.
 */
async function toggleType(slide: Locator, typeName: string) {
  await expect(slide.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 })
  await slide.getByLabel(typeName, { exact: true }).click()
}

/**
 * Navigate to the dashboard and delete all events for today via the UI.
 * Today is auto-selected on the calendar, so events appear immediately.
 */
async function cleanupTodaysEvents(page: Page) {
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()

  // Wait for the dashboard data to finish loading before checking for events
  await expect(page.getByText('Loading dashboard data...')).not.toBeVisible({ timeout: 15000 })

  // Keep deleting while any trash/delete buttons exist on event cards
  // Each deletion refreshes the list, so re-query after each one
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const deleteBtn = page.getByRole('main').getByRole('button', { name: 'Delete', exact: true }).first()
    if (!(await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false))) break

    await deleteBtn.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Delete' }).click()
    await expect(dialog).not.toBeVisible({ timeout: 5000 })
  }
}

test.describe('add event wizard', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }) => {
    await cleanupTodaysEvents(page)
    await page.goto('/dashboard/add-event')
    await expect(page.getByRole('heading', { name: 'What would you like to track?' })).toBeVisible()
  })

  test('create a period day event', async ({ page }) => {
    // Select "Period" event type — exact match avoids "Save Period Day"
    await page.getByRole('button', { name: 'Period', exact: true }).click()

    const slide = getSlide(page, 'Track Period Day')
    await expect(slide.getByRole('heading', { name: 'Track Period Day' })).toBeVisible()

    await selectTodayDate(page, slide)

    // Select flow level
    await slide.getByRole('combobox', { name: /flow/i }).click()
    await page.getByRole('option', { name: 'Medium' }).click()

    // Select color
    await slide.getByRole('combobox', { name: /color/i }).click()
    await page.getByRole('option', { name: 'Red' }).click()

    // Submit
    await slide.getByRole('button', { name: 'Save Period Day' }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
  })

  test('create a birth control day event', async ({ page }) => {
    await page.getByRole('button', { name: 'Birth Control', exact: true }).click()

    const slide = getSlide(page, 'Track Birth Control')
    await expect(slide.getByRole('heading', { name: 'Track Birth Control' })).toBeVisible()

    await selectTodayDate(page, slide)

    // Wait for types to load, then select a seeded type
    await expect(slide.getByText(/loading types/i)).not.toBeVisible({ timeout: 10000 })
    await slide.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Put in Contraceptive Ring' }).click()

    await slide.getByRole('button', { name: 'Save Birth Control Day' }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
  })

  test('create an irregular physical day event', async ({ page }) => {
    await page.getByRole('button', { name: 'Irregular Physical Event', exact: true }).click()

    const slide = getSlide(page, 'Track Irregular Physical Event')
    await expect(
      slide.getByRole('heading', { name: 'Track Irregular Physical Event' })
    ).toBeVisible()

    await selectTodayDate(page, slide)

    await expect(slide.getByText(/loading types/i)).not.toBeVisible({ timeout: 10000 })
    await slide.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Cramps' }).click()

    await slide.getByRole('button', { name: 'Save Irregular Physical Day' }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
  })

  test('create a normal physical day event', async ({ page }) => {
    await page.getByRole('button', { name: 'Normal Physical Event', exact: true }).click()

    const slide = getSlide(page, 'Track Normal Physical Event')
    await expect(slide.getByRole('heading', { name: 'Track Normal Physical Event' })).toBeVisible()

    await selectTodayDate(page, slide)

    await expect(slide.getByText(/loading types/i)).not.toBeVisible({ timeout: 10000 })
    await slide.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Exercise' }).click()

    await slide.getByRole('button', { name: 'Save Normal Physical Day' }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
  })

  test('create a migraine event through full wizard', async ({ page }) => {
    await page.getByRole('button', { name: 'Migraine', exact: true }).click()

    // --- Step 1: Start Date/Time ---
    let slide = getSlide(page, 'When did your migraine start?')
    await expect(
      slide.getByRole('heading', { name: 'When did your migraine start?' })
    ).toBeVisible()

    await selectTodayDate(page, slide)

    // Select time — open the time drawer and pick 12:00 PM
    await slide.getByText('Select time').click()
    const timeDrawer = page.getByRole('dialog', { name: 'Select time' })
    await expect(timeDrawer).toBeVisible()
    await timeDrawer.getByRole('button', { name: '12:00 PM', exact: true }).click()
    await expect(timeDrawer).not.toBeVisible({ timeout: 5000 })

    await slide.getByRole('button', { name: 'Continue' }).click()

    // --- Step 2: Is migraine over? ---
    slide = getSlide(page, 'Is your migraine over?')
    await expect(slide.getByRole('heading', { name: 'Is your migraine over?' })).toBeVisible()
    await slide.getByRole('button', { name: /yes, it.s over/i }).click()

    // --- Step 3: End Date/Time ---
    slide = getSlide(page, 'When did your migraine end?')
    await expect(slide.getByRole('heading', { name: 'When did your migraine end?' })).toBeVisible()
    // End date/time auto-defaults from start — wait for Complete to become enabled
    const completeBtn = slide.getByRole('button', { name: 'Complete' })
    await expect(completeBtn).toBeEnabled({ timeout: 5000 })
    await completeBtn.click()

    // --- Step 4: Attack Types ---
    slide = getSlide(page, 'What type of migraine attack?')
    await expect(
      slide.getByRole('heading', { name: 'What type of migraine attack?' })
    ).toBeVisible()
    await toggleType(slide, 'Migraine')
    await slide.getByRole('button', { name: 'Continue' }).click()

    // --- Step 5: Pain Level ---
    slide = getSlide(page, /pain level/i)
    await expect(slide.getByRole('heading', { name: /pain level/i })).toBeVisible()
    // Default pain level is 5 — just continue
    await slide.getByRole('button', { name: 'Continue' }).click()

    // --- Step 6: Symptoms ---
    slide = getSlide(page, /symptoms/i)
    await expect(slide.getByRole('heading', { name: /symptoms/i })).toBeVisible()
    await toggleType(slide, 'Nausea')
    await slide.getByRole('button', { name: 'Continue' }).click()

    // --- Step 7: Triggers ---
    slide = getSlide(page, /triggered/i)
    await expect(slide.getByRole('heading', { name: /triggered/i })).toBeVisible()
    await toggleType(slide, 'Stress')
    await slide.getByRole('button', { name: 'Continue' }).click()

    // --- Step 8: Period Status ---
    slide = getSlide(page, /period status/i)
    await expect(slide.getByRole('heading', { name: /period status/i })).toBeVisible()
    await slide.getByText('No, I am not on my period').click()
    await slide.getByRole('button', { name: 'Continue' }).click()

    // --- Step 9: Medications ---
    slide = getSlide(page, /medications/i)
    await expect(slide.getByRole('heading', { name: /medications/i })).toBeVisible()
    await toggleType(slide, 'None')
    await slide.getByRole('button', { name: 'Continue' }).click()

    // --- Step 10: Precognition ---
    slide = getSlide(page, /sense it coming/i)
    await expect(slide.getByRole('heading', { name: /sense it coming/i })).toBeVisible()
    await toggleType(slide, 'None')
    await slide.getByRole('button', { name: 'Continue' }).click()

    // --- Step 11: Relief Methods ---
    slide = getSlide(page, /relief/i)
    await expect(slide.getByRole('heading', { name: /relief/i })).toBeVisible()
    await toggleType(slide, 'Sleep')
    await slide.getByRole('button', { name: 'Continue' }).click()

    // --- Step 12: Activity Impact ---
    slide = getSlide(page, /activities/i)
    await expect(slide.getByRole('heading', { name: /activities/i })).toBeVisible()
    await toggleType(slide, 'Not Affected')
    await slide.getByRole('button', { name: 'Continue' }).click()

    // --- Step 13: Pain Locations ---
    slide = getSlide(page, /feel pain/i)
    await expect(slide.getByRole('heading', { name: /feel pain/i })).toBeVisible()
    await toggleType(slide, 'Left Temple')
    await slide.getByRole('button', { name: 'Continue' }).click()

    // --- Step 14: Notes and Save ---
    slide = getSlide(page, 'Additional Details')
    await expect(slide.getByRole('heading', { name: 'Additional Details' })).toBeVisible()
    await slide.getByRole('button', { name: 'Save Migraine' }).click()

    await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
  })
})
