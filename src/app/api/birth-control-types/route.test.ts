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
  return new NextRequest('http://localhost/api/birth-control-types', init)
}

describe('GET /api/birth-control-types', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns birth control types for authenticated user', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    const fakeTypes = [
      {
        id: 't1',
        name: 'Ring Insertion',
        userId: 'test-user-id-123',
        vaginalRingInsertion: true,
        vaginalRingRemoval: false,
      },
      {
        id: 't2',
        name: 'Ring Removal',
        userId: 'test-user-id-123',
        vaginalRingInsertion: false,
        vaginalRingRemoval: true,
      },
    ]
    db.birthControlType.findMany.mockResolvedValue(fakeTypes as never)

    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(2)
  })

  it('returns 401 when not authenticated', async () => {
    const { NextResponse } = await import('next/server')
    mockRequireAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(401)
  })
})

describe('POST /api/birth-control-types', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a new birth control type', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.birthControlType.create.mockResolvedValue({
      id: 'new-t',
      name: 'Pill',
      userId: 'test-user-id-123',
      vaginalRingInsertion: false,
      vaginalRingRemoval: false,
    } as never)

    const res = await POST(makeRequest('POST', { name: 'Pill' }))
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.name).toBe('Pill')
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
    db.birthControlType.create.mockRejectedValue({ code: 'P2002' })

    const res = await POST(makeRequest('POST', { name: 'Pill' }))
    expect(res.status).toBe(409)
  })

  it('returns 409 when vaginalRingInsertion already set on another type', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.birthControlType.findFirst.mockResolvedValue({
      id: 'existing',
      name: 'Ring In',
      userId: 'test-user-id-123',
      vaginalRingInsertion: true,
    } as never)

    const res = await POST(makeRequest('POST', { name: 'New Ring In', vaginalRingInsertion: true }))
    expect(res.status).toBe(409)
  })

  it('returns 409 when vaginalRingRemoval already set on another type', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.birthControlType.findFirst.mockResolvedValue({
      id: 'existing',
      name: 'Ring Out',
      userId: 'test-user-id-123',
      vaginalRingRemoval: true,
    } as never)

    const res = await POST(makeRequest('POST', { name: 'New Ring Out', vaginalRingRemoval: true }))
    expect(res.status).toBe(409)
  })
})
