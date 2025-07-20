import { prisma } from '@/lib/prisma'
import { NORMAL_PHYSICAL_TYPES } from '@/lib/utils/type-definitions'

/**
 * Prepopulates normal physical types for a user
 * @param userId - The user's UUID
 */
export async function prepopulateNormalPhysicalTypes(userId: string): Promise<void> {
  try {
    const typesToCreate = NORMAL_PHYSICAL_TYPES.map((name) => ({
      userId,
      name,
    }))

    await prisma.normalPhysicalType.createMany({
      data: typesToCreate,
      skipDuplicates: true, // Handle potential race conditions
    })

    console.log(
      `Successfully prepopulated ${NORMAL_PHYSICAL_TYPES.length} normal physical types for user ${userId}`
    )
  } catch (error) {
    console.error(`Failed to prepopulate normal physical types for user ${userId}:`, error)
    throw error
  }
}
