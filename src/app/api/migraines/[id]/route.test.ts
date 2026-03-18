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
  return new NextRequest('http://localhost/api/migraines/m1', init)
}

function makeParams() {
  return { params: Promise.resolve({ id: 'm1' }) }
}

describe('GET /api/migraines/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a migraine with relations', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraine.findFirst.mockResolvedValue({
      id: 'm1',
      painLevel: 7,
      migraineMigraineAttackTypes: [],
      migraineMigraineSymptomTypes: [],
    } as never)

    const res = await GET(makeRequest('GET'), makeParams())
    expect(res.status).toBe(200)
  })

  it('returns 404 when not found', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraine.findFirst.mockResolvedValue(null)

    const res = await GET(makeRequest('GET'), makeParams())
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/migraines/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const validBody = {
    painLevel: 8,
    notes: 'Updated',
  }

  it('updates a migraine', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraine.findFirst.mockResolvedValue({ id: 'm1', userId: 'test-user-id-123' } as never)
    db.$transaction.mockImplementation(async (fn: Function) => fn(db))
    db.migraine.update.mockResolvedValue({ id: 'm1' } as never)
    db.migraine.findUnique.mockResolvedValue({
      id: 'm1',
      painLevel: 8,
      migraineMigraineAttackTypes: [],
    } as never)

    const res = await PUT(makeRequest('PUT', validBody), makeParams())
    expect(res.status).toBe(200)
  })

  it('updates migraine with relation type IDs', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraine.findFirst.mockResolvedValue({ id: 'm1', userId: 'test-user-id-123' } as never)
    db.$transaction.mockImplementation(async (fn: Function) => fn(db))
    db.migraine.update.mockResolvedValue({ id: 'm1' } as never)
    db.migraineMigraineAttackType.deleteMany.mockResolvedValue({ count: 0 } as never)
    db.migraineMigraineAttackType.createMany.mockResolvedValue({ count: 1 } as never)
    db.migraine.findUnique.mockResolvedValue({ id: 'm1' } as never)

    const bodyWithRelations = {
      painLevel: 5,
      attackTypeIds: ['a0a0a0a0-b1b1-4c2c-8d3d-e4e4e4e4e4e4'],
    }

    const res = await PUT(makeRequest('PUT', bodyWithRelations), makeParams())
    expect(res.status).toBe(200)
  })

  it('returns 404 when migraine not found', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraine.findFirst.mockResolvedValue(null)

    const res = await PUT(makeRequest('PUT', validBody), makeParams())
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid body', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraine.findFirst.mockResolvedValue({ id: 'm1', userId: 'test-user-id-123' } as never)
    const res = await PUT(makeRequest('PUT', { painLevel: 99 }), makeParams())
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/migraines/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes a migraine', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraine.findFirst.mockResolvedValue({ id: 'm1' } as never)
    db.migraine.delete.mockResolvedValue({ id: 'm1' } as never)

    const res = await DELETE(makeRequest('DELETE'), makeParams())
    expect(res.status).toBe(200)
  })

  it('returns 404 when not found', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraine.findFirst.mockResolvedValue(null)

    const res = await DELETE(makeRequest('DELETE'), makeParams())
    expect(res.status).toBe(404)
  })
})
