import { prisma } from '@/lib/prisma'
import { BIRTH_CONTROL_TYPES } from '@/lib/utils/type-definitions'

/**
 * Prepopulates birth control types for a user
 * @param userId - The user's UUID
 */
export async function prepopulateBirthControlTypes(userId: string): Promise<void> {
  try {
    const typesToCreate = BIRTH_CONTROL_TYPES.map((type) => ({
      userId,
      name: type.name,
      vaginalRingInsertion: type.vaginalRingInsertion,
      vaginalRingRemoval: type.vaginalRingRemoval,
    }))

    await prisma.birthControlType.createMany({
      data: typesToCreate,
      skipDuplicates: true, // Handle potential race conditions
    })

    console.log(
      `Successfully prepopulated ${BIRTH_CONTROL_TYPES.length} birth control types for user ${userId}`
    )
  } catch (error) {
    console.error(`Failed to prepopulate birth control types for user ${userId}:`, error)
    throw error
  }
}
