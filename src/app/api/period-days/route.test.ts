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
vi.mock('@/lib/sync-cycles', () => ({
  syncCycles: vi.fn(),
}))

import { requireAuth } from '@/lib/auth-middleware'
import { syncCycles } from '@/lib/sync-cycles'
import { GET, POST } from './route'

const mockRequireAuth = vi.mocked(requireAuth)
const mockSyncCycles = vi.mocked(syncCycles)

function makeRequest(method: string, body?: unknown): NextRequest {
  const headers: Record<string, string> = {}
  const init: { method: string; headers?: Record<string, string>; body?: string } = { method }
  if (body) {
    headers['Content-Type'] = 'application/json'
    init.headers = headers
    init.body = JSON.stringify(body)
  }
  return new NextRequest('http://localhost/api/period-days', init)
}

describe('GET /api/period-days', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns period days for authenticated user', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    const fakeDays = [{ id: '1', date: new Date('2024-01-15'), flow: 'MEDIUM', color: 'RED' }]
    db.periodDay.findMany.mockResolvedValue(fakeDays as never)

    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
  })

  it('returns 401 when not authenticated', async () => {
    const { NextResponse } = await import('next/server')
    mockRequireAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(401)
  })
})

describe('POST /api/period-days', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a period day and syncs cycles', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    const createdDay = {
      id: 'new-id',
      date: new Date('2024-03-15'),
      flow: 'Heavy',
      color: 'Red',
    }
    db.periodDay.create.mockResolvedValue(createdDay as never)
    mockSyncCycles.mockResolvedValue(undefined)

    const res = await POST(makeRequest('POST', { date: '2024-03-15', flow: 'Heavy', color: 'Red' }))
    expect(res.status).toBe(200)
    expect(db.periodDay.create).toHaveBeenCalledOnce()
    expect(mockSyncCycles).toHaveBeenCalledWith('test-user-id-123')
  })

  it('returns 400 for invalid date format', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())

    const res = await POST(makeRequest('POST', { date: 'March 15', flow: 'Heavy', color: 'Red' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing fields', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())

    const res = await POST(makeRequest('POST', { date: '2024-03-15' }))
    expect(res.status).toBe(400)
  })

  it('returns 409 for duplicate period day', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.periodDay.create.mockRejectedValue({ code: 'P2002' })

    const res = await POST(makeRequest('POST', { date: '2024-03-15', flow: 'Heavy', color: 'Red' }))
    expect(res.status).toBe(409)
  })
})
