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
import { GET, PUT } from './route'

const mockRequireAuth = vi.mocked(requireAuth)

function makeRequest(method: string, body?: unknown): NextRequest {
  const headers: Record<string, string> = {}
  const init: { method: string; headers?: Record<string, string>; body?: string } = { method }
  if (body) {
    headers['Content-Type'] = 'application/json'
    init.headers = headers
    init.body = JSON.stringify(body)
  }
  return new NextRequest('http://localhost/api/user/settings', init)
}

describe('GET /api/user/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns user settings', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.findUnique.mockResolvedValue({
      birthControlEmailNotifications: true,
      ringInsertionReminderTime: new Date('1970-01-01T09:00:00'),
      ringRemovalReminderTime: new Date('1970-01-01T09:00:00'),
    } as never)

    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.birthControlEmailNotifications).toBe(true)
  })

  it('returns 404 when user not found', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.findUnique.mockResolvedValue(null)

    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/user/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates settings', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.update.mockResolvedValue({
      birthControlEmailNotifications: false,
      ringInsertionReminderTime: null,
      ringRemovalReminderTime: null,
    } as never)

    const res = await PUT(makeRequest('PUT', { birthControlEmailNotifications: false }))
    expect(res.status).toBe(200)
  })

  it('updates ring reminder times', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.update.mockResolvedValue({
      birthControlEmailNotifications: true,
      ringInsertionReminderTime: new Date('1970-01-01T08:30:00'),
      ringRemovalReminderTime: new Date('1970-01-01T20:00:00'),
    } as never)

    const res = await PUT(
      makeRequest('PUT', {
        ringInsertionReminderTime: '08:30',
        ringRemovalReminderTime: '20:00',
      })
    )
    expect(res.status).toBe(200)
  })

  it('returns message when no updates provided', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())

    const res = await PUT(makeRequest('PUT', {}))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.message).toBe('No updates provided')
  })

  it('returns 400 for invalid time format', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())

    const res = await PUT(makeRequest('PUT', { ringInsertionReminderTime: 'bad' }))
    expect(res.status).toBe(400)
  })
})
