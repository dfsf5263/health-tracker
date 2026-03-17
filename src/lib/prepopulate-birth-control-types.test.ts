import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/test/mocks/db'
import { BIRTH_CONTROL_TYPES } from '@/lib/utils/type-definitions'

import { prepopulateBirthControlTypes } from './prepopulate-birth-control-types'

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('prepopulateBirthControlTypes', () => {
  it('creates all birth control types for the user', async () => {
    db.birthControlType.createMany.mockResolvedValue({ count: BIRTH_CONTROL_TYPES.length } as never)

    await prepopulateBirthControlTypes('user-1')

    expect(db.birthControlType.createMany).toHaveBeenCalledWith({
      data: BIRTH_CONTROL_TYPES.map((type) => ({
        userId: 'user-1',
        name: type.name,
        vaginalRingInsertion: type.vaginalRingInsertion,
        vaginalRingRemoval: type.vaginalRingRemoval,
      })),
      skipDuplicates: true,
    })
  })

  it('throws on database error', async () => {
    db.birthControlType.createMany.mockRejectedValue(new Error('DB error'))

    await expect(prepopulateBirthControlTypes('user-1')).rejects.toThrow('DB error')
  })
})
