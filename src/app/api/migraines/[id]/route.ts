import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string | null = null
  let id: string | null = null

  try {
    const authResult = await auth()
    userId = authResult.userId
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id: paramId } = await params
    id = paramId

    // Check if the migraine exists and belongs to the user
    const existingMigraine = await prisma.migraine.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingMigraine) {
      return NextResponse.json({ error: 'Migraine not found' }, { status: 404 })
    }

    await prisma.migraine.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Migraine deleted successfully' })
  } catch (error) {
    console.error('Error deleting migraine:', {
      error,
      migraineId: id,
      userId,
      endpoint: `DELETE /api/migraines/${id}`,
    })
    return NextResponse.json({ error: 'Failed to delete migraine' }, { status: 500 })
  }
}
