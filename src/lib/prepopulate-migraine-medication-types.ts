import { prisma } from '@/lib/prisma'
import { MIGRAINE_MEDICATION_TYPES } from '@/lib/utils/type-definitions'

/**
 * Prepopulates migraine medication types for a user
 * @param userId - The user's UUID
 */
export async function prepopulateMigraineMedicationTypes(userId: string): Promise<void> {
  try {
    const typesToCreate = MIGRAINE_MEDICATION_TYPES.map((name) => ({
      userId,
      name,
    }))

    await prisma.migraineMedicationType.createMany({
      data: typesToCreate,
      skipDuplicates: true, // Handle potential race conditions
    })

    console.log(
      `Successfully prepopulated ${MIGRAINE_MEDICATION_TYPES.length} migraine medication types for user ${userId}`
    )
  } catch (error) {
    console.error(`Failed to prepopulate migraine medication types for user ${userId}:`, error)
    throw error
  }
}
