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
  return new NextRequest('http://localhost/api/migraines', init)
}

describe('GET /api/migraines', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns migraines for authenticated user', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraine.findMany.mockResolvedValue([
      { id: 'm1', startDateTime: new Date(), painLevel: 5 },
    ] as never)

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

describe('POST /api/migraines', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const validBody = {
    startDateTime: '2024-03-15T10:00:00.000Z',
    painLevel: 7,
  }

  it('creates a migraine with minimal fields', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    const created = { id: 'new-m', ...validBody }
    db.migraine.create.mockResolvedValue(created as never)

    const res = await POST(makeRequest('POST', validBody))
    expect(res.status).toBe(201)
  })

  it('creates a migraine with relation arrays', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    const body = {
      ...validBody,
      attackTypeIds: ['a0a0a0a0-b1b1-4c2c-8d3d-e4e4e4e4e4e4'],
      triggerTypeIds: ['a0a0a0a0-b1b1-4c2c-8d3d-f5f5f5f5f5f5'],
      medicationData: [{ typeId: 'a0a0a0a0-b1b1-4c2c-8d3d-111111111111', dosageModifier: 1.5 }],
    }
    db.migraine.create.mockResolvedValue({ id: 'new-m' } as never)
    db.migraineMigraineAttackType.createMany.mockResolvedValue({ count: 1 } as never)
    db.migraineMigraineTriggerType.createMany.mockResolvedValue({ count: 1 } as never)
    db.migraineMigraineMedicationType.createMany.mockResolvedValue({ count: 1 } as never)

    const res = await POST(makeRequest('POST', body))
    expect(res.status).toBe(201)
    expect(db.migraineMigraineAttackType.createMany).toHaveBeenCalledOnce()
    expect(db.migraineMigraineTriggerType.createMany).toHaveBeenCalledOnce()
    expect(db.migraineMigraineMedicationType.createMany).toHaveBeenCalledOnce()
  })

  it('returns 400 when endDateTime is before startDateTime', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())

    const res = await POST(
      makeRequest('POST', {
        ...validBody,
        endDateTime: '2024-03-15T09:00:00.000Z', // before start
      })
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 for painLevel out of range', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())

    const res = await POST(
      makeRequest('POST', { startDateTime: '2024-03-15T10:00:00.000Z', painLevel: 11 })
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing required fields', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())

    const res = await POST(makeRequest('POST', { painLevel: 5 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid uuid in relation array', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())

    const res = await POST(
      makeRequest('POST', {
        ...validBody,
        attackTypeIds: ['not-a-uuid'],
      })
    )
    expect(res.status).toBe(400)
  })
})
