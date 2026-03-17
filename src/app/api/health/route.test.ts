import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/test/mocks/db'

vi.mock('@/lib/error-logger', () => ({
  logApiError: vi.fn(),
}))
vi.mock('@/lib/middleware/with-api-logging', () => ({
  withApiLogging: (handler: Function) => handler,
}))

import { GET } from './route'

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/health')
}

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns healthy when database is connected', async () => {
    db.$queryRaw.mockResolvedValue([{ '?column?': 1 }] as never)

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('healthy')
    expect(data.database).toBe('connected')
  })

  it('returns 503 when database is disconnected', async () => {
    db.$queryRaw.mockRejectedValue(new Error('Connection refused'))

    const res = await GET(makeRequest())
    expect(res.status).toBe(503)
    const data = await res.json()
    expect(data.error).toBe('Health check failed')
    expect(data.details.status).toBe('unhealthy')
    expect(data.details.database).toBe('disconnected')
  })
})
