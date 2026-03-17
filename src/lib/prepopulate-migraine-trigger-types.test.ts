import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/test/mocks/db'
import { MIGRAINE_TRIGGER_TYPES } from '@/lib/utils/type-definitions'

import { prepopulateMigraineTriggerTypes } from './prepopulate-migraine-trigger-types'

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('prepopulateMigraineTriggerTypes', () => {
  it('creates all migraine trigger types for the user', async () => {
    db.migraineTriggerType.createMany.mockResolvedValue({
      count: MIGRAINE_TRIGGER_TYPES.length,
    } as never)

    await prepopulateMigraineTriggerTypes('user-1')

    expect(db.migraineTriggerType.createMany).toHaveBeenCalledWith({
      data: MIGRAINE_TRIGGER_TYPES.map((name) => ({ userId: 'user-1', name })),
      skipDuplicates: true,
    })
  })

  it('throws on database error', async () => {
    db.migraineTriggerType.createMany.mockRejectedValue(new Error('DB error'))

    await expect(prepopulateMigraineTriggerTypes('user-1')).rejects.toThrow('DB error')
  })
})
