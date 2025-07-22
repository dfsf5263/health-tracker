import { BirthControlDay, BirthControlType } from '@prisma/client'
import { addDays } from 'date-fns'

export interface BirthControlDayWithType extends BirthControlDay {
  type: BirthControlType
}

export interface RingPrediction {
  predictedDate: Date
  eventType: 'insertion' | 'removal'
  confidence: number
}

export interface RingPredictionResult {
  prediction: RingPrediction | null
  basedOnEvents: number
  userSettings: {
    daysWithRing?: number
    daysWithoutRing?: number
  }
}

interface UserRingSettings {
  daysWithBirthControlRing?: number
  daysWithoutBirthControlRing?: number
}

/**
 * Predicts the next birth control ring event based on the most recent ring event
 * and user's ring schedule settings
 */
export function predictNextRingEvent(
  birthControlEvents: BirthControlDayWithType[],
  userSettings: UserRingSettings
): RingPredictionResult {
  const result: RingPredictionResult = {
    prediction: null,
    basedOnEvents: 0,
    userSettings: {
      daysWithRing: userSettings.daysWithBirthControlRing,
      daysWithoutRing: userSettings.daysWithoutBirthControlRing,
    },
  }

  // Filter events to only include ring insertion/removal events
  const ringEvents = birthControlEvents.filter(
    (event) => event.type.vaginalRingInsertion || event.type.vaginalRingRemoval
  )

  result.basedOnEvents = ringEvents.length

  // Need at least one ring event to make predictions
  if (ringEvents.length === 0) {
    return result
  }

  // Need user settings to make predictions
  if (!userSettings.daysWithBirthControlRing || !userSettings.daysWithoutBirthControlRing) {
    return result
  }

  // Sort events by date to find the most recent
  const sortedEvents = ringEvents.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const mostRecentEvent = sortedEvents[0]

  // Determine what type of event the most recent one was
  const wasInsertion = mostRecentEvent.type.vaginalRingInsertion
  const wasRemoval = mostRecentEvent.type.vaginalRingRemoval

  let predictedDate: Date
  let eventType: 'insertion' | 'removal'

  if (wasInsertion) {
    // If last event was insertion, predict removal after daysWithRing
    predictedDate = addDays(new Date(mostRecentEvent.date), userSettings.daysWithBirthControlRing)
    eventType = 'removal'
  } else if (wasRemoval) {
    // If last event was removal, predict insertion after daysWithoutRing
    predictedDate = addDays(
      new Date(mostRecentEvent.date),
      userSettings.daysWithoutBirthControlRing
    )
    eventType = 'insertion'
  } else {
    // This shouldn't happen given our filter, but handle it gracefully
    return result
  }

  // Calculate confidence based on consistency of user's historical events
  const confidence = calculateRingEventConfidence(ringEvents, userSettings)

  result.prediction = {
    predictedDate,
    eventType,
    confidence,
  }

  return result
}

/**
 * Calculate confidence in ring predictions based on historical consistency
 */
function calculateRingEventConfidence(
  ringEvents: BirthControlDayWithType[],
  userSettings: UserRingSettings
): number {
  // Base confidence starts high since we're using user-defined settings
  let confidence = 85

  // Reduce confidence if we have very few historical events
  if (ringEvents.length < 3) {
    confidence -= 20
  } else if (ringEvents.length < 5) {
    confidence -= 10
  }

  // If user hasn't been consistent with their settings, reduce confidence
  if (ringEvents.length >= 4) {
    const consistency = analyzeEventConsistency(ringEvents, userSettings)
    confidence = Math.max(50, confidence - (1 - consistency) * 30)
  }

  return Math.round(Math.max(50, Math.min(95, confidence)))
}

/**
 * Analyze how consistent the user's historical events are with their current settings
 */
function analyzeEventConsistency(
  ringEvents: BirthControlDayWithType[],
  userSettings: UserRingSettings
): number {
  if (!userSettings.daysWithBirthControlRing || !userSettings.daysWithoutBirthControlRing) {
    return 0.5 // Medium consistency if settings are incomplete
  }

  // Sort events by date (oldest first for interval analysis)
  const sortedEvents = ringEvents.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  let consistentIntervals = 0
  let totalIntervals = 0

  for (let i = 1; i < sortedEvents.length; i++) {
    const currentEvent = sortedEvents[i]
    const previousEvent = sortedEvents[i - 1]

    const daysBetween = Math.round(
      (new Date(currentEvent.date).getTime() - new Date(previousEvent.date).getTime()) /
        (1000 * 60 * 60 * 24)
    )

    totalIntervals++

    // Check if the interval matches expected pattern
    const wasInsertionThenRemoval =
      previousEvent.type.vaginalRingInsertion && currentEvent.type.vaginalRingRemoval
    const wasRemovalThenInsertion =
      previousEvent.type.vaginalRingRemoval && currentEvent.type.vaginalRingInsertion

    if (
      wasInsertionThenRemoval &&
      Math.abs(daysBetween - userSettings.daysWithBirthControlRing) <= 1
    ) {
      consistentIntervals++
    } else if (
      wasRemovalThenInsertion &&
      Math.abs(daysBetween - userSettings.daysWithoutBirthControlRing) <= 1
    ) {
      consistentIntervals++
    }
  }

  return totalIntervals > 0 ? consistentIntervals / totalIntervals : 0.5
}
