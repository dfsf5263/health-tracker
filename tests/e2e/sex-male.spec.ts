import type { APIRequestContext, Locator, Page } from '@playwright/test'
import { expect, test } from './fixtures'

function getSlide(page: Page, headingName: string | RegExp): Locator {
  return page
    .locator('role=group')
    .filter({ has: page.getByRole('heading', { name: headingName }) })
}

async function selectTodayDate(page: Page, slide: Locator) {
  const today = new Date()
  const monthName = today.toLocaleString('en-US', { month: 'long' })
  const day = today.getDate()
  const year = today.getFullYear()

  await slide.getByText('Select date').first().click()

  const drawer = page.getByRole('dialog', { name: 'Select date' })
  await expect(drawer).toBeVisible()

  const datePattern = new RegExp(`${monthName} ${day}\\w*,? ${year}`)
  await drawer.getByRole('button', { name: datePattern }).click()
  await expect(drawer).not.toBeVisible({ timeout: 5000 })
}

async function toggleType(slide: Locator, typeName: string) {
  await expect(slide.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 })
  await slide.getByLabel(typeName, { exact: true }).click()
}

async function cleanupTodaysEvents(page: Page) {
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
  await expect(page.getByText('Loading dashboard data...')).not.toBeVisible({ timeout: 15000 })

  while (true) {
    const deleteBtn = page
      .getByRole('main')
      .getByRole('button', { name: 'Delete', exact: true })
      .first()
    if (!(await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false))) break

    await deleteBtn.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Delete' }).click()
    await expect(dialog).not.toBeVisible({ timeout: 5000 })
  }
}

async function setSexViaUI(page: Page, sex: 'Male' | 'Female') {
  await page.goto('/dashboard/settings/profile')
  await expect(page.getByRole('main')).toBeVisible()

  // Wait for the form to load from the API
  const sexTrigger = page.locator('[id="sex"]')
  await expect(sexTrigger).toBeVisible({ timeout: 10000 })

  // Select the desired sex
  await sexTrigger.click()
  await page.getByRole('option', { name: sex, exact: true }).click()

  // Save
  await page.getByRole('button', { name: 'Save Changes' }).click()
  await expect(page.getByText('Profile updated successfully')).toBeVisible({ timeout: 10000 })
}

// ---------------------------------------------------------------------------
// API helpers — create events via authenticated API calls
// ---------------------------------------------------------------------------

const BASE = 'http://localhost:3000'

async function getTypeId(
  request: APIRequestContext,
  endpoint: string,
  typeName: string
): Promise<string> {
  const res = await request.get(`${BASE}/api/${endpoint}`)
  const types = (await res.json()) as Array<{ id: string; name: string }>
  const match = types.find((t) => t.name === typeName)
  if (!match) throw new Error(`Type "${typeName}" not found at /api/${endpoint}`)
  return match.id
}

interface CreatedEvent {
  id: string
}

async function createIrregularPhysicalDay(
  request: APIRequestContext,
  data: { date: string; typeId: string; notes?: string }
): Promise<CreatedEvent> {
  const res = await request.post(`${BASE}/api/irregular-physical-days`, { data })
  expect(res.ok()).toBeTruthy()
  return (await res.json()) as CreatedEvent
}

async function createNormalPhysicalDay(
  request: APIRequestContext,
  data: { date: string; typeId: string; notes?: string }
): Promise<CreatedEvent> {
  const res = await request.post(`${BASE}/api/normal-physical-days`, { data })
  expect(res.ok()).toBeTruthy()
  return (await res.json()) as CreatedEvent
}

async function createMigraine(
  request: APIRequestContext,
  data: Record<string, unknown>
): Promise<CreatedEvent> {
  const res = await request.post(`${BASE}/api/migraines`, { data })
  expect(res.ok()).toBeTruthy()
  return (await res.json()) as CreatedEvent
}

function todayDateString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function clickEditForSection(page: Page, sectionLabel: string) {
  const section = page.locator('div.space-y-2').filter({
    has: page.locator(`text="${sectionLabel}"`),
  })
  await section.getByRole('button', { name: 'Edit' }).first().click()
}

test.describe('male UI — sex-specific sections hidden', () => {
  test.describe.configure({ mode: 'serial' })

  test('setup: set sex to Male', async ({ page }) => {
    await setSexViaUI(page, 'Male')
  })

  test('dashboard hides period and birth control sections', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('main')).toBeVisible()

    // Wait for calendar data to load
    await expect(page.getByText('Loading event data...')).not.toBeVisible({ timeout: 15000 })

    // Period and Birth Control event sections should NOT be visible
    await expect(page.getByText('Period', { exact: true })).not.toBeVisible()
    await expect(page.getByText('Birth Control', { exact: true })).not.toBeVisible()

    // Female-specific hints should NOT be visible
    await expect(
      page.getByText('No events tracked yet. Click the + button to add your first event.')
    ).not.toBeVisible()

    // Non-gendered event sections should still be visible
    await expect(page.getByText('Irregular Physical', { exact: true })).toBeVisible()
    await expect(page.getByText('Normal Physical', { exact: true })).toBeVisible()
    await expect(page.getByText('Migraine', { exact: true })).toBeVisible()
  })

  test('add-event hides Period and Birth Control buttons', async ({ page }) => {
    await page.goto('/dashboard/add-event')
    await expect(page.getByRole('main')).toBeVisible()

    // Period and Birth Control should not appear
    await expect(page.getByRole('button', { name: 'Period', exact: true })).not.toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByRole('button', { name: 'Birth Control', exact: true })).not.toBeVisible()

    // Other event types should still be visible
    await expect(page.getByRole('button', { name: 'Irregular Physical Event' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Normal Physical Event' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Migraine', exact: true })).toBeVisible()
  })

  test('manage event types excludes Birth Control option', async ({ page }) => {
    await page.goto('/dashboard/manage-event-types')
    await expect(page.getByRole('main')).toBeVisible()

    // Open the event type dropdown
    await page.getByRole('combobox').click()

    // Birth Control option should NOT be present
    await expect(page.getByRole('option', { name: 'Birth Control' })).not.toBeVisible()

    // Other options should still be present
    await expect(page.getByRole('option', { name: 'Irregular Physical' })).toBeVisible()

    // Close dropdown
    await page.keyboard.press('Escape')
  })

  test('profile settings hides birth control ring fields', async ({ page }) => {
    await page.goto('/dashboard/settings/profile')
    await expect(page.getByRole('main')).toBeVisible()

    // Wait for the form to load from the API
    await expect(page.locator('[id="sex"]')).toBeVisible({ timeout: 10000 })

    // Birth control ring day fields should NOT be visible for Male
    await expect(page.getByLabel('Days without birth control ring')).not.toBeVisible()
    await expect(page.getByLabel('Days with birth control ring')).not.toBeVisible()
  })

  test('account settings hides Email Preferences', async ({ page }) => {
    await page.goto('/dashboard/settings/account')
    await expect(page.getByRole('main')).toBeVisible()

    // Wait for page to fully load (check for a known element)
    await expect(page.getByText('Danger Zone')).toBeVisible({ timeout: 10000 })

    // Email Preferences section should NOT be visible for Male
    await expect(page.getByText('Email Preferences')).not.toBeVisible()
    await expect(page.getByText('Birth Control Reminders')).not.toBeVisible()
  })

  test('sidebar hides Cycle Tracking link', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Migraine Breakdown' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Cycle Tracking' })).not.toBeVisible()
  })

  test('migraine wizard skips Period Status and saves', async ({ page }) => {
    await cleanupTodaysEvents(page)
    await page.goto('/dashboard/add-event')
    await expect(page.getByRole('heading', { name: 'What would you like to track?' })).toBeVisible()

    // Select Migraine event type
    await page.getByRole('button', { name: 'Migraine', exact: true }).click()

    // --- Step 1: Start Date/Time ---
    let slide = getSlide(page, 'When did your migraine start?')
    await expect(
      slide.getByRole('heading', { name: 'When did your migraine start?' })
    ).toBeVisible()

    await selectTodayDate(page, slide)

    await slide.getByText('Select time').click()
    const timeDrawer = page.getByRole('dialog', { name: 'Select time' })
    await expect(timeDrawer).toBeVisible()
    await timeDrawer.getByRole('button', { name: '12:00 PM', exact: true }).click()
    await expect(timeDrawer).not.toBeVisible({ timeout: 5000 })

    await slide.getByRole('button', { name: 'Continue' }).click()

    // --- Step 2: Is migraine over? --- choose ongoing to skip end datetime
    slide = getSlide(page, 'Is your migraine over?')
    await expect(slide.getByRole('heading', { name: 'Is your migraine over?' })).toBeVisible()
    await slide.getByRole('button', { name: /no, it.s ongoing/i }).click()

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

    // --- Period Status should be SKIPPED — verify we land on Medications ---
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

  test('edit irregular physical day shows prepopulated values', async ({ page, request }) => {
    await cleanupTodaysEvents(page)

    const typeId = await getTypeId(request, 'irregular-physical-types', 'Cramps')
    await createIrregularPhysicalDay(request, {
      date: todayDateString(),
      typeId,
      notes: 'e2e-edit-irreg-male',
    })

    await page.goto('/dashboard')
    await expect(page.getByText('Loading dashboard data...')).not.toBeVisible({ timeout: 15000 })

    await clickEditForSection(page, 'Irregular Physical')
    await expect(page).toHaveURL(/edit-irregular-physical-day\?id=/, { timeout: 10000 })
    await expect(
      page.getByRole('heading', { level: 1, name: 'Edit Irregular Physical Day' })
    ).toBeVisible({ timeout: 10000 })

    await expect(page.locator('#type')).toHaveText(/Cramps/)
    await expect(page.locator('#notes')).toHaveValue('e2e-edit-irreg-male')
  })

  test('edit normal physical day shows prepopulated values', async ({ page, request }) => {
    await cleanupTodaysEvents(page)

    const typeId = await getTypeId(request, 'normal-physical-types', 'Exercise')
    await createNormalPhysicalDay(request, {
      date: todayDateString(),
      typeId,
      notes: 'e2e-edit-normal-male',
    })

    await page.goto('/dashboard')
    await expect(page.getByText('Loading dashboard data...')).not.toBeVisible({ timeout: 15000 })

    await clickEditForSection(page, 'Normal Physical')
    await expect(page).toHaveURL(/edit-normal-physical-day\?id=/, { timeout: 10000 })
    await expect(
      page.getByRole('heading', { level: 1, name: 'Edit Normal Physical Day' })
    ).toBeVisible({
      timeout: 10000,
    })

    await expect(page.locator('#type')).toHaveText(/Exercise/)
    await expect(page.locator('#notes')).toHaveValue('e2e-edit-normal-male')
  })

  test('edit migraine skips Period Status and shows prepopulated values', async ({
    page,
    request,
  }) => {
    await cleanupTodaysEvents(page)

    // Look up type IDs
    const [
      attackTypeId,
      symptomTypeId,
      triggerTypeId,
      medicationTypeId,
      precognitionTypeId,
      reliefTypeId,
      activityTypeId,
      locationTypeId,
    ] = await Promise.all([
      getTypeId(request, 'migraine-attack-types', 'Migraine'),
      getTypeId(request, 'migraine-symptom-types', 'Nausea'),
      getTypeId(request, 'migraine-trigger-types', 'Stress'),
      getTypeId(request, 'migraine-medication-types', 'None'),
      getTypeId(request, 'migraine-precognition-types', 'None'),
      getTypeId(request, 'migraine-relief-types', 'Sleep'),
      getTypeId(request, 'migraine-activity-types', 'Not Affected'),
      getTypeId(request, 'migraine-location-types', 'Left Temple'),
    ])

    const today = new Date()
    const startDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0)
    const endDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0, 0)

    await createMigraine(request, {
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      painLevel: 7,
      notes: 'e2e-edit-migraine-male',
      geographicLocation: 'Office',
      attackTypeIds: [attackTypeId],
      symptomTypeIds: [symptomTypeId],
      triggerTypeIds: [triggerTypeId],
      medicationData: [{ typeId: medicationTypeId, dosageModifier: 1 }],
      precognitionTypeIds: [precognitionTypeId],
      reliefTypeIds: [reliefTypeId],
      activityTypeIds: [activityTypeId],
      locationTypeIds: [locationTypeId],
    })

    await page.goto('/dashboard')
    await expect(page.getByText('Loading dashboard data...')).not.toBeVisible({ timeout: 15000 })

    await clickEditForSection(page, 'Migraine')
    await expect(page).toHaveURL(/edit-migraine\?id=/, { timeout: 10000 })

    // Wait for migraine data to load
    await expect(page.getByText('Loading migraine...')).not.toBeVisible({ timeout: 15000 })

    // --- Step 1: Start Date/Time ---
    let slide = getSlide(page, 'When did your migraine start?')
    await expect(
      slide.getByRole('heading', { name: 'When did your migraine start?' })
    ).toBeVisible()
    await expect(slide.locator('#time')).toHaveText(/10:00 AM/)
    await slide.getByRole('button', { name: 'Continue' }).click()

    // --- Step 2: Is Migraine Over? ---
    slide = getSlide(page, 'Is your migraine over?')
    await expect(slide.getByRole('heading', { name: 'Is your migraine over?' })).toBeVisible()
    await slide.getByRole('button', { name: /yes, it.s over/i }).click()

    // --- Step 3: End Date/Time ---
    slide = getSlide(page, 'When did your migraine end?')
    await expect(slide.getByRole('heading', { name: 'When did your migraine end?' })).toBeVisible()
    await expect(slide.locator('#end-time')).toHaveText(/4:00 PM/)
    const completeBtn = slide.getByRole('button', { name: 'Complete' })
    await expect(completeBtn).toBeEnabled({ timeout: 5000 })
    await completeBtn.click()

    // --- Step 4: Attack Types ---
    slide = getSlide(page, 'What type of migraine attack?')
    await expect(
      slide.getByRole('heading', { name: 'What type of migraine attack?' })
    ).toBeVisible()
    await expect(slide.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 })
    await expect(slide.getByLabel('Migraine', { exact: true })).toBeChecked({ timeout: 10000 })
    await slide.getByRole('button', { name: 'Continue' }).click()

    // --- Step 5: Pain Level ---
    slide = getSlide(page, /pain level/i)
    await expect(slide.getByRole('heading', { name: /pain level/i })).toBeVisible()
    await expect(slide.getByText(/7 - Severe/)).toBeVisible()
    await slide.getByRole('button', { name: 'Continue' }).click()

    // --- Step 6: Symptoms ---
    slide = getSlide(page, /symptoms/i)
    await expect(slide.getByRole('heading', { name: /symptoms/i })).toBeVisible()
    await expect(slide.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 })
    await expect(slide.getByLabel('Nausea', { exact: true })).toBeChecked({ timeout: 10000 })
    await slide.getByRole('button', { name: 'Continue' }).click()

    // --- Step 7: Triggers ---
    slide = getSlide(page, /triggered/i)
    await expect(slide.getByRole('heading', { name: /triggered/i })).toBeVisible()
    await expect(slide.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 })
    await expect(slide.getByLabel('Stress', { exact: true })).toBeChecked({ timeout: 10000 })
    await slide.getByRole('button', { name: 'Continue' }).click()

    // --- Period Status should be SKIPPED — we should land on Medications ---
    slide = getSlide(page, /medications/i)
    await expect(slide.getByRole('heading', { name: /medications/i })).toBeVisible()
    await expect(slide.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 })
    await expect(slide.getByLabel('None', { exact: true })).toBeChecked({ timeout: 10000 })
    await slide.getByRole('button', { name: 'Continue' }).click()

    // --- Step 10: Precognition ---
    slide = getSlide(page, /sense it coming/i)
    await expect(slide.getByRole('heading', { name: /sense it coming/i })).toBeVisible()
    await expect(slide.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 })
    await expect(slide.getByLabel('None', { exact: true })).toBeChecked({ timeout: 10000 })
    await slide.getByRole('button', { name: 'Continue' }).click()

    // --- Step 11: Relief Methods ---
    slide = getSlide(page, /relief/i)
    await expect(slide.getByRole('heading', { name: /relief/i })).toBeVisible()
    await expect(slide.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 })
    await expect(slide.getByLabel('Sleep', { exact: true })).toBeChecked({ timeout: 10000 })
    await slide.getByRole('button', { name: 'Continue' }).click()

    // --- Step 12: Activity Impact ---
    slide = getSlide(page, /activities/i)
    await expect(slide.getByRole('heading', { name: /activities/i })).toBeVisible()
    await expect(slide.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 })
    await expect(slide.getByLabel('Not Affected', { exact: true })).toBeChecked({ timeout: 10000 })
    await slide.getByRole('button', { name: 'Continue' }).click()

    // --- Step 13: Pain Locations ---
    slide = getSlide(page, /feel pain/i)
    await expect(slide.getByRole('heading', { name: /feel pain/i })).toBeVisible()
    await expect(slide.getByText(/loading/i)).not.toBeVisible({ timeout: 10000 })
    await expect(slide.getByLabel('Left Temple', { exact: true })).toBeChecked({ timeout: 10000 })
    await slide.getByRole('button', { name: 'Continue' }).click()

    // --- Step 14: Notes and Save ---
    slide = getSlide(page, 'Additional Details')
    await expect(slide.getByRole('heading', { name: 'Additional Details' })).toBeVisible()
    await expect(slide.locator('#geographic-location')).toHaveValue('Office')
    await expect(slide.locator('#notes')).toHaveValue('e2e-edit-migraine-male')
  })

  test('cleanup: remove male test events', async ({ page }) => {
    await cleanupTodaysEvents(page)
  })

  test('teardown: reset sex to Female', async ({ page }) => {
    await setSexViaUI(page, 'Female')
  })
})
