import { PrismaClient } from '@prisma/client'
import { beforeEach, vi } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'

const db = mockDeep<PrismaClient>()

// Allow $transaction to pass through to the callback
db.$transaction.mockImplementation(async (fn: unknown) => {
  if (typeof fn === 'function') {
    return fn(db)
  }
  return fn
})

beforeEach(() => {
  mockReset(db)
  // Re-setup $transaction after reset
  db.$transaction.mockImplementation(async (fn: unknown) => {
    if (typeof fn === 'function') {
      return fn(db)
    }
    return fn
  })
})

vi.mock('@/lib/prisma', () => ({
  prisma: db,
}))

export { db }
