import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { db } from '@/test/mocks/db'
import { mockAuthContext } from '@/test/mocks/auth'

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
import { GET, POST } from './route'

const mockRequireAuth = vi.mocked(requireAuth)

function makeRequest(method: string, body?: unknown): NextRequest {
  const headers: Record<string, string> = {}
  const init: { method: string; headers?: Record<string, string>; body?: string } = { method }
  if (body) {
    headers['Content-Type'] = 'application/json'
    init.headers = headers
    init.body = JSON.stringify(body)
  }
  return new NextRequest('http://localhost/api/migraine-trigger-types', init)
}

describe('GET /api/migraine-trigger-types', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns trigger types for authenticated user', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    const fakeTypes = [
      { id: 't1', name: 'Stress', userId: 'test-user-id-123' },
      { id: 't2', name: 'Weather', userId: 'test-user-id-123' },
    ]
    db.migraineTriggerType.findMany.mockResolvedValue(fakeTypes as never)

    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(2)
  })
})

describe('POST /api/migraine-trigger-types', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a new trigger type', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraineTriggerType.create.mockResolvedValue({
      id: 'new-t',
      name: 'Dehydration',
      userId: 'test-user-id-123',
    } as never)

    const res = await POST(makeRequest('POST', { name: 'Dehydration' }))
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.name).toBe('Dehydration')
  })

  it('returns 400 for empty name', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())

    const res = await POST(makeRequest('POST', { name: '' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for name exceeding 100 chars', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())

    const res = await POST(makeRequest('POST', { name: 'x'.repeat(101) }))
    expect(res.status).toBe(400)
  })

  it('returns 409 for duplicate name', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraineTriggerType.create.mockRejectedValue({ code: 'P2002' })

    const res = await POST(makeRequest('POST', { name: 'Stress' }))
    expect(res.status).toBe(409)
  })
})
