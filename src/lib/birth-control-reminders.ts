import { User, BirthControlDay, BirthControlType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { RingPredictionResult } from '@/lib/ring-prediction'

export interface BirthControlDayWithType extends BirthControlDay {
  type: BirthControlType
}

export type UserReminderSettings = User

export interface ReminderQualification {
  shouldSendReminder: boolean
  reminderType: 'insertion' | 'removal' | null
  reason: string
}

export interface ReminderResult {
  userId: string
  email: string
  firstName: string
  qualified: boolean
  reminderType: 'insertion' | 'removal' | null
  reason: string
  emailSent: boolean
  error?: string
}

/**
 * Get all users eligible for birth control reminders (have email notifications enabled)
 */
export async function getEligibleUsers(): Promise<UserReminderSettings[]> {
  return await prisma.user.findMany({
    where: {
      birthControlEmailNotifications: true,
      emailVerified: true, // Only send to verified email addresses
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      name: true,
      birthControlEmailNotifications: true,
      ringInsertionReminderTime: true,
      ringRemovalReminderTime: true,
      // Include other required User fields
      emailVerified: true,
      image: true,
      passwordHash: true,
      twoFactorEnabled: true,
      daysWithoutBirthControlRing: true,
      daysWithBirthControlRing: true,
      averageCycleLength: true,
      averagePeriodLength: true,
      sex: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

/**
 * Determine which 15-minute window we're currently in
 */
export function getCurrentTimeWindow(): { hour: number; start: number; end: number } {
  const now = new Date()
  const hour = now.getHours()
  const minutes = now.getMinutes()
  const windowStart = Math.floor(minutes / 15) * 15
  const windowEnd = windowStart + 14 // 15-minute window (0-14, 15-29, 30-44, 45-59)

  console.log(`[DEBUG] Current local time: ${now.toLocaleString()}`)
  console.log(
    `[DEBUG] Current time window (local): ${hour.toString().padStart(2, '0')}:${windowStart.toString().padStart(2, '0')}-${hour.toString().padStart(2, '0')}:${windowEnd.toString().padStart(2, '0')}`
  )

  return { hour, start: windowStart, end: windowEnd }
}

/**
 * Check if a time (HH:MM) falls within the current 15-minute window
 */
export function isTimeInCurrentWindow(timeString: string): boolean {
  if (!timeString) {
    console.log(`[DEBUG] isTimeInCurrentWindow: No time string provided`)
    return false
  }

  const [hours, minutes] = timeString.split(':').map(Number)
  const { hour: currentHour, start, end } = getCurrentTimeWindow()

  const isInWindow = hours === currentHour && minutes >= start && minutes <= end

  console.log(
    `[DEBUG] Checking time ${timeString}: hour=${hours} (current=${currentHour}), minutes=${minutes} (window=${start}-${end}) => ${isInWindow ? 'IN WINDOW' : 'NOT in window'}`
  )

  return isInWindow
}

/**
 * Get default reminder times (12:00) if user hasn't set them
 */
export function getReminderTimes(user: UserReminderSettings): {
  insertionTime: string
  removalTime: string
} {
  const defaultTime = '12:00'

  const insertionTime =
    user.ringInsertionReminderTime?.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    }) || defaultTime
  const removalTime =
    user.ringRemovalReminderTime?.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    }) || defaultTime

  console.log(
    `[DEBUG] User ${user.email} reminder times (local): insertion=${insertionTime}, removal=${removalTime}`
  )

  return {
    insertionTime,
    removalTime,
  }
}

/**
 * Check if user has a birth control event of the specified type today
 */
export async function hasTodaysEvent(
  userId: string,
  eventType: 'insertion' | 'removal'
): Promise<boolean> {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1)

  const event = await prisma.birthControlDay.findFirst({
    where: {
      userId,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
      type: {
        ...(eventType === 'insertion'
          ? { vaginalRingInsertion: true }
          : { vaginalRingRemoval: true }),
      },
    },
    include: {
      type: true,
    },
  })

  return !!event
}

/**
 * Get ring prediction for a user
 */
export async function getRingPrediction(userId: string): Promise<RingPredictionResult | null> {
  try {
    // We need to call our own API internally, but we'll implement the logic directly here
    // to avoid HTTP overhead within the same process

    // Get user settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        daysWithBirthControlRing: true,
        daysWithoutBirthControlRing: true,
      },
    })

    if (!user) return null

    // Get birth control events with ring types
    const birthControlEvents = (await prisma.birthControlDay.findMany({
      where: {
        userId,
        type: {
          OR: [{ vaginalRingInsertion: true }, { vaginalRingRemoval: true }],
        },
      },
      include: {
        type: true,
      },
      orderBy: {
        date: 'desc',
      },
    })) as BirthControlDayWithType[]

    // Use the prediction logic directly
    const { predictNextRingEvent } = await import('@/lib/ring-prediction')

    return predictNextRingEvent(birthControlEvents, {
      daysWithBirthControlRing: user.daysWithBirthControlRing || undefined,
      daysWithoutBirthControlRing: user.daysWithoutBirthControlRing || undefined,
    })
  } catch (error) {
    console.error(`Error getting ring prediction for user ${userId}:`, error)
    return null
  }
}

/**
 * Check if a prediction qualifies for a reminder
 */
export function isPredictionQualified(
  prediction: RingPredictionResult,
  reminderType: 'insertion' | 'removal'
): boolean {
  if (!prediction.prediction) {
    console.log(`[DEBUG] isPredictionQualified: No prediction available`)
    return false
  }

  // Check if prediction is for today
  const today = new Date()
  const predictedDate = new Date(prediction.prediction.predictedDate)

  // Compare calendar dates: use UTC parts for predicted date (stored as UTC midnight)
  // and local parts for today (user's current local date)
  const isToday =
    today.getFullYear() === predictedDate.getUTCFullYear() &&
    today.getMonth() === predictedDate.getUTCMonth() &&
    today.getDate() === predictedDate.getUTCDate()

  // Check if prediction type matches reminder type
  const typeMatches = prediction.prediction.eventType === reminderType

  console.log(
    `[DEBUG] isPredictionQualified: predicted date=${predictedDate.toISOString()}, today=${today.toISOString()}, isToday=${isToday}, type=${prediction.prediction.eventType}, reminderType=${reminderType}, typeMatches=${typeMatches}`
  )

  return isToday && typeMatches
}

/**
 * Determine if a user qualifies for a birth control reminder
 */
export async function qualifyUserForReminder(
  user: UserReminderSettings
): Promise<ReminderQualification> {
  console.log(`[DEBUG] Qualifying user ${user.email} for reminder`)

  const { insertionTime, removalTime } = getReminderTimes(user)

  // Check if either reminder time is in the current window
  const insertionInWindow = isTimeInCurrentWindow(insertionTime)
  const removalInWindow = isTimeInCurrentWindow(removalTime)

  console.log(
    `[DEBUG] Time window check results: insertion=${insertionInWindow}, removal=${removalInWindow}`
  )

  if (!insertionInWindow && !removalInWindow) {
    console.log(`[DEBUG] User ${user.email}: No reminder times in current window`)
    return {
      shouldSendReminder: false,
      reminderType: null,
      reason: 'No reminder times in current window',
    }
  }

  // Check insertion reminder
  if (insertionInWindow) {
    console.log(`[DEBUG] Checking insertion reminder for user ${user.email}`)

    // First check if they have today's insertion event
    const hasTodaysInsertion = await hasTodaysEvent(user.id, 'insertion')
    console.log(`[DEBUG] Today's insertion event check: ${hasTodaysInsertion}`)

    if (hasTodaysInsertion) {
      console.log(
        `[DEBUG] User ${user.email}: Qualifying for insertion reminder (has today's event)`
      )
      return {
        shouldSendReminder: true,
        reminderType: 'insertion',
        reason: 'User has insertion event today and time is in current window',
      }
    }

    // If no today's event, check prediction
    const prediction = await getRingPrediction(user.id)
    const predictionQualified = prediction && isPredictionQualified(prediction, 'insertion')
    console.log(`[DEBUG] Insertion prediction check: ${predictionQualified}`)

    if (predictionQualified) {
      console.log(`[DEBUG] User ${user.email}: Qualifying for insertion reminder (predicted event)`)
      return {
        shouldSendReminder: true,
        reminderType: 'insertion',
        reason: 'Predicted insertion event for today and time is in current window',
      }
    }
  }

  // Check removal reminder
  if (removalInWindow) {
    console.log(`[DEBUG] Checking removal reminder for user ${user.email}`)

    // First check if they have today's removal event
    const hasTodaysRemoval = await hasTodaysEvent(user.id, 'removal')
    console.log(`[DEBUG] Today's removal event check: ${hasTodaysRemoval}`)

    if (hasTodaysRemoval) {
      console.log(`[DEBUG] User ${user.email}: Qualifying for removal reminder (has today's event)`)
      return {
        shouldSendReminder: true,
        reminderType: 'removal',
        reason: 'User has removal event today and time is in current window',
      }
    }

    // If no today's event, check prediction
    const prediction = await getRingPrediction(user.id)
    const predictionQualified = prediction && isPredictionQualified(prediction, 'removal')
    console.log(`[DEBUG] Removal prediction check: ${predictionQualified}`)

    if (predictionQualified) {
      console.log(`[DEBUG] User ${user.email}: Qualifying for removal reminder (predicted event)`)
      return {
        shouldSendReminder: true,
        reminderType: 'removal',
        reason: 'Predicted removal event for today and time is in current window',
      }
    }
  }

  console.log(`[DEBUG] User ${user.email}: No qualifying events or predictions found`)
  return {
    shouldSendReminder: false,
    reminderType: null,
    reason: 'No qualifying events or predictions found',
  }
}

/**
 * Process all eligible users for birth control reminders
 */
export async function processReminderUsers(): Promise<ReminderResult[]> {
  const jobStartTime = new Date()
  console.log(
    `[DEBUG] Birth control reminder job started at: ${jobStartTime.toLocaleString()} (local time)`
  )
  console.log(
    `[DEBUG] All times in this system are in local time. Users set their reminder times in their local timezone.`
  )

  const users = await getEligibleUsers()
  const results: ReminderResult[] = []

  console.log(`Processing ${users.length} eligible users for birth control reminders`)

  for (const user of users) {
    try {
      const qualification = await qualifyUserForReminder(user)

      const result: ReminderResult = {
        userId: user.id,
        email: user.email,
        firstName: user.firstName || user.name?.split(' ')[0] || user.email.split('@')[0],
        qualified: qualification.shouldSendReminder,
        reminderType: qualification.reminderType,
        reason: qualification.reason,
        emailSent: false,
      }

      if (qualification.shouldSendReminder && qualification.reminderType) {
        // Email sending will be handled by the calling code
        result.emailSent = true // Will be updated by caller
      }

      results.push(result)

      console.log(`User ${user.email}: ${qualification.reason}`)
    } catch (error) {
      console.error(`Error processing user ${user.email}:`, error)
      results.push({
        userId: user.id,
        email: user.email,
        firstName: user.firstName || user.name?.split(' ')[0] || user.email.split('@')[0],
        qualified: false,
        reminderType: null,
        reason: 'Error processing user',
        emailSent: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return results
}
