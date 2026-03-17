import { prisma } from '@/lib/prisma'
import { MIGRAINE_PRECOGNITION_TYPES } from '@/lib/utils/type-definitions'

/**
 * Prepopulates migraine precognition types for a user
 * @param userId - The user's UUID
 */
export async function prepopulateMigrainePrecognitionTypes(userId: string): Promise<void> {
  try {
    const typesToCreate = MIGRAINE_PRECOGNITION_TYPES.map((name) => ({
      userId,
      name,
    }))

    await prisma.migrainePrecognitionType.createMany({
      data: typesToCreate,
      skipDuplicates: true, // Handle potential race conditions
    })

    console.log(
      `Successfully prepopulated ${MIGRAINE_PRECOGNITION_TYPES.length} migraine precognition types for user ${userId}`
    )
  } catch (error) {
    console.error(`Failed to prepopulate migraine precognition types for user ${userId}:`, error)
    throw error
  }
}
