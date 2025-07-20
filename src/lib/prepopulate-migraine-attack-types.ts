import { prisma } from '@/lib/prisma'
import { MIGRAINE_ATTACK_TYPES } from '@/lib/utils/type-definitions'

/**
 * Prepopulates migraine attack types for a user
 * @param userId - The user's UUID
 */
export async function prepopulateMigraineAttackTypes(userId: string): Promise<void> {
  try {
    const typesToCreate = MIGRAINE_ATTACK_TYPES.map((name) => ({
      userId,
      name,
    }))

    await prisma.migraineAttackType.createMany({
      data: typesToCreate,
      skipDuplicates: true, // Handle potential race conditions
    })

    console.log(
      `Successfully prepopulated ${MIGRAINE_ATTACK_TYPES.length} migraine attack types for user ${userId}`
    )
  } catch (error) {
    console.error(`Failed to prepopulate migraine attack types for user ${userId}:`, error)
    throw error
  }
}
