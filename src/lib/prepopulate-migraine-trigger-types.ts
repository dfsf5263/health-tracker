import { prisma } from '@/lib/prisma'
import { MIGRAINE_TRIGGER_TYPES } from '@/lib/utils/type-definitions'

/**
 * Prepopulates migraine trigger types for a user
 * @param userId - The user's UUID
 */
export async function prepopulateMigraineTriggerTypes(userId: string): Promise<void> {
  try {
    const typesToCreate = MIGRAINE_TRIGGER_TYPES.map((name) => ({
      userId,
      name,
    }))

    await prisma.migraineTriggerType.createMany({
      data: typesToCreate,
      skipDuplicates: true, // Handle potential race conditions
    })

    console.log(
      `Successfully prepopulated ${MIGRAINE_TRIGGER_TYPES.length} migraine trigger types for user ${userId}`
    )
  } catch (error) {
    console.error(`Failed to prepopulate migraine trigger types for user ${userId}:`, error)
    throw error
  }
}
