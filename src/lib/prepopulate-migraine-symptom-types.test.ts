import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/test/mocks/db'
import { MIGRAINE_SYMPTOM_TYPES } from '@/lib/utils/type-definitions'

import { prepopulateMigraineSymptomTypes } from './prepopulate-migraine-symptom-types'

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('prepopulateMigraineSymptomTypes', () => {
  it('creates all migraine symptom types for the user', async () => {
    db.migraineSymptomType.createMany.mockResolvedValue({
      count: MIGRAINE_SYMPTOM_TYPES.length,
    } as never)

    await prepopulateMigraineSymptomTypes('user-1')

    expect(db.migraineSymptomType.createMany).toHaveBeenCalledWith({
      data: MIGRAINE_SYMPTOM_TYPES.map((name) => ({ userId: 'user-1', name })),
      skipDuplicates: true,
    })
  })

  it('throws on database error', async () => {
    db.migraineSymptomType.createMany.mockRejectedValue(new Error('DB error'))

    await expect(prepopulateMigraineSymptomTypes('user-1')).rejects.toThrow('DB error')
  })
})
