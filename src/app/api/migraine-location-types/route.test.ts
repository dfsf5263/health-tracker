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
  return new NextRequest('http://localhost/api/migraine-location-types')
}

describe('GET /api/migraine-location-types', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all location types', async () => {
    db.migraineLocationType.findMany.mockResolvedValue([
      { id: 'lt1', name: 'Left Temple' },
      { id: 'lt2', name: 'Right Temple' },
    ] as never)

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(2)
  })

  it('returns 500 on database error', async () => {
    db.migraineLocationType.findMany.mockRejectedValue(new Error('db error'))

    const res = await GET(makeRequest())
    expect(res.status).toBe(500)
  })
})
