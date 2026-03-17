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

import { requireAuth } from '@/lib/auth-middleware'
import { GET } from './route'

const mockRequireAuth = vi.mocked(requireAuth)

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/analytics')
}

describe('GET /api/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns analytics data', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.findUnique.mockResolvedValue({
      id: 'test-user-id-123',
      averageCycleLength: 28,
      averagePeriodLength: 5,
    } as never)

    const fakeCycles = [
      {
        id: 'c1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-28'),
      },
    ]
    db.cycle.findMany.mockResolvedValue(fakeCycles as never)
    db.periodDay.findMany.mockResolvedValue([])
    db.cycle.count.mockResolvedValue(3)

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.averages.cycleLength).toBe(28)
    expect(data.averages.periodLength).toBe(5)
    expect(data.totalCycles).toBe(3)
    expect(data.lastSixCycles).toHaveLength(1)
  })

  it('returns 404 when user not found', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.findUnique.mockResolvedValue(null)

    const res = await GET(makeRequest())
    expect(res.status).toBe(404)
  })

  it('returns 401 when not authenticated', async () => {
    const { NextResponse } = await import('next/server')
    mockRequireAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })
})
