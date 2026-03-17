import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/test/mocks/db'
import { IRREGULAR_PHYSICAL_TYPES } from '@/lib/utils/type-definitions'

import { prepopulateIrregularPhysicalTypes } from './prepopulate-irregular-physical-types'

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('prepopulateIrregularPhysicalTypes', () => {
  it('creates all irregular physical types for the user', async () => {
    db.irregularPhysicalType.createMany.mockResolvedValue({
      count: IRREGULAR_PHYSICAL_TYPES.length,
    } as never)

    await prepopulateIrregularPhysicalTypes('user-1')

    expect(db.irregularPhysicalType.createMany).toHaveBeenCalledWith({
      data: IRREGULAR_PHYSICAL_TYPES.map((name) => ({ userId: 'user-1', name })),
      skipDuplicates: true,
    })
  })

  it('throws on database error', async () => {
    db.irregularPhysicalType.createMany.mockRejectedValue(new Error('DB error'))

    await expect(prepopulateIrregularPhysicalTypes('user-1')).rejects.toThrow('DB error')
  })
})
