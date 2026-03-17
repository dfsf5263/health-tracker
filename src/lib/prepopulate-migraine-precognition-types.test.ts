import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/test/mocks/db'
import { MIGRAINE_PRECOGNITION_TYPES } from '@/lib/utils/type-definitions'

import { prepopulateMigrainePrecognitionTypes } from './prepopulate-migraine-precognition-types'

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('prepopulateMigrainePrecognitionTypes', () => {
  it('creates all migraine precognition types for the user', async () => {
    db.migrainePrecognitionType.createMany.mockResolvedValue({
      count: MIGRAINE_PRECOGNITION_TYPES.length,
    } as never)

    await prepopulateMigrainePrecognitionTypes('user-1')

    expect(db.migrainePrecognitionType.createMany).toHaveBeenCalledWith({
      data: MIGRAINE_PRECOGNITION_TYPES.map((name) => ({ userId: 'user-1', name })),
      skipDuplicates: true,
    })
  })

  it('throws on database error', async () => {
    db.migrainePrecognitionType.createMany.mockRejectedValue(new Error('DB error'))

    await expect(prepopulateMigrainePrecognitionTypes('user-1')).rejects.toThrow('DB error')
  })
})
