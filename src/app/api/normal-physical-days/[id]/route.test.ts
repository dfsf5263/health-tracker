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
import { DELETE, GET, PUT } from './route'

const mockRequireAuth = vi.mocked(requireAuth)

function makeRequest(method: string, body?: unknown): NextRequest {
  const headers: Record<string, string> = {}
  const init: { method: string; headers?: Record<string, string>; body?: string } = { method }
  if (body) {
    headers['Content-Type'] = 'application/json'
    init.headers = headers
    init.body = JSON.stringify(body)
  }
  return new NextRequest('http://localhost/api/normal-physical-days/d1', init)
}

function makeParams() {
  return { params: Promise.resolve({ id: 'd1' }) }
}

describe('GET /api/normal-physical-days/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the day', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.normalPhysicalDay.findFirst.mockResolvedValue({
      id: 'd1',
      date: new Date('2024-03-15'),
    } as never)

    const res = await GET(makeRequest('GET'), makeParams())
    expect(res.status).toBe(200)
  })

  it('returns 404 when not found', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.normalPhysicalDay.findFirst.mockResolvedValue(null)

    const res = await GET(makeRequest('GET'), makeParams())
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/normal-physical-days/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const validBody = {
    date: '2024-03-20',
    typeId: 'a0a0a0a0-b1b1-4c2c-8d3d-e4e4e4e4e4e4',
  }

  it('updates the day', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.normalPhysicalDay.findFirst.mockResolvedValue({ id: 'd1' } as never)
    db.normalPhysicalType.findFirst.mockResolvedValue({
      id: validBody.typeId,
      userId: 'test-user-id-123',
    } as never)
    db.normalPhysicalDay.update.mockResolvedValue({ id: 'd1' } as never)

    const res = await PUT(makeRequest('PUT', validBody), makeParams())
    expect(res.status).toBe(200)
  })

  it('returns 404 when day not found', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.normalPhysicalDay.findFirst.mockResolvedValue(null)

    const res = await PUT(makeRequest('PUT', validBody), makeParams())
    expect(res.status).toBe(404)
  })

  it('returns 404 when type not owned', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.normalPhysicalDay.findFirst.mockResolvedValue({ id: 'd1' } as never)
    db.normalPhysicalType.findFirst.mockResolvedValue(null)

    const res = await PUT(makeRequest('PUT', validBody), makeParams())
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid body', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    const res = await PUT(makeRequest('PUT', { date: 'nope' }), makeParams())
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/normal-physical-days/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes the day', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.normalPhysicalDay.findFirst.mockResolvedValue({ id: 'd1' } as never)
    db.normalPhysicalDay.delete.mockResolvedValue({ id: 'd1' } as never)

    const res = await DELETE(makeRequest('DELETE'), makeParams())
    expect(res.status).toBe(200)
  })

  it('returns 404 when not found', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.normalPhysicalDay.findFirst.mockResolvedValue(null)

    const res = await DELETE(makeRequest('DELETE'), makeParams())
    expect(res.status).toBe(404)
  })
})
