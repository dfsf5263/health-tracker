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
  return new NextRequest('http://localhost/api/cycles/c1')
}

function makeParams() {
  return { params: Promise.resolve({ id: 'c1' }) }
}

describe('GET /api/cycles/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the cycle', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.cycle.findFirst.mockResolvedValue({
      id: 'c1',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-03-28'),
    } as never)

    const res = await GET(makeRequest(), makeParams())
    expect(res.status).toBe(200)
  })

  it('returns 404 when not found', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.cycle.findFirst.mockResolvedValue(null)

    const res = await GET(makeRequest(), makeParams())
    expect(res.status).toBe(404)
  })
})
