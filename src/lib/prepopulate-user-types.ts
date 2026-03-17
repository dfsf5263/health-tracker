import { prisma } from '@/lib/prisma'
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

/**
 * Prepopulates all type models for a newly created user
 * @param userId - The user's UUID
 */
export async function prepopulateUserTypes(userId: string): Promise<void> {
  console.log(`Starting type prepopulation for user ${userId}`)

  try {
    // Use a transaction to ensure all type creations succeed or none do
    await prisma.$transaction(async () => {
      // Execute all prepopulation functions in parallel for better performance
      await Promise.all([
        prepopulateBirthControlTypes(userId),
        prepopulateIrregularPhysicalTypes(userId),
        prepopulateNormalPhysicalTypes(userId),
        prepopulateMigraineAttackTypes(userId),
        prepopulateMigraineSymptomTypes(userId),
        prepopulateMigraineTriggerTypes(userId),
        prepopulateMigrainePrecognitionTypes(userId),
        prepopulateMigraineMedicationTypes(userId),
        prepopulateMigraineReliefTypes(userId),
        prepopulateMigraineActivityTypes(userId),
      ])
    })

    console.log(`Successfully completed type prepopulation for user ${userId}`)
  } catch (error) {
    console.error(`=== Type Prepopulation Error ===`)
    console.error(`Timestamp: ${new Date().toISOString()}`)
    console.error(`User ID: ${userId}`)
    console.error(`Error:`, error)

    // Re-throw to allow calling code to handle the error appropriately
    throw new Error(
      `Failed to prepopulate types for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
