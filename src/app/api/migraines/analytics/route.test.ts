import { NextRequest, NextResponse } from 'next/server'
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

import { requireAuth } from '@/lib/auth-middleware'
import { logApiError } from '@/lib/error-logger'
import { GET } from './route'

const mockRequireAuth = vi.mocked(requireAuth)

function makeRequest(range?: string): NextRequest {
  const url = range
    ? `http://localhost/api/migraines/analytics?range=${range}`
    : 'http://localhost/api/migraines/analytics'
  return new NextRequest(url)
}

function makeMigraine(overrides: Record<string, unknown> = {}) {
  return {
    id: 'm1',
    userId: 'test-user-id-123',
    startDateTime: new Date('2026-03-10T14:00:00Z'),
    endDateTime: new Date('2026-03-10T18:00:00Z'),
    painLevel: 7,
    periodStatus: null,
    geographicLocation: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    migraineMigraineAttackTypes: [],
    migraineMigraineSymptomTypes: [],
    migraineMigraineTriggerTypes: [],
    migraineMigraineMedicationTypes: [],
    migraineMigraineReliefTypes: [],
    migraineMigraineActivityTypes: [],
    migraineMigraineLocationTypes: [],
    ...overrides,
  }
}

describe('GET /api/migraines/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns correct shape with empty data', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraine.findMany.mockResolvedValue([])

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.summary).toEqual({
      total: 0,
      avgPainLevel: 0,
      avgDurationHours: 0,
    })
    expect(data.topTriggers).toEqual([])
    expect(data.attackTypes).toEqual([])
    expect(data.symptoms).toEqual([])
    expect(data.medications).toEqual([])
    expect(data.reliefMethods).toEqual([])
    expect(data.painLevelOverTime).toEqual([])
    expect(data.dayOfWeekDistribution).toHaveLength(7)
    expect(data.dayOfWeekDistribution.every((d: { count: number }) => d.count === 0)).toBe(true)
    expect(data.timeOfDayDistribution).toHaveLength(6)
    expect(data.periodStatusDistribution).toEqual([])
    expect(data.symptomCoOccurrence).toEqual([])
  })

  it('computes summary correctly from migraine data', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraine.findMany.mockResolvedValue([
      makeMigraine({
        id: 'm1',
        painLevel: 6,
        startDateTime: new Date('2026-03-10T10:00:00Z'),
        endDateTime: new Date('2026-03-10T14:00:00Z'), // 4 hours
      }),
      makeMigraine({
        id: 'm2',
        painLevel: 8,
        startDateTime: new Date('2026-03-12T08:00:00Z'),
        endDateTime: new Date('2026-03-12T14:00:00Z'), // 6 hours
      }),
    ] as never)

    const res = await GET(makeRequest())
    const data = await res.json()

    expect(data.summary.total).toBe(2)
    expect(data.summary.avgPainLevel).toBe(7)
    expect(data.summary.avgDurationHours).toBe(5)
  })

  it('computes avgDurationHours as 0 when no endDateTime', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraine.findMany.mockResolvedValue([
      makeMigraine({ endDateTime: null, painLevel: 5 }),
    ] as never)

    const res = await GET(makeRequest())
    const data = await res.json()

    expect(data.summary.avgDurationHours).toBe(0)
  })

  it('counts triggers sorted by frequency', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraine.findMany.mockResolvedValue([
      makeMigraine({
        id: 'm1',
        migraineMigraineTriggerTypes: [
          { migraineTriggerType: { name: 'Stress' } },
          { migraineTriggerType: { name: 'Lack of Sleep' } },
        ],
      }),
      makeMigraine({
        id: 'm2',
        migraineMigraineTriggerTypes: [{ migraineTriggerType: { name: 'Stress' } }],
      }),
    ] as never)

    const res = await GET(makeRequest())
    const data = await res.json()

    expect(data.topTriggers).toEqual([
      { name: 'Stress', count: 2 },
      { name: 'Lack of Sleep', count: 1 },
    ])
  })

  it('computes day of week distribution', async () => {
    // 2026-03-10 is a Tuesday
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraine.findMany.mockResolvedValue([
      makeMigraine({
        id: 'm1',
        startDateTime: new Date('2026-03-10T10:00:00Z'),
      }),
      makeMigraine({
        id: 'm2',
        startDateTime: new Date('2026-03-10T15:00:00Z'),
      }),
    ] as never)

    const res = await GET(makeRequest())
    const data = await res.json()

    const tuesday = data.dayOfWeekDistribution.find((d: { day: string }) => d.day === 'Tuesday')
    expect(tuesday.count).toBe(2)

    const monday = data.dayOfWeekDistribution.find((d: { day: string }) => d.day === 'Monday')
    expect(monday.count).toBe(0)
  })

  it('computes time of day distribution in 4-hour blocks', async () => {
    // Use a date whose local hour falls in a known block
    const date = new Date('2026-03-10T14:00:00Z')
    const localHour = date.getHours()
    const expectedBlockIndex = Math.floor(localHour / 4)

    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraine.findMany.mockResolvedValue([makeMigraine({ startDateTime: date })] as never)

    const res = await GET(makeRequest())
    const data = await res.json()

    const matchedBlock = data.timeOfDayDistribution[expectedBlockIndex]
    expect(matchedBlock.count).toBe(1)

    const totalCount = data.timeOfDayDistribution.reduce(
      (sum: number, b: { count: number }) => sum + b.count,
      0
    )
    expect(totalCount).toBe(1)
  })

  it('computes period status distribution', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraine.findMany.mockResolvedValue([
      makeMigraine({ id: 'm1', periodStatus: 'Yes' }),
      makeMigraine({ id: 'm2', periodStatus: 'Yes' }),
      makeMigraine({ id: 'm3', periodStatus: 'No' }),
    ] as never)

    const res = await GET(makeRequest())
    const data = await res.json()

    expect(data.periodStatusDistribution).toEqual([
      { status: 'Yes', count: 2 },
      { status: 'No', count: 1 },
    ])
  })

  it('computes symptom co-occurrence pairs', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraine.findMany.mockResolvedValue([
      makeMigraine({
        id: 'm1',
        migraineMigraineSymptomTypes: [
          { migraineSymptomType: { name: 'Nausea' } },
          { migraineSymptomType: { name: 'Sensitivity to Light' } },
        ],
      }),
      makeMigraine({
        id: 'm2',
        migraineMigraineSymptomTypes: [
          { migraineSymptomType: { name: 'Nausea' } },
          { migraineSymptomType: { name: 'Sensitivity to Light' } },
        ],
      }),
    ] as never)

    const res = await GET(makeRequest())
    const data = await res.json()

    expect(data.symptomCoOccurrence).toEqual([{ pair: 'Nausea + Sensitivity to Light', count: 2 }])
  })

  it('accepts range query parameter', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraine.findMany.mockResolvedValue([])

    const res = await GET(makeRequest('30d'))
    expect(res.status).toBe(200)

    const call = db.migraine.findMany.mock.calls[0][0]
    expect(call?.where).toHaveProperty('startDateTime')
  })

  it('uses default 90d range when no param provided', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraine.findMany.mockResolvedValue([])

    await GET(makeRequest())

    const call = db.migraine.findMany.mock.calls[0][0]
    expect(call?.where).toHaveProperty('startDateTime')
  })

  it('uses no date filter for unknown range', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraine.findMany.mockResolvedValue([])

    await GET(makeRequest('invalid'))

    const call = db.migraine.findMany.mock.calls[0][0]
    expect(call?.where).not.toHaveProperty('startDateTime')
  })

  it('returns 500 and logs error on db failure', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraine.findMany.mockRejectedValue(new Error('DB error'))

    const res = await GET(makeRequest())
    expect(res.status).toBe(500)
    expect(logApiError).toHaveBeenCalled()
  })
})
