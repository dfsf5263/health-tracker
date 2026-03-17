import { Cycle } from '@prisma/client'
import { addDays, differenceInDays } from 'date-fns'

export type PredictionModel = 'simple_average' | 'weighted_average'

export interface CyclePrediction {
  cycleNumber: number
  predictedDate: Date
  confidence: number
  rangeStart: Date
  rangeEnd: Date
  periodLength: number
}

export interface PredictionResult {
  predictions: CyclePrediction[]
  model: PredictionModel
  basedOnCycles: number
}

function calculateStandardDeviation(numbers: number[]): number {
  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length
  const squaredDifferences = numbers.map((num) => Math.pow(num - mean, 2))
  const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / numbers.length
  return Math.sqrt(variance)
}

function calculateConfidence(cycles: number[]): number {
  if (cycles.length < 3) return 0

  const standardDeviation = calculateStandardDeviation(cycles)
  const mean = cycles.reduce((sum, num) => sum + num, 0) / cycles.length

  // Calculate confidence as percentage (100 - coefficient of variation)
  const coefficientOfVariation = (standardDeviation / mean) * 100
  const confidence = Math.max(0, Math.min(100, 100 - coefficientOfVariation))

  return Math.round(confidence)
}

function getPredictionRange(confidence: number): number {
  // Higher confidence = smaller range
  if (confidence > 80) return 2
  if (confidence > 60) return 3
  return 5
}

function simpleAveragePrediction(cycles: Cycle[], count: number): CyclePrediction[] {
  if (cycles.length < 3) {
    throw new Error('At least 3 cycles are required for predictions')
  }

  // Sort cycles by start date (newest first)
  const sortedCycles = [...cycles].sort((a, b) => b.startDate.getTime() - a.startDate.getTime())

  // Calculate period lengths from start and end dates
  const periodLengths = sortedCycles.map(
    (cycle) => differenceInDays(new Date(cycle.endDate), new Date(cycle.startDate)) + 1
  )

  // Calculate cycle lengths (days between consecutive period start dates)
  const cycleLengths: number[] = []
  for (let i = 0; i < sortedCycles.length - 1; i++) {
    const currentStart = new Date(sortedCycles[i].startDate)
    const previousStart = new Date(sortedCycles[i + 1].startDate)
    cycleLengths.push(differenceInDays(currentStart, previousStart))
  }

  const avgCycleLength =
    cycleLengths.length > 0
      ? cycleLengths.reduce((sum, len) => sum + len, 0) / cycleLengths.length
      : 28 // Default if only one cycle
  const avgPeriodLength = periodLengths.reduce((sum, len) => sum + len, 0) / periodLengths.length

  const confidence = calculateConfidence(cycleLengths)
  const rangeDays = getPredictionRange(confidence)

  const predictions: CyclePrediction[] = []
  let lastPredictedDate = sortedCycles[0].startDate

  for (let i = 1; i <= count; i++) {
    const predictedDate = addDays(lastPredictedDate, Math.round(avgCycleLength))

    predictions.push({
      cycleNumber: i,
      predictedDate,
      confidence,
      rangeStart: addDays(predictedDate, -rangeDays),
      rangeEnd: addDays(predictedDate, rangeDays),
      periodLength: Math.round(avgPeriodLength),
    })

    lastPredictedDate = predictedDate
  }

  return predictions
}

export function predictCycles(
  cycles: Cycle[],
  count: number = 3,
  model: PredictionModel = 'simple_average'
): PredictionResult {
  // Validate input
  if (count < 1 || count > 12) {
    throw new Error('Prediction count must be between 1 and 12')
  }

  // Filter out outliers (cycles outside normal range)
  // Calculate cycle lengths for filtering
  const cyclesWithLengths = cycles.map((cycle, index) => {
    let cycleLength = 28 // Default
    if (index < cycles.length - 1) {
      const currentStart = new Date(cycle.startDate)
      const nextStart = new Date(cycles[index + 1].startDate)
      cycleLength = differenceInDays(currentStart, nextStart)
    }
    return { ...cycle, calculatedLength: cycleLength }
  })

  const validCycles = cycles.filter((_, index) => {
    const cycleWithLength = cyclesWithLengths[index]
    return cycleWithLength.calculatedLength >= 21 && cycleWithLength.calculatedLength <= 35
  })

  if (validCycles.length < 3) {
    throw new Error(
      'Not enough valid cycles for prediction (need at least 3 cycles between 21-35 days)'
    )
  }

  let predictions: CyclePrediction[]

  switch (model) {
    case 'simple_average':
      predictions = simpleAveragePrediction(validCycles, count)
      break
    case 'weighted_average':
      // Placeholder for future implementation
      // For now, fall back to simple average
      predictions = simpleAveragePrediction(validCycles, count)
      break
    default:
      throw new Error(`Unknown prediction model: ${model}`)
  }

  return {
    predictions,
    model,
    basedOnCycles: validCycles.length,
  }
}
