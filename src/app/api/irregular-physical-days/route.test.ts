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
  return new NextRequest('http://localhost/api/irregular-physical-days', init)
}

describe('GET /api/irregular-physical-days', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns days for authenticated user', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.irregularPhysicalDay.findMany.mockResolvedValue([
      { id: 'd1', date: new Date('2024-03-15'), typeId: 't1' },
    ] as never)

    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
  })
})

describe('POST /api/irregular-physical-days', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const validBody = {
    date: '2024-03-15',
    typeId: 'a0a0a0a0-b1b1-4c2c-8d3d-e4e4e4e4e4e4',
  }

  it('creates a day', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.irregularPhysicalType.findFirst.mockResolvedValue({
      id: validBody.typeId,
      userId: 'test-user-id-123',
    } as never)
    db.irregularPhysicalDay.create.mockResolvedValue({
      id: 'new-id',
      date: new Date('2024-03-15'),
      typeId: validBody.typeId,
    } as never)

    const res = await POST(makeRequest('POST', validBody))
    expect(res.status).toBe(201)
  })

  it('returns 400 for invalid date', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    const res = await POST(makeRequest('POST', { ...validBody, date: 'bad' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when type not owned by user', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.irregularPhysicalType.findFirst.mockResolvedValue(null)

    const res = await POST(makeRequest('POST', validBody))
    expect(res.status).toBe(404)
  })

  it('returns 409 for duplicate', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.irregularPhysicalType.findFirst.mockResolvedValue({
      id: validBody.typeId,
      userId: 'test-user-id-123',
    } as never)
    db.irregularPhysicalDay.create.mockRejectedValue({ code: 'P2002' })

    const res = await POST(makeRequest('POST', validBody))
    expect(res.status).toBe(409)
  })
})
