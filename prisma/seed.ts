import { PrismaPg } from '@prisma/adapter-pg'
import { Color, Flow, PrismaClient } from '@prisma/client'
import { hashPassword } from 'better-auth/crypto'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

// ---------------------------------------------------------------------------
// Type definitions — inlined here because seed runs via tsx outside Next.js
// (no @/ path alias available)
// ---------------------------------------------------------------------------

const BIRTH_CONTROL_TYPES = [
  { name: 'Put in Contraceptive Ring', vaginalRingInsertion: true, vaginalRingRemoval: false },
  { name: 'Took out Contraceptive Ring', vaginalRingInsertion: false, vaginalRingRemoval: true },
]

const IRREGULAR_PHYSICAL_TYPES = [
  'Breast Tenderness',
  'Cramps',
  'Mood Swings',
  'Diarrhea',
  'Constipation',
  'Sleep Dysregulation',
]

const NORMAL_PHYSICAL_TYPES = ['Sex', 'Exercise']

const MIGRAINE_ATTACK_TYPES = [
  'Migraine',
  'Tension Type Headache',
  'Cluster Headache',
  'Postdrome',
  'Headache',
]

const MIGRAINE_SYMPTOM_TYPES = [
  'Pounding Pain',
  'Pulsating Pain',
  'Throbbing Pain',
  'Worse Pain if Moving',
  'Nausea',
  'Vomiting',
  'Sensitivity to Light',
  'Sensitivity to Noise',
  'Neck Pain',
  'Giddiness',
  'Nasal Congestion',
  'Insomnia',
  'Depressed Mood',
  'Anxiety',
  'Sensitivity to Smell',
  'Heat',
  'Ringing in Ears',
  'Fatigue',
  'Blurred Vision',
  'Moody',
  'Diarrhea',
  'Confusion',
  'Lightheaded',
  'My Voice Hurts',
  'Dizzy',
  'Ear Pain',
]

const MIGRAINE_TRIGGER_TYPES = [
  'Stress',
  'Lack of Sleep',
  'Interrupted Sleep',
  'Anxiety',
  'Missed Meal',
  'Variable Weather',
  'High Humidity',
  'Neck Pain',
  'Alcohol',
  'Sun Exposure/Dehydration',
  'Caffeine',
  'Allergy Reaction',
  'Odor/Strong Smell',
  'Rebound Headache',
  'Sinus',
  'Chocolate',
  'Skipped Magnesium',
]

const MIGRAINE_PRECOGNITION_TYPES = [
  'None',
  'Weakness',
  'Fatigue/Achiness',
  'Visual Disturbance',
  'Tingling in Head',
  'Tingling in Neck',
  'Tingling near Eyes',
  'Frequent Yawning',
  'Muscle Stiffness',
  'Irritability',
  'Headache',
  'Aura',
  'Prodrome Only',
  'Unusually Energetic',
  'Unusually Depressed',
  'Confusion',
]

const MIGRAINE_MEDICATION_TYPES = [
  'None',
  'Zomig 5mg',
  'Relpax 20mg',
  'Maxalt 5mg',
  'Paracetamol 500mg',
  'Topiramate 25mg',
  'Ibuprofen 200mg',
  'Sumatriptan 0.1ml',
  'Tylenol 200mg',
  'Flonase',
  'Zyrtec',
  'Decongestant',
  'Nurtec 75mg',
  'Naratriptan 2.5mg',
]

const MIGRAINE_RELIEF_TYPES = [
  'Darkroom Rest',
  'Sleep',
  'Yoga/Meditate',
  'Stay Indoor',
  'Icepack',
  'Food',
  'Caffeine',
  'Hot Shower',
  'Cold Shower',
  'Drink Water',
  'Heatpad',
  'Weighted Eye Mask',
  'Medicine',
  'Massage',
]

const MIGRAINE_ACTIVITY_TYPES = [
  'Not Affected',
  'Missed Work',
  'Slower at Work',
  'Missed Social Activity',
  'Slower at Home',
  'Missed Family Time',
  'Could Not Fall Asleep',
  'Woke Up During Sleep',
  'No Screen/Phone',
  'Hard to Concentrate',
]

const MIGRAINE_LOCATIONS = [
  'Headband',
  'Front Right Top of Head',
  'Front Left Top of Head',
  'Back Right Top of Head',
  'Back Left Top of Head',
  'Left Temple',
  'Right Temple',
  'Left Eye',
  'Right Eye',
  'Bridge of Nose/Sinusus',
  'Left Cheek',
  'Right Cheek',
  'Left Jaw',
  'Right Jaw',
  'Mouth',
  'Left Neck',
  'Right Neck',
  'Left Base of Skull/Back of Head',
  'Right Base of Skull/Back of Head',
]

// ---------------------------------------------------------------------------
// Helper: date relative to today
// ---------------------------------------------------------------------------
function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

// ---------------------------------------------------------------------------
// Seed migraine location types (global — not user-scoped)
// ---------------------------------------------------------------------------
async function seedMigraineLocationTypes() {
  console.log('Seeding migraine location types...')
  for (const name of MIGRAINE_LOCATIONS) {
    await prisma.migraineLocationType.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }
  console.log(`✓ Seeded ${MIGRAINE_LOCATIONS.length} migraine location types.`)
}

// ---------------------------------------------------------------------------
// Seed E2E user + Better Auth account
// ---------------------------------------------------------------------------
async function seedE2EUser() {
  const email = process.env.E2E_EMAIL ?? 'e2e@test.local'
  const password = process.env.E2E_PASSWORD ?? 'E2eTestPassword1!'
  const hashed = await hashPassword(password)

  console.log(`Seeding E2E user (${email})...`)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      sex: 'Female',
    },
    create: {
      email,
      name: 'E2E Test User',
      firstName: 'E2E',
      lastName: 'User',
      emailVerified: true,
      sex: 'Female',
      daysWithBirthControlRing: 21,
      daysWithoutBirthControlRing: 7,
      averageCycleLength: 28,
      averagePeriodLength: 5,
    },
  })

  // Better Auth credential account — upsert by unique (providerId, accountId)
  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: 'credential',
        accountId: user.id,
      },
    },
    update: { password: hashed },
    create: {
      userId: user.id,
      accountId: user.id,
      providerId: 'credential',
      password: hashed,
    },
  })

  console.log(`✓ E2E user created: ${user.id}`)
  return user
}

// ---------------------------------------------------------------------------
// Prepopulate all user-scoped event types for the E2E user
// ---------------------------------------------------------------------------
async function seedUserTypes(userId: string) {
  console.log('Seeding user event types...')

  await prisma.birthControlType.createMany({
    data: BIRTH_CONTROL_TYPES.map((t) => ({ userId, ...t })),
    skipDuplicates: true,
  })

  await prisma.irregularPhysicalType.createMany({
    data: IRREGULAR_PHYSICAL_TYPES.map((name) => ({ userId, name })),
    skipDuplicates: true,
  })

  await prisma.normalPhysicalType.createMany({
    data: NORMAL_PHYSICAL_TYPES.map((name) => ({ userId, name })),
    skipDuplicates: true,
  })

  await prisma.migraineAttackType.createMany({
    data: MIGRAINE_ATTACK_TYPES.map((name) => ({ userId, name })),
    skipDuplicates: true,
  })

  await prisma.migraineSymptomType.createMany({
    data: MIGRAINE_SYMPTOM_TYPES.map((name) => ({ userId, name })),
    skipDuplicates: true,
  })

  await prisma.migraineTriggerType.createMany({
    data: MIGRAINE_TRIGGER_TYPES.map((name) => ({ userId, name })),
    skipDuplicates: true,
  })

  await prisma.migrainePrecognitionType.createMany({
    data: MIGRAINE_PRECOGNITION_TYPES.map((name) => ({ userId, name })),
    skipDuplicates: true,
  })

  await prisma.migraineMedicationType.createMany({
    data: MIGRAINE_MEDICATION_TYPES.map((name) => ({ userId, name })),
    skipDuplicates: true,
  })

  await prisma.migraineReliefType.createMany({
    data: MIGRAINE_RELIEF_TYPES.map((name) => ({ userId, name })),
    skipDuplicates: true,
  })

  await prisma.migraineActivityType.createMany({
    data: MIGRAINE_ACTIVITY_TYPES.map((name) => ({ userId, name })),
    skipDuplicates: true,
  })

  console.log('✓ All user event types seeded.')
}

// ---------------------------------------------------------------------------
// Seed period days + cycles (3 cycles, ~28 days apart, 5 days each)
// ---------------------------------------------------------------------------
async function seedPeriodData(userId: string) {
  console.log('Seeding period days and cycles...')

  const flowPattern: Flow[] = [Flow.Light, Flow.Medium, Flow.Heavy, Flow.Medium, Flow.Light]
  const colorPattern: Color[] = [Color.Brown, Color.Red, Color.Red, Color.Red, Color.Brown]

  // 3 cycles: ~84, ~56, ~28 days ago
  const cycleStarts = [84, 56, 28]

  for (const startOffset of cycleStarts) {
    const periodDays: { date: Date; flow: Flow; color: Color }[] = []
    for (let day = 0; day < 5; day++) {
      periodDays.push({
        date: daysAgo(startOffset - day),
        flow: flowPattern[day],
        color: colorPattern[day],
      })
    }

    // Upsert period days
    for (const pd of periodDays) {
      await prisma.periodDay.upsert({
        where: { userId_date: { userId, date: pd.date } },
        update: {},
        create: { userId, date: pd.date, flow: pd.flow, color: pd.color },
      })
    }

    // Create cycle spanning start → end of this period
    const startDate = periodDays[0].date
    const endDate = periodDays[periodDays.length - 1].date
    await prisma.cycle.create({
      data: { userId, startDate, endDate },
    })
  }

  console.log('✓ 3 cycles with period days seeded.')
}

// ---------------------------------------------------------------------------
// Seed birth control days (ring insertion/removal events)
// ---------------------------------------------------------------------------
async function seedBirthControlDays(userId: string) {
  console.log('Seeding birth control days...')

  const insertionType = await prisma.birthControlType.findFirst({
    where: { userId, vaginalRingInsertion: true },
  })
  const removalType = await prisma.birthControlType.findFirst({
    where: { userId, vaginalRingRemoval: true },
  })

  if (!insertionType || !removalType) {
    console.log('⚠ Skipping birth control days — types not found.')
    return
  }

  // Ring cycle: inserted 50 days ago, removed 29 days ago, inserted 22 days ago, removed 1 day ago
  const events: { date: Date; typeId: string }[] = [
    { date: daysAgo(50), typeId: insertionType.id },
    { date: daysAgo(29), typeId: removalType.id },
    { date: daysAgo(22), typeId: insertionType.id },
    { date: daysAgo(1), typeId: removalType.id },
  ]

  for (const event of events) {
    await prisma.birthControlDay.upsert({
      where: {
        userId_date_typeId: { userId, date: event.date, typeId: event.typeId },
      },
      update: {},
      create: { userId, date: event.date, typeId: event.typeId },
    })
  }

  console.log('✓ Birth control days seeded.')
}

// ---------------------------------------------------------------------------
// Seed migraines with type relations
// ---------------------------------------------------------------------------
async function seedMigraines(userId: string) {
  console.log('Seeding migraines...')

  // Look up some types to link
  const attackType = await prisma.migraineAttackType.findFirst({
    where: { userId, name: 'Migraine' },
  })
  const symptomTypes = await prisma.migraineSymptomType.findMany({
    where: { userId, name: { in: ['Throbbing Pain', 'Nausea', 'Sensitivity to Light'] } },
  })
  const triggerTypes = await prisma.migraineTriggerType.findMany({
    where: { userId, name: { in: ['Stress', 'Lack of Sleep'] } },
  })
  const locationTypes = await prisma.migraineLocationType.findMany({
    where: { name: { in: ['Left Temple', 'Left Eye'] } },
  })
  const medicationType = await prisma.migraineMedicationType.findFirst({
    where: { userId, name: 'Sumatriptan 0.1ml' },
  })
  const reliefType = await prisma.migraineReliefType.findFirst({
    where: { userId, name: 'Darkroom Rest' },
  })
  const activityType = await prisma.migraineActivityType.findFirst({
    where: { userId, name: 'Missed Work' },
  })

  // Migraine 1: 10 days ago, severe
  const m1Start = daysAgo(10)
  m1Start.setHours(14, 30, 0, 0)
  const m1End = new Date(m1Start)
  m1End.setHours(22, 0, 0, 0)

  const migraine1 = await prisma.migraine.create({
    data: {
      userId,
      startDateTime: m1Start,
      endDateTime: m1End,
      painLevel: 8,
      geographicLocation: 'Home',
      periodStatus: 'No',
      notes: 'E2E seed migraine 1',
    },
  })

  // Link types to migraine 1
  if (attackType) {
    await prisma.migraineMigraineAttackType.create({
      data: { migraineId: migraine1.id, migraineAttackTypeId: attackType.id },
    })
  }
  for (const st of symptomTypes) {
    await prisma.migraineMigraineSymptomType.create({
      data: { migraineId: migraine1.id, migraineSymptomTypeId: st.id },
    })
  }
  for (const tt of triggerTypes) {
    await prisma.migraineMigraineTriggerType.create({
      data: { migraineId: migraine1.id, migraineTriggerTypeId: tt.id },
    })
  }
  for (const lt of locationTypes) {
    await prisma.migraineMigraineLocationType.create({
      data: { migraineId: migraine1.id, migraineLocationTypeId: lt.id },
    })
  }
  if (medicationType) {
    await prisma.migraineMigraineMedicationType.create({
      data: {
        migraineId: migraine1.id,
        migraineMedicationTypeId: medicationType.id,
        dosageModifier: 1.0,
      },
    })
  }
  if (reliefType) {
    await prisma.migraineMigraineReliefType.create({
      data: { migraineId: migraine1.id, migraineReliefTypeId: reliefType.id },
    })
  }
  if (activityType) {
    await prisma.migraineMigraineActivityType.create({
      data: { migraineId: migraine1.id, migraineActivityTypeId: activityType.id },
    })
  }

  // Migraine 2: 40 days ago, moderate
  const m2Start = daysAgo(40)
  m2Start.setHours(9, 0, 0, 0)
  const m2End = new Date(m2Start)
  m2End.setHours(16, 0, 0, 0)

  const migraine2 = await prisma.migraine.create({
    data: {
      userId,
      startDateTime: m2Start,
      endDateTime: m2End,
      painLevel: 5,
      geographicLocation: 'Office',
      periodStatus: 'Yes',
      notes: 'E2E seed migraine 2',
    },
  })

  if (attackType) {
    await prisma.migraineMigraineAttackType.create({
      data: { migraineId: migraine2.id, migraineAttackTypeId: attackType.id },
    })
  }
  if (symptomTypes.length > 0) {
    await prisma.migraineMigraineSymptomType.create({
      data: { migraineId: migraine2.id, migraineSymptomTypeId: symptomTypes[0].id },
    })
  }

  console.log('✓ 2 migraines with type relations seeded.')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('Seeding database...')

  await seedMigraineLocationTypes()

  // Only seed E2E data when E2E_EMAIL is set or in E2E database context
  const e2eEmail = process.env.E2E_EMAIL ?? 'e2e@test.local'
  const user = await seedE2EUser()
  await seedUserTypes(user.id)
  await seedPeriodData(user.id)
  await seedBirthControlDays(user.id)
  await seedMigraines(user.id)

  console.log('Database seeding completed.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
