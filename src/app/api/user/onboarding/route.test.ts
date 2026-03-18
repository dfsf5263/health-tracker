import { NextRequest, NextResponse } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
  const init: { method: string; headers?: Record<string, string>; body?: string } = { method }
  if (body) {
    init.headers = { 'Content-Type': 'application/json' }
    init.body = JSON.stringify(body)
  }
  return new NextRequest('http://localhost/api/user/onboarding', init)
}

describe('GET /api/user/onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns completed: false when sex is Unknown', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.findUnique.mockResolvedValue({ sex: 'Unknown' } as never)

    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.completed).toBe(false)
  })

  it('returns completed: false when sex is NotApplicable', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.findUnique.mockResolvedValue({ sex: 'NotApplicable' } as never)

    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.completed).toBe(false)
  })

  it('returns completed: true when sex is Male', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.findUnique.mockResolvedValue({ sex: 'Male' } as never)

    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.completed).toBe(true)
  })

  it('returns completed: true when sex is Female', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.findUnique.mockResolvedValue({ sex: 'Female' } as never)

    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.completed).toBe(true)
  })

  it('returns 404 when user not found', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.findUnique.mockResolvedValue(null)

    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(404)
  })

  it('returns 401 when unauthenticated', async () => {
    mockRequireAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(401)
  })

  it('returns 500 on unexpected error', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.findUnique.mockRejectedValue(new Error('DB error'))

    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(500)
  })
})

describe('POST /api/user/onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('updates sex to Male', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.update.mockResolvedValue({} as never)

    const res = await POST(makeRequest('POST', { sex: 'Male' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'test-user-id-123' },
      data: { sex: 'Male' },
    })
  })

  it('updates sex to Female', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.update.mockResolvedValue({} as never)

    const res = await POST(makeRequest('POST', { sex: 'Female' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'test-user-id-123' },
      data: { sex: 'Female' },
    })
  })

  it('returns 400 for Unknown', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())

    const res = await POST(makeRequest('POST', { sex: 'Unknown' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for NotApplicable', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())

    const res = await POST(makeRequest('POST', { sex: 'NotApplicable' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid value', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())

    const res = await POST(makeRequest('POST', { sex: 'Other' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing body', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())

    const res = await POST(makeRequest('POST', {}))
    expect(res.status).toBe(400)
  })

  it('returns 401 when unauthenticated', async () => {
    mockRequireAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

    const res = await POST(makeRequest('POST', { sex: 'Male' }))
    expect(res.status).toBe(401)
  })

  it('returns 500 on unexpected error', async () => {
    mockRequireAuth.mockResolvedValue(mockAuthContext())
    db.user.update.mockRejectedValue(new Error('DB error'))

    const res = await POST(makeRequest('POST', { sex: 'Male' }))
    expect(res.status).toBe(500)
  })
})
