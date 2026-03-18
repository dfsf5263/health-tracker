import type { APIRequestContext, Locator, Page } from '@playwright/test'
import { expect, test } from './fixtures'

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

async function createPeriodDay(
  request: APIRequestContext,
  data: { date: string; flow: string; color: string; notes?: string }
): Promise<CreatedEvent> {
  const res = await request.post(`${BASE}/api/period-days`, { data })
  expect(res.ok()).toBeTruthy()
  return (await res.json()) as CreatedEvent
}

async function createBirthControlDay(
  request: APIRequestContext,
  data: { date: string; typeId: string; notes?: string }
): Promise<CreatedEvent> {
  const res = await request.post(`${BASE}/api/birth-control-days`, { data })
  expect(res.ok()).toBeTruthy()
  return (await res.json()) as CreatedEvent
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

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

function getSlide(page: Page, headingName: string | RegExp): Locator {
  return page
    .locator('role=group')
    .filter({ has: page.getByRole('heading', { name: headingName }) })
}

function todayDateString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

async function clickEditForSection(page: Page, sectionLabel: string) {
  // Locate the event section by its label text, then click the first Edit button within it
  const section = page.locator('div.space-y-2').filter({
    has: page.locator(`text="${sectionLabel}"`),
  })
  await section.getByRole('button', { name: 'Edit' }).first().click()
}

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

test.describe('female edit events — prepopulated values', () => {
  test.describe.configure({ mode: 'serial' })

  test('edit period day shows prepopulated values', async ({ page, request }) => {
    await cleanupTodaysEvents(page)

    await createPeriodDay(request, {
      date: todayDateString(),
      flow: 'Heavy',
      color: 'Red',
      notes: 'e2e-edit-period',
    })

    await page.goto('/dashboard')
    await expect(page.getByText('Loading dashboard data...')).not.toBeVisible({ timeout: 15000 })

    await clickEditForSection(page, 'Period')
    await expect(page).toHaveURL(/edit-period-day\?id=/, { timeout: 10000 })
    await expect(page.getByRole('heading', { level: 1, name: 'Edit Period Day' })).toBeVisible({
      timeout: 10000,
    })

    // Verify prepopulated values
    await expect(page.locator('#flow')).toHaveText(/Heavy/i)
    await expect(page.locator('#color')).toHaveText(/Red/i)
    await expect(page.locator('#notes')).toHaveValue('e2e-edit-period')
  })

  test('edit birth control day shows prepopulated values', async ({ page, request }) => {
    await cleanupTodaysEvents(page)

    const typeId = await getTypeId(request, 'birth-control-types', 'Put in Contraceptive Ring')
    await createBirthControlDay(request, {
      date: todayDateString(),
      typeId,
      notes: 'e2e-edit-bc',
    })

    await page.goto('/dashboard')
    await expect(page.getByText('Loading dashboard data...')).not.toBeVisible({ timeout: 15000 })

    await clickEditForSection(page, 'Birth Control')
    await expect(page).toHaveURL(/edit-birth-control-day\?id=/, { timeout: 10000 })
    await expect(
      page.getByRole('heading', { level: 1, name: 'Edit Birth Control Day' })
    ).toBeVisible({
      timeout: 10000,
    })

    await expect(page.locator('#type')).toHaveText(/Put in Contraceptive Ring/)
    await expect(page.locator('#notes')).toHaveValue('e2e-edit-bc')
  })

  test('edit irregular physical day shows prepopulated values', async ({ page, request }) => {
    await cleanupTodaysEvents(page)

    const typeId = await getTypeId(request, 'irregular-physical-types', 'Cramps')
    await createIrregularPhysicalDay(request, {
      date: todayDateString(),
      typeId,
      notes: 'e2e-edit-irreg',
    })

    await page.goto('/dashboard')
    await expect(page.getByText('Loading dashboard data...')).not.toBeVisible({ timeout: 15000 })

    await clickEditForSection(page, 'Irregular Physical')
    await expect(page).toHaveURL(/edit-irregular-physical-day\?id=/, { timeout: 10000 })
    await expect(
      page.getByRole('heading', { level: 1, name: 'Edit Irregular Physical Day' })
    ).toBeVisible({ timeout: 10000 })

    await expect(page.locator('#type')).toHaveText(/Cramps/)
    await expect(page.locator('#notes')).toHaveValue('e2e-edit-irreg')
  })

  test('edit normal physical day shows prepopulated values', async ({ page, request }) => {
    await cleanupTodaysEvents(page)

    const typeId = await getTypeId(request, 'normal-physical-types', 'Exercise')
    await createNormalPhysicalDay(request, {
      date: todayDateString(),
      typeId,
      notes: 'e2e-edit-normal',
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
    await expect(page.locator('#notes')).toHaveValue('e2e-edit-normal')
  })

  test('edit migraine shows all prepopulated values across 14 steps', async ({ page, request }) => {
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
      periodStatus: 'No',
      notes: 'e2e-edit-migraine',
      geographicLocation: 'Home',
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

    // Click edit on the migraine card
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
    // Since endDateTime was set, click "Yes, it's over"
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

    // --- Step 8: Period Status (Female only) ---
    slide = getSlide(page, /period status/i)
    await expect(slide.getByRole('heading', { name: /period status/i })).toBeVisible()
    await expect(slide.getByText('No, I am not on my period')).toBeVisible()
    await slide.getByRole('button', { name: 'Continue' }).click()

    // --- Step 9: Medications ---
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
    await expect(slide.locator('#geographic-location')).toHaveValue('Home')
    await expect(slide.locator('#notes')).toHaveValue('e2e-edit-migraine')
  })

  test('cleanup: remove test events', async ({ page }) => {
    await cleanupTodaysEvents(page)
  })
})
