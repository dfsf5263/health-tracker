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
vi.mock('@/lib/cycle-prediction', () => ({
  predictCycles: vi.fn(),
}))

import { requireAuth } from '@/lib/auth-middleware'
import { predictCycles } from '@/lib/cycle-prediction'
import { GET } from './route'

const mockRequireAuth = vi.mocked(requireAuth)
const mockPredictCycles = vi.mocked(predictCycles)

function makeRequest(params?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/cycles/predictions')
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v)
    }
  }
  return new NextRequest(url)
}

describe('GET /api/cycles/predictions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns predictions with default params', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.findUnique.mockResolvedValue({ sex: 'Female' } as never)
    const fakeCycles = [{ id: 'c1', startDate: new Date('2024-01-01'), userId: 'test-user-id-123' }]
    db.cycle.findMany.mockResolvedValue(fakeCycles as never)
    mockPredictCycles.mockReturnValue({
      predictions: [],
      model: 'simple_average',
      confidence: 0.5,
    } as never)

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    expect(mockPredictCycles).toHaveBeenCalledWith(fakeCycles, 3, 'simple_average')
  })

  it('passes custom count and model', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.findUnique.mockResolvedValue({ sex: 'Female' } as never)
    db.cycle.findMany.mockResolvedValue([{ id: 'c1' }] as never)
    mockPredictCycles.mockReturnValue({ predictions: [] } as never)

    const res = await GET(makeRequest({ count: '6', model: 'weighted_average' }))
    expect(res.status).toBe(200)
    expect(mockPredictCycles).toHaveBeenCalledWith(expect.anything(), 6, 'weighted_average')
  })

  it('returns 400 for count out of range', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())

    const res = await GET(makeRequest({ count: '15' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid model', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())

    const res = await GET(makeRequest({ model: 'invalid_model' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when no cycles exist', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.findUnique.mockResolvedValue({ sex: 'Female' } as never)
    db.cycle.findMany.mockResolvedValue([])

    const res = await GET(makeRequest())
    expect(res.status).toBe(404)
  })

  it('returns 400 when prediction throws', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.findUnique.mockResolvedValue({ sex: 'Female' } as never)
    db.cycle.findMany.mockResolvedValue([{ id: 'c1' }] as never)
    mockPredictCycles.mockImplementation(() => {
      throw new Error('Not enough data')
    })

    const res = await GET(makeRequest())
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.details[0].message).toBe('Not enough data')
  })

  it('returns empty predictions for Male user', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.findUnique.mockResolvedValue({ sex: 'Male' } as never)

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ predictions: [], model: 'simple_average', basedOnCycles: 0 })
    expect(mockPredictCycles).not.toHaveBeenCalled()
    expect(db.cycle.findMany).not.toHaveBeenCalled()
  })

  it('returns 404 when user not found', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.findUnique.mockResolvedValue(null)

    const res = await GET(makeRequest())
    expect(res.status).toBe(404)
  })
})
