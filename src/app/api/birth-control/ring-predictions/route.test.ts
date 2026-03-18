import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockAuthContext } from '@/test/mocks/auth'
import { db } from '@/test/mocks/db'

vi.mock('@/lib/auth-middleware', () => ({
  requireAuth: vi.fn(),
}))
vi.mock('@/lib/error-logger', () => ({
  logApiError: vi.fn(),
}))
vi.mock('@/lib/middleware/with-api-logging', () => ({
  withApiLogging: (handler: Function) => handler,
}))
vi.mock('@/lib/ring-prediction', () => ({
  predictNextRingEvent: vi.fn(),
}))

import { requireAuth } from '@/lib/auth-middleware'
import { predictNextRingEvent } from '@/lib/ring-prediction'
import { GET } from './route'

const mockRequireAuth = vi.mocked(requireAuth)
const mockPredictNextRingEvent = vi.mocked(predictNextRingEvent)

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/birth-control/ring-predictions')
}

describe('GET /api/birth-control/ring-predictions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns ring predictions', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.findUnique.mockResolvedValue({
      sex: 'Female',
      daysWithBirthControlRing: 21,
      daysWithoutBirthControlRing: 7,
    } as never)
    db.birthControlDay.findMany.mockResolvedValue([
      { id: 'e1', date: new Date('2024-03-01'), type: { vaginalRingInsertion: true } },
    ] as never)
    mockPredictNextRingEvent.mockReturnValue({
      prediction: {
        predictedDate: new Date('2024-03-22'),
        eventType: 'removal',
        confidence: 0.85,
      },
      basedOnEvents: 1,
      userSettings: {
        daysWithRing: 21,
        daysWithoutRing: 7,
      },
    } as never)

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    expect(mockPredictNextRingEvent).toHaveBeenCalled()
  })

  it('returns 404 when user not found', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.findUnique.mockResolvedValue(null)

    const res = await GET(makeRequest())
    expect(res.status).toBe(404)
  })

  it('returns empty prediction for Male user', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.findUnique.mockResolvedValue({
      sex: 'Male',
      daysWithBirthControlRing: null,
      daysWithoutBirthControlRing: null,
    } as never)

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ prediction: null, basedOnEvents: 0, userSettings: {} })
    expect(mockPredictNextRingEvent).not.toHaveBeenCalled()
    expect(db.birthControlDay.findMany).not.toHaveBeenCalled()
  })
})
