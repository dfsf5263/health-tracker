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
import { DELETE, PUT } from './route'

const mockRequireAuth = vi.mocked(requireAuth)

const TYPE_ID = 'aaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

function makeRequest(method: string, body?: unknown): NextRequest {
  const headers: Record<string, string> = {}
  const init: { method: string; headers?: Record<string, string>; body?: string } = { method }
  if (body) {
    headers['Content-Type'] = 'application/json'
    init.headers = headers
    init.body = JSON.stringify(body)
  }
  return new NextRequest(`http://localhost/api/migraine-trigger-types/${TYPE_ID}`, init)
}

function makeParams() {
  return { params: Promise.resolve({ id: TYPE_ID }) }
}

describe('PUT /api/migraine-trigger-types/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates trigger type name', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraineTriggerType.findFirst.mockResolvedValue({
      id: TYPE_ID,
      name: 'Old',
      userId: 'test-user-id-123',
    } as never)
    db.migraineTriggerType.update.mockResolvedValue({
      id: TYPE_ID,
      name: 'Updated',
      userId: 'test-user-id-123',
    } as never)

    const res = await PUT(makeRequest('PUT', { name: 'Updated' }), makeParams())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.name).toBe('Updated')
  })

  it('returns 404 when type not found or not owned', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraineTriggerType.findFirst.mockResolvedValue(null)

    const res = await PUT(makeRequest('PUT', { name: 'New' }), makeParams())
    expect(res.status).toBe(404)
  })

  it('returns 400 for empty name', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())

    const res = await PUT(makeRequest('PUT', { name: '' }), makeParams())
    expect(res.status).toBe(400)
  })

  it('returns 409 for duplicate name', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraineTriggerType.findFirst.mockResolvedValue({
      id: TYPE_ID,
      name: 'Old',
      userId: 'test-user-id-123',
    } as never)
    db.migraineTriggerType.update.mockRejectedValue({ code: 'P2002' })

    const res = await PUT(makeRequest('PUT', { name: 'Duplicate' }), makeParams())
    expect(res.status).toBe(409)
  })
})

describe('DELETE /api/migraine-trigger-types/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes trigger type owned by user', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraineTriggerType.findFirst.mockResolvedValue({
      id: TYPE_ID,
      userId: 'test-user-id-123',
    } as never)
    db.migraineTriggerType.delete.mockResolvedValue({} as never)

    const res = await DELETE(makeRequest('DELETE'), makeParams())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.message).toContain('deleted successfully')
  })

  it('returns 404 when type not found', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.migraineTriggerType.findFirst.mockResolvedValue(null)

    const res = await DELETE(makeRequest('DELETE'), makeParams())
    expect(res.status).toBe(404)
  })
})
