import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/test/mocks/db'
import { NORMAL_PHYSICAL_TYPES } from '@/lib/utils/type-definitions'

import { prepopulateNormalPhysicalTypes } from './prepopulate-normal-physical-types'

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('prepopulateNormalPhysicalTypes', () => {
  it('creates all normal physical types for the user', async () => {
    db.normalPhysicalType.createMany.mockResolvedValue({
      count: NORMAL_PHYSICAL_TYPES.length,
    } as never)

    await prepopulateNormalPhysicalTypes('user-1')

    expect(db.normalPhysicalType.createMany).toHaveBeenCalledWith({
      data: NORMAL_PHYSICAL_TYPES.map((name) => ({ userId: 'user-1', name })),
      skipDuplicates: true,
    })
  })

  it('throws on database error', async () => {
    db.normalPhysicalType.createMany.mockRejectedValue(new Error('DB error'))

    await expect(prepopulateNormalPhysicalTypes('user-1')).rejects.toThrow('DB error')
  })
})
