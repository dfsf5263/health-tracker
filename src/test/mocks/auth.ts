import type { AuthContext } from '@/lib/auth-middleware'

export function mockAuthContext(overrides?: Partial<AuthContext>): AuthContext {
  return {
    userId: 'test-user-id-123',
    user: {
      id: 'test-user-id-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    },
    ...overrides,
  }
}
