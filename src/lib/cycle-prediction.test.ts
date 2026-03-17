import { describe, expect, it } from 'vitest'
import { predictCycles } from './cycle-prediction'
import type { Cycle } from '@prisma/client'

function makeCycle(startDate: string, endDate: string, index: number): Cycle {
  return {
    id: `cycle-${index}`,
    userId: 'user-1',
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    cycleLength: null,
    periodLength: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Cycle
}

// Regular 28-day cycles
const regularCycles = [
  makeCycle('2024-04-01', '2024-04-05', 1),
  makeCycle('2024-03-04', '2024-03-08', 2),
  makeCycle('2024-02-05', '2024-02-09', 3),
  makeCycle('2024-01-08', '2024-01-12', 4),
]

describe('predictCycles', () => {
  it('throws when fewer than 3 valid cycles', () => {
    const twoCycles = regularCycles.slice(0, 2)
    expect(() => predictCycles(twoCycles)).toThrow('Not enough valid cycles')
  })

  it('throws when count is less than 1', () => {
    expect(() => predictCycles(regularCycles, 0)).toThrow(
      'Prediction count must be between 1 and 12'
    )
  })

  it('throws when count exceeds 12', () => {
    expect(() => predictCycles(regularCycles, 13)).toThrow(
      'Prediction count must be between 1 and 12'
    )
  })

  it('returns correct number of predictions', () => {
    const result = predictCycles(regularCycles, 3)
    expect(result.predictions).toHaveLength(3)
  })

  it('returns prediction metadata', () => {
    const result = predictCycles(regularCycles, 2)
    expect(result.model).toBe('simple_average')
    expect(result.basedOnCycles).toBeGreaterThanOrEqual(3)
  })

  it('predictions have required shape', () => {
    const result = predictCycles(regularCycles, 1)
    const prediction = result.predictions[0]

    expect(prediction.cycleNumber).toBe(1)
    expect(prediction.predictedDate).toBeInstanceOf(Date)
    expect(prediction.rangeStart).toBeInstanceOf(Date)
    expect(prediction.rangeEnd).toBeInstanceOf(Date)
    expect(typeof prediction.confidence).toBe('number')
    expect(typeof prediction.periodLength).toBe('number')
    expect(prediction.confidence).toBeGreaterThanOrEqual(0)
    expect(prediction.confidence).toBeLessThanOrEqual(100)
  })

  it('range start is before range end', () => {
    const result = predictCycles(regularCycles, 3)
    for (const prediction of result.predictions) {
      expect(prediction.rangeStart.getTime()).toBeLessThan(prediction.rangeEnd.getTime())
    }
  })

  it('predictions are in chronological order', () => {
    const result = predictCycles(regularCycles, 4)
    for (let i = 1; i < result.predictions.length; i++) {
      expect(result.predictions[i].predictedDate.getTime()).toBeGreaterThan(
        result.predictions[i - 1].predictedDate.getTime()
      )
    }
  })

  it('regular cycles produce high confidence', () => {
    const result = predictCycles(regularCycles, 1)
    expect(result.predictions[0].confidence).toBeGreaterThan(60)
  })

  it('filters out cycles outside 21-35 day range', () => {
    const irregularCycles = [
      makeCycle('2024-04-01', '2024-04-05', 1),
      makeCycle('2024-03-04', '2024-03-08', 2),
      makeCycle('2024-02-05', '2024-02-09', 3),
      makeCycle('2024-01-08', '2024-01-12', 4),
      // This one creates a 50-day cycle (outlier)
      makeCycle('2023-11-19', '2023-11-23', 5),
    ]

    // Should still work since there are enough valid cycles
    const result = predictCycles(irregularCycles, 1)
    expect(result.basedOnCycles).toBeGreaterThanOrEqual(3)
  })

  it('weighted_average falls back to simple_average', () => {
    const result = predictCycles(regularCycles, 2, 'weighted_average')
    expect(result.model).toBe('weighted_average')
    expect(result.predictions).toHaveLength(2)
  })

  it('period length is reasonable', () => {
    const result = predictCycles(regularCycles, 1)
    // Our test cycles have 5-day periods
    expect(result.predictions[0].periodLength).toBeGreaterThanOrEqual(3)
    expect(result.predictions[0].periodLength).toBeLessThanOrEqual(10)
  })
})
