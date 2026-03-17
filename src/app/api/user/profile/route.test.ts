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
  return new NextRequest('http://localhost/api/user/profile', init)
}

describe('GET /api/user/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    const { NextResponse } = await import('next/server')
    mockRequireAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(401)
  })

  it('returns user profile', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.findUnique.mockResolvedValue({
      firstName: 'Test',
      lastName: 'User',
      name: 'Test User',
      email: 'test@example.com',
      daysWithoutBirthControlRing: 7,
      daysWithBirthControlRing: 21,
    } as never)

    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.firstName).toBe('Test')
    expect(data.email).toBe('test@example.com')
    expect(data.daysWithBirthControlRing).toBe(21)
  })

  it('returns 404 when user not found', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.findUnique.mockResolvedValue(null)

    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/user/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns validation error for invalid data', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())

    const res = await PUT(makeRequest('PUT', { firstName: '' }))
    expect(res.status).toBe(400)
  })

  it('returns message when no updates provided', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())

    const res = await PUT(makeRequest('PUT', {}))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.message).toBe('No updates provided')
  })

  it('updates profile with firstName and lastName', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())

    db.user.findUnique.mockResolvedValue({
      firstName: 'Old',
      lastName: 'Name',
    } as never)
    db.user.update.mockResolvedValue({
      firstName: 'New',
      lastName: 'Name',
      name: 'New Name',
      email: 'test@example.com',
      daysWithoutBirthControlRing: null,
      daysWithBirthControlRing: null,
    } as never)

    const res = await PUT(makeRequest('PUT', { firstName: 'New' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.firstName).toBe('New')
    expect(data.message).toBe('Profile updated successfully')
  })

  it('updates ring settings', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())

    db.user.update.mockResolvedValue({
      firstName: 'Test',
      lastName: 'User',
      name: 'Test User',
      email: 'test@example.com',
      daysWithoutBirthControlRing: 7,
      daysWithBirthControlRing: 21,
    } as never)

    const res = await PUT(
      makeRequest('PUT', { daysWithBirthControlRing: 21, daysWithoutBirthControlRing: 7 })
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.daysWithBirthControlRing).toBe(21)
  })
})
