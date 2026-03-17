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
import { DELETE, PUT } from './route'

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
  return new NextRequest('http://localhost/api/period-days/pd1', init)
}

function makeParams() {
  return { params: Promise.resolve({ id: 'pd1' }) }
}

describe('PUT /api/period-days/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const validBody = {
    date: '2024-03-15',
    flow: 'Medium',
    color: 'Red',
    notes: 'Updated note',
  }

  it('updates a period day and syncs cycles', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.periodDay.findFirst.mockResolvedValue({
      id: 'pd1',
      date: new Date('2024-03-10'),
      flow: 'Light',
      color: 'Red',
    } as never)
    db.periodDay.update.mockResolvedValue({
      id: 'pd1',
      date: new Date('2024-03-15'),
      flow: 'Medium',
    } as never)
    mockSyncCycles.mockResolvedValue(undefined)

    const res = await PUT(makeRequest('PUT', validBody), makeParams())
    expect(res.status).toBe(200)
    expect(mockSyncCycles).toHaveBeenCalledWith('test-user-id-123')
  })

  it('returns 404 when period day not found', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.periodDay.findFirst.mockResolvedValue(null)

    const res = await PUT(makeRequest('PUT', validBody), makeParams())
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid body', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    const res = await PUT(makeRequest('PUT', { flow: 'INVALID' }), makeParams())
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/period-days/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes a period day and syncs cycles', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.periodDay.findFirst.mockResolvedValue({
      id: 'pd1',
      date: new Date('2024-03-15'),
      flow: 'Medium',
      color: 'Red',
    } as never)
    db.periodDay.delete.mockResolvedValue({ id: 'pd1' } as never)
    mockSyncCycles.mockResolvedValue(undefined)

    const res = await DELETE(makeRequest('DELETE'), makeParams())
    expect(res.status).toBe(200)
    expect(mockSyncCycles).toHaveBeenCalledWith('test-user-id-123')
  })

  it('returns 404 when not found', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.periodDay.findFirst.mockResolvedValue(null)

    const res = await DELETE(makeRequest('DELETE'), makeParams())
    expect(res.status).toBe(404)
  })
})
