import { prisma } from '@/lib/prisma'
import { IRREGULAR_PHYSICAL_TYPES } from '@/lib/utils/type-definitions'

/**
 * Prepopulates irregular physical types for a user
 * @param userId - The user's UUID
 */
export async function prepopulateIrregularPhysicalTypes(userId: string): Promise<void> {
  try {
    const typesToCreate = IRREGULAR_PHYSICAL_TYPES.map((name) => ({
      userId,
      name,
    }))

    await prisma.irregularPhysicalType.createMany({
      data: typesToCreate,
      skipDuplicates: true, // Handle potential race conditions
    })

    console.log(
      `Successfully prepopulated ${IRREGULAR_PHYSICAL_TYPES.length} irregular physical types for user ${userId}`
    )
  } catch (error) {
    console.error(`Failed to prepopulate irregular physical types for user ${userId}:`, error)
    throw error
  }
}
