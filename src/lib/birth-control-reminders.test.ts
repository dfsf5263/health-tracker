import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/test/mocks/db'

// Mock ring-prediction module for getRingPrediction
vi.mock('@/lib/ring-prediction', () => ({
  predictNextRingEvent: vi.fn(),
}))

import {
  getCurrentTimeWindow,
  isTimeInCurrentWindow,
  getReminderTimes,
  isPredictionQualified,
  getEligibleUsers,
  hasTodaysEvent,
  qualifyUserForReminder,
} from './birth-control-reminders'
import type { RingPredictionResult } from './ring-prediction'

// Suppress console.log output from the module's DEBUG logging
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('getCurrentTimeWindow', () => {
  it('returns correct window at 10:00', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 2, 15, 10, 0, 0))
    const window = getCurrentTimeWindow()
    expect(window.hour).toBe(10)
    expect(window.start).toBe(0)
    expect(window.end).toBe(14)
  })

  it('returns correct window at 10:17', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 2, 15, 10, 17, 0))
    const window = getCurrentTimeWindow()
    expect(window.hour).toBe(10)
    expect(window.start).toBe(15)
    expect(window.end).toBe(29)
  })

  it('returns correct window at 23:45', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 2, 15, 23, 45, 0))
    const window = getCurrentTimeWindow()
    expect(window.hour).toBe(23)
    expect(window.start).toBe(45)
    expect(window.end).toBe(59)
  })

  it('returns correct window at 14:30', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 2, 15, 14, 30, 0))
    const window = getCurrentTimeWindow()
    expect(window.hour).toBe(14)
    expect(window.start).toBe(30)
    expect(window.end).toBe(44)
  })
})

describe('isTimeInCurrentWindow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 2, 15, 10, 5, 0)) // 10:05, window is 10:00-10:14
  })

  it('returns true for time in window', () => {
    expect(isTimeInCurrentWindow('10:05')).toBe(true)
    expect(isTimeInCurrentWindow('10:00')).toBe(true)
    expect(isTimeInCurrentWindow('10:14')).toBe(true)
  })

  it('returns false for time outside window', () => {
    expect(isTimeInCurrentWindow('10:15')).toBe(false)
    expect(isTimeInCurrentWindow('09:05')).toBe(false)
    expect(isTimeInCurrentWindow('11:05')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isTimeInCurrentWindow('')).toBe(false)
  })
})

describe('getReminderTimes', () => {
  it('returns default 12:00 when user has no times set', () => {
    const user = {
      ringInsertionReminderTime: null,
      ringRemovalReminderTime: null,
    } as never

    const times = getReminderTimes(user)
    expect(times.insertionTime).toBe('12:00')
    expect(times.removalTime).toBe('12:00')
  })

  it('formats user-set times in HH:MM format', () => {
    const insertionDate = new Date(2024, 0, 1, 9, 30, 0) // 09:30
    const removalDate = new Date(2024, 0, 1, 18, 0, 0) // 18:00

    const user = {
      ringInsertionReminderTime: insertionDate,
      ringRemovalReminderTime: removalDate,
    } as never

    const times = getReminderTimes(user)
    expect(times.insertionTime).toMatch(/^0?9:30$/)
    expect(times.removalTime).toMatch(/^18:00$/)
  })
})

describe('isPredictionQualified', () => {
  it('returns false when no prediction available', () => {
    const result: RingPredictionResult = {
      prediction: null,
      basedOnEvents: 0,
      userSettings: {},
    }
    expect(isPredictionQualified(result, 'insertion')).toBe(false)
  })

  it('returns true when prediction is for today and type matches', () => {
    vi.useFakeTimers()
    const today = new Date(2024, 2, 15, 12, 0, 0) // March 15, 2024
    vi.setSystemTime(today)

    const result: RingPredictionResult = {
      prediction: {
        predictedDate: new Date(Date.UTC(2024, 2, 15)), // UTC midnight March 15
        eventType: 'insertion',
        confidence: 85,
      },
      basedOnEvents: 5,
      userSettings: { daysWithRing: 21, daysWithoutRing: 7 },
    }

    expect(isPredictionQualified(result, 'insertion')).toBe(true)
  })

  it('returns false when prediction type does not match', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 2, 15, 12, 0, 0))

    const result: RingPredictionResult = {
      prediction: {
        predictedDate: new Date(Date.UTC(2024, 2, 15)),
        eventType: 'removal',
        confidence: 85,
      },
      basedOnEvents: 5,
      userSettings: { daysWithRing: 21, daysWithoutRing: 7 },
    }

    expect(isPredictionQualified(result, 'insertion')).toBe(false)
  })

  it('returns false when prediction is for a different day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 2, 15, 12, 0, 0))

    const result: RingPredictionResult = {
      prediction: {
        predictedDate: new Date(Date.UTC(2024, 2, 16)), // Tomorrow
        eventType: 'insertion',
        confidence: 85,
      },
      basedOnEvents: 5,
      userSettings: { daysWithRing: 21, daysWithoutRing: 7 },
    }

    expect(isPredictionQualified(result, 'insertion')).toBe(false)
  })
})

describe('getEligibleUsers', () => {
  it('queries for users with notifications enabled and verified email', async () => {
    db.user.findMany.mockResolvedValue([])

    await getEligibleUsers()

    expect(db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          birthControlEmailNotifications: true,
          emailVerified: true,
        },
      })
    )
  })
})

describe('hasTodaysEvent', () => {
  it('queries for today insertion events', async () => {
    db.birthControlDay.findFirst.mockResolvedValue(null)

    const result = await hasTodaysEvent('user-1', 'insertion')

    expect(result).toBe(false)
    expect(db.birthControlDay.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          type: { vaginalRingInsertion: true },
        }),
      })
    )
  })

  it('returns true when event exists', async () => {
    db.birthControlDay.findFirst.mockResolvedValue({ id: 'event-1' } as never)

    const result = await hasTodaysEvent('user-1', 'removal')
    expect(result).toBe(true)
  })
})

describe('qualifyUserForReminder', () => {
  it('returns no reminder when times are not in current window', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 2, 15, 10, 5, 0)) // 10:05

    const user = {
      id: 'user-1',
      email: 'test@example.com',
      ringInsertionReminderTime: new Date(2024, 0, 1, 14, 0, 0), // 14:00 — not in window
      ringRemovalReminderTime: new Date(2024, 0, 1, 18, 0, 0), // 18:00 — not in window
    } as never

    const result = await qualifyUserForReminder(user)
    expect(result.shouldSendReminder).toBe(false)
    expect(result.reminderType).toBeNull()
  })
})
