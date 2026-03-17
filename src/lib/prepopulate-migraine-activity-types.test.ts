import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/test/mocks/db'
import { MIGRAINE_ACTIVITY_TYPES } from '@/lib/utils/type-definitions'

import { prepopulateMigraineActivityTypes } from './prepopulate-migraine-activity-types'

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('prepopulateMigraineActivityTypes', () => {
  it('creates all migraine activity types for the user', async () => {
    db.migraineActivityType.createMany.mockResolvedValue({
      count: MIGRAINE_ACTIVITY_TYPES.length,
    } as never)

    await prepopulateMigraineActivityTypes('user-1')

    expect(db.migraineActivityType.createMany).toHaveBeenCalledWith({
      data: MIGRAINE_ACTIVITY_TYPES.map((name) => ({ userId: 'user-1', name })),
      skipDuplicates: true,
    })
  })

  it('throws on database error', async () => {
    db.migraineActivityType.createMany.mockRejectedValue(new Error('DB error'))

    await expect(prepopulateMigraineActivityTypes('user-1')).rejects.toThrow('DB error')
  })
})
