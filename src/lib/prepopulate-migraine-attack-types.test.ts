import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/test/mocks/db'
import { MIGRAINE_ATTACK_TYPES } from '@/lib/utils/type-definitions'

import { prepopulateMigraineAttackTypes } from './prepopulate-migraine-attack-types'

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('prepopulateMigraineAttackTypes', () => {
  it('creates all migraine attack types for the user', async () => {
    db.migraineAttackType.createMany.mockResolvedValue({
      count: MIGRAINE_ATTACK_TYPES.length,
    } as never)

    await prepopulateMigraineAttackTypes('user-1')

    expect(db.migraineAttackType.createMany).toHaveBeenCalledWith({
      data: MIGRAINE_ATTACK_TYPES.map((name) => ({ userId: 'user-1', name })),
      skipDuplicates: true,
    })
  })

  it('throws on database error', async () => {
    db.migraineAttackType.createMany.mockRejectedValue(new Error('DB error'))

    await expect(prepopulateMigraineAttackTypes('user-1')).rejects.toThrow('DB error')
  })
})
