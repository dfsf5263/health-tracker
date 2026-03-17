import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/test/mocks/db'
import { MIGRAINE_RELIEF_TYPES } from '@/lib/utils/type-definitions'

import { prepopulateMigraineReliefTypes } from './prepopulate-migraine-relief-types'

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('prepopulateMigraineReliefTypes', () => {
  it('creates all migraine relief types for the user', async () => {
    db.migraineReliefType.createMany.mockResolvedValue({
      count: MIGRAINE_RELIEF_TYPES.length,
    } as never)

    await prepopulateMigraineReliefTypes('user-1')

    expect(db.migraineReliefType.createMany).toHaveBeenCalledWith({
      data: MIGRAINE_RELIEF_TYPES.map((name) => ({ userId: 'user-1', name })),
      skipDuplicates: true,
    })
  })

  it('throws on database error', async () => {
    db.migraineReliefType.createMany.mockRejectedValue(new Error('DB error'))

    await expect(prepopulateMigraineReliefTypes('user-1')).rejects.toThrow('DB error')
  })
})
