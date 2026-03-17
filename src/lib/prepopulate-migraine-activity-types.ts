import { prisma } from '@/lib/prisma'
import { MIGRAINE_ACTIVITY_TYPES } from '@/lib/utils/type-definitions'

/**
 * Prepopulates migraine activity types for a user
 * @param userId - The user's UUID
 */
export async function prepopulateMigraineActivityTypes(userId: string): Promise<void> {
  try {
    const typesToCreate = MIGRAINE_ACTIVITY_TYPES.map((name) => ({
      userId,
      name,
    }))

    await prisma.migraineActivityType.createMany({
      data: typesToCreate,
      skipDuplicates: true, // Handle potential race conditions
    })

    console.log(
      `Successfully prepopulated ${MIGRAINE_ACTIVITY_TYPES.length} migraine activity types for user ${userId}`
    )
  } catch (error) {
    console.error(`Failed to prepopulate migraine activity types for user ${userId}:`, error)
    throw error
  }
}
