import { prisma } from '@/lib/prisma'
import { MIGRAINE_SYMPTOM_TYPES } from '@/lib/utils/type-definitions'

/**
 * Prepopulates migraine symptom types for a user
 * @param userId - The user's UUID
 */
export async function prepopulateMigraineSymptomTypes(userId: string): Promise<void> {
  try {
    const typesToCreate = MIGRAINE_SYMPTOM_TYPES.map((name) => ({
      userId,
      name,
    }))

    await prisma.migraineSymptomType.createMany({
      data: typesToCreate,
      skipDuplicates: true, // Handle potential race conditions
    })

    console.log(
      `Successfully prepopulated ${MIGRAINE_SYMPTOM_TYPES.length} migraine symptom types for user ${userId}`
    )
  } catch (error) {
    console.error(`Failed to prepopulate migraine symptom types for user ${userId}:`, error)
    throw error
  }
}
