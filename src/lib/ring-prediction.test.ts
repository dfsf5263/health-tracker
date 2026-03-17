import { describe, expect, it } from 'vitest'
import type { BirthControlDayWithType } from './ring-prediction'
import { predictNextRingEvent } from './ring-prediction'

function makeRingEvent(date: string, isInsertion: boolean, index: number): BirthControlDayWithType {
  return {
    id: `event-${index}`,
    userId: 'user-1',
    date: new Date(date),
    typeId: `type-${isInsertion ? 'insertion' : 'removal'}`,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    type: {
      id: `type-${isInsertion ? 'insertion' : 'removal'}`,
      userId: 'user-1',
      name: isInsertion ? 'Insert Ring' : 'Remove Ring',
      vaginalRingInsertion: isInsertion,
      vaginalRingRemoval: !isInsertion,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }
}

const defaultSettings = {
  daysWithBirthControlRing: 21,
  daysWithoutBirthControlRing: 7,
}

describe('predictNextRingEvent', () => {
  it('returns null prediction when no events', () => {
    const result = predictNextRingEvent([], defaultSettings)
    expect(result.prediction).toBeNull()
    expect(result.basedOnEvents).toBe(0)
  })

  it('returns null prediction when no ring events (non-ring types)', () => {
    const nonRingEvent = {
      ...makeRingEvent('2024-03-01', true, 1),
      type: {
        id: 'type-other',
        userId: 'user-1',
        name: 'Pill',
        vaginalRingInsertion: false,
        vaginalRingRemoval: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }
    const result = predictNextRingEvent([nonRingEvent], defaultSettings)
    expect(result.prediction).toBeNull()
  })

  it('returns null prediction when user settings are missing', () => {
    const events = [makeRingEvent('2024-03-01', true, 1)]
    const result = predictNextRingEvent(events, {})
    expect(result.prediction).toBeNull()
    expect(result.basedOnEvents).toBe(1)
  })

  it('predicts removal after insertion', () => {
    const events = [makeRingEvent('2024-03-01', true, 1)]
    const result = predictNextRingEvent(events, defaultSettings)

    expect(result.prediction).not.toBeNull()
    expect(result.prediction!.eventType).toBe('removal')
    // Verify predicted date is 21 days after insertion
    const expectedDate = new Date('2024-03-01')
    expectedDate.setDate(expectedDate.getDate() + 21)
    expect(result.prediction!.predictedDate.getTime()).toBe(expectedDate.getTime())
  })

  it('predicts insertion after removal', () => {
    const events = [makeRingEvent('2024-03-22', false, 1)]
    const result = predictNextRingEvent(events, defaultSettings)

    expect(result.prediction).not.toBeNull()
    expect(result.prediction!.eventType).toBe('insertion')
    // Verify predicted date is 7 days after removal
    const expectedDate = new Date('2024-03-22')
    expectedDate.setDate(expectedDate.getDate() + 7)
    expect(result.prediction!.predictedDate.getTime()).toBe(expectedDate.getTime())
  })

  it('uses most recent event for prediction', () => {
    const events = [
      makeRingEvent('2024-01-01', true, 1),
      makeRingEvent('2024-01-22', false, 2),
      makeRingEvent('2024-01-29', true, 3),
      makeRingEvent('2024-02-19', false, 4),
    ]
    const result = predictNextRingEvent(events, defaultSettings)

    expect(result.prediction).not.toBeNull()
    expect(result.prediction!.eventType).toBe('insertion')
    expect(result.basedOnEvents).toBe(4)
  })

  it('includes user settings in result', () => {
    const result = predictNextRingEvent([], defaultSettings)
    expect(result.userSettings.daysWithRing).toBe(21)
    expect(result.userSettings.daysWithoutRing).toBe(7)
  })

  it('confidence is higher with more events', () => {
    const singleEvent = [makeRingEvent('2024-03-01', true, 1)]
    const resultSingle = predictNextRingEvent(singleEvent, defaultSettings)

    // Build a consistent history of alternating events
    const manyEvents = [
      makeRingEvent('2024-01-01', true, 1),
      makeRingEvent('2024-01-22', false, 2),
      makeRingEvent('2024-01-29', true, 3),
      makeRingEvent('2024-02-19', false, 4),
      makeRingEvent('2024-02-26', true, 5),
      makeRingEvent('2024-03-18', false, 6),
    ]
    const resultMany = predictNextRingEvent(manyEvents, defaultSettings)

    expect(resultMany.prediction!.confidence).toBeGreaterThanOrEqual(
      resultSingle.prediction!.confidence
    )
  })

  it('confidence is between 50 and 95', () => {
    const events = [makeRingEvent('2024-03-01', true, 1)]
    const result = predictNextRingEvent(events, defaultSettings)

    expect(result.prediction!.confidence).toBeGreaterThanOrEqual(50)
    expect(result.prediction!.confidence).toBeLessThanOrEqual(95)
  })
})
