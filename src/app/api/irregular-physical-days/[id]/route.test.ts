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
const DAY_ID = 'aaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
const TYPE_ID = 'a0a0a0a0-b1b1-4c2c-8d3d-e4e4e4e4e4e4'

function makeRequest(method: string, body?: unknown): NextRequest {
  const headers: Record<string, string> = {}
  const init: { method: string; headers?: Record<string, string>; body?: string } = { method }
  if (body) {
    headers['Content-Type'] = 'application/json'
    init.headers = headers
    init.body = JSON.stringify(body)
  }
  return new NextRequest(`http://localhost/api/irregular-physical-days/${DAY_ID}`, init)
}

function makeParams() {
  return { params: Promise.resolve({ id: DAY_ID }) }
}

describe('GET /api/irregular-physical-days/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a day by id', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.irregularPhysicalDay.findFirst.mockResolvedValue({
      id: DAY_ID,
      date: new Date('2024-03-15'),
      typeId: TYPE_ID,
      userId: 'test-user-id-123',
    } as never)

    const res = await GET(makeRequest('GET'), makeParams())
    expect(res.status).toBe(200)
  })

  it('returns 404 when not found', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.irregularPhysicalDay.findFirst.mockResolvedValue(null)

    const res = await GET(makeRequest('GET'), makeParams())
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/irregular-physical-days/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates a day', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.irregularPhysicalDay.findFirst.mockResolvedValue({
      id: DAY_ID,
      date: new Date('2024-03-15'),
      typeId: TYPE_ID,
      userId: 'test-user-id-123',
    } as never)
    db.irregularPhysicalDay.update.mockResolvedValue({
      id: DAY_ID,
      date: new Date('2024-03-16'),
    } as never)

    const res = await PUT(makeRequest('PUT', { date: '2024-03-16' }), makeParams())
    expect(res.status).toBe(200)
  })

  it('returns 404 when not found', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.irregularPhysicalDay.findFirst.mockResolvedValue(null)

    const res = await PUT(makeRequest('PUT', { date: '2024-03-16' }), makeParams())
    expect(res.status).toBe(404)
  })

  it('returns 409 for duplicate', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.irregularPhysicalDay.findFirst.mockResolvedValue({
      id: DAY_ID,
      date: new Date('2024-03-15'),
      typeId: TYPE_ID,
      userId: 'test-user-id-123',
    } as never)
    db.irregularPhysicalDay.update.mockRejectedValue({ code: 'P2002' })

    const res = await PUT(makeRequest('PUT', { date: '2024-03-16' }), makeParams())
    expect(res.status).toBe(409)
  })
})

describe('DELETE /api/irregular-physical-days/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes a day', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.irregularPhysicalDay.findFirst.mockResolvedValue({
      id: DAY_ID,
      userId: 'test-user-id-123',
    } as never)
    db.irregularPhysicalDay.delete.mockResolvedValue({} as never)

    const res = await DELETE(makeRequest('DELETE'), makeParams())
    expect(res.status).toBe(200)
  })

  it('returns 404 when not found', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.irregularPhysicalDay.findFirst.mockResolvedValue(null)

    const res = await DELETE(makeRequest('DELETE'), makeParams())
    expect(res.status).toBe(404)
  })
})
