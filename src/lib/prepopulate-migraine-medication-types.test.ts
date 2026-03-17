import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/test/mocks/db'
import { MIGRAINE_MEDICATION_TYPES } from '@/lib/utils/type-definitions'

import { prepopulateMigraineMedicationTypes } from './prepopulate-migraine-medication-types'

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('prepopulateMigraineMedicationTypes', () => {
  it('creates all migraine medication types for the user', async () => {
    db.migraineMedicationType.createMany.mockResolvedValue({
      count: MIGRAINE_MEDICATION_TYPES.length,
    } as never)

    await prepopulateMigraineMedicationTypes('user-1')

    expect(db.migraineMedicationType.createMany).toHaveBeenCalledWith({
      data: MIGRAINE_MEDICATION_TYPES.map((name) => ({ userId: 'user-1', name })),
      skipDuplicates: true,
    })
  })

  it('throws on database error', async () => {
    db.migraineMedicationType.createMany.mockRejectedValue(new Error('DB error'))

    await expect(prepopulateMigraineMedicationTypes('user-1')).rejects.toThrow('DB error')
  })
})
