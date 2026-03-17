import { describe, expect, it, vi } from 'vitest'
import { db } from '@/test/mocks/db'

// Mock all 10 prepopulate sub-functions
vi.mock('@/lib/prepopulate-birth-control-types', () => ({
  prepopulateBirthControlTypes: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/prepopulate-irregular-physical-types', () => ({
  prepopulateIrregularPhysicalTypes: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/prepopulate-normal-physical-types', () => ({
  prepopulateNormalPhysicalTypes: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/prepopulate-migraine-attack-types', () => ({
  prepopulateMigraineAttackTypes: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/prepopulate-migraine-symptom-types', () => ({
  prepopulateMigraineSymptomTypes: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/prepopulate-migraine-trigger-types', () => ({
  prepopulateMigraineTriggerTypes: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/prepopulate-migraine-precognition-types', () => ({
  prepopulateMigrainePrecognitionTypes: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/prepopulate-migraine-medication-types', () => ({
  prepopulateMigraineMedicationTypes: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/prepopulate-migraine-relief-types', () => ({
  prepopulateMigraineReliefTypes: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/prepopulate-migraine-activity-types', () => ({
  prepopulateMigraineActivityTypes: vi.fn().mockResolvedValue(undefined),
}))

import { prepopulateUserTypes } from './prepopulate-user-types'
import { prepopulateBirthControlTypes } from '@/lib/prepopulate-birth-control-types'
import { prepopulateIrregularPhysicalTypes } from '@/lib/prepopulate-irregular-physical-types'
import { prepopulateNormalPhysicalTypes } from '@/lib/prepopulate-normal-physical-types'
import { prepopulateMigraineAttackTypes } from '@/lib/prepopulate-migraine-attack-types'
import { prepopulateMigraineSymptomTypes } from '@/lib/prepopulate-migraine-symptom-types'
import { prepopulateMigraineTriggerTypes } from '@/lib/prepopulate-migraine-trigger-types'
import { prepopulateMigrainePrecognitionTypes } from '@/lib/prepopulate-migraine-precognition-types'
import { prepopulateMigraineMedicationTypes } from '@/lib/prepopulate-migraine-medication-types'
import { prepopulateMigraineReliefTypes } from '@/lib/prepopulate-migraine-relief-types'
import { prepopulateMigraineActivityTypes } from '@/lib/prepopulate-migraine-activity-types'

describe('prepopulateUserTypes', () => {
  it('calls all 10 prepopulate functions with the userId', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})

    await prepopulateUserTypes('user-abc')

    expect(prepopulateBirthControlTypes).toHaveBeenCalledWith('user-abc')
    expect(prepopulateIrregularPhysicalTypes).toHaveBeenCalledWith('user-abc')
    expect(prepopulateNormalPhysicalTypes).toHaveBeenCalledWith('user-abc')
    expect(prepopulateMigraineAttackTypes).toHaveBeenCalledWith('user-abc')
    expect(prepopulateMigraineSymptomTypes).toHaveBeenCalledWith('user-abc')
    expect(prepopulateMigraineTriggerTypes).toHaveBeenCalledWith('user-abc')
    expect(prepopulateMigrainePrecognitionTypes).toHaveBeenCalledWith('user-abc')
    expect(prepopulateMigraineMedicationTypes).toHaveBeenCalledWith('user-abc')
    expect(prepopulateMigraineReliefTypes).toHaveBeenCalledWith('user-abc')
    expect(prepopulateMigraineActivityTypes).toHaveBeenCalledWith('user-abc')
  })

  it('throws when a sub-function fails', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(prepopulateBirthControlTypes).mockRejectedValueOnce(new Error('DB connection lost'))

    await expect(prepopulateUserTypes('user-abc')).rejects.toThrow(
      'Failed to prepopulate types for user user-abc'
    )
  })
})
