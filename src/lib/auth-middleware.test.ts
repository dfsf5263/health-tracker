import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/test/mocks/db'

// Mock auth-helpers before importing the module under test
vi.mock('@/lib/auth-helpers', () => ({
  getSession: vi.fn(),
}))

import { getSession } from '@/lib/auth-helpers'
import { requireAuth } from './auth-middleware'

const mockGetSession = vi.mocked(getSession)

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no session exists', async () => {
    mockGetSession.mockResolvedValue(null)

    const result = await requireAuth()

    // Should be a NextResponse (not AuthContext)
    expect('status' in result).toBe(true)
    if ('status' in result) {
      expect(result.status).toBe(401)
      const body = await result.json()
      expect(body.error).toBe('Unauthorized')
    }
  })

  it('returns 401 when session has no user', async () => {
    mockGetSession.mockResolvedValue({ session: {}, user: null } as never)

    const result = await requireAuth()

    expect('status' in result).toBe(true)
    if ('status' in result) {
      expect(result.status).toBe(401)
    }
  })

  it('returns 401 when user not found in database', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-123' },
      session: {},
    } as never)

    db.user.findUnique.mockResolvedValue(null)

    const result = await requireAuth()

    expect('status' in result).toBe(true)
    if ('status' in result) {
      expect(result.status).toBe(401)
      const body = await result.json()
      expect(body.error).toContain('User account not found')
    }
  })

  it('returns AuthContext when session and user are valid', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-123' },
      session: {},
    } as never)

    db.user.findUnique.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    } as never)

    const result = await requireAuth()

    // Should be an AuthContext (not a NextResponse)
    expect('userId' in result).toBe(true)
    if ('userId' in result) {
      expect(result.userId).toBe('user-123')
      expect(result.user.email).toBe('test@example.com')
      expect(result.user.firstName).toBe('Test')
    }
  })
})
