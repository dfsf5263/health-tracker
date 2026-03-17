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
  return new NextRequest('http://localhost/api/cycles')
}

describe('GET /api/cycles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns cycles for authenticated user', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.cycle.findMany.mockResolvedValue([
      { id: 'c1', startDate: new Date('2024-03-01'), endDate: new Date('2024-03-28') },
    ] as never)

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
  })

  it('returns 500 on database error', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.cycle.findMany.mockRejectedValue(new Error('db error'))

    const res = await GET(makeRequest())
    expect(res.status).toBe(500)
  })
})
