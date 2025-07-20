import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateMigraineTriggerTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let validatedData: z.infer<typeof updateMigraineTriggerTypeSchema> | null = null
  let id: string | null = null

  try {
    const authResult = await auth()
    userId = authResult.userId
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    body = await request.json()
    validatedData = updateMigraineTriggerTypeSchema.parse(body)

    const { id: paramId } = await params
    id = paramId

    // Check if the migraine trigger type exists and belongs to the user
    const existingType = await prisma.migraineTriggerType.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingType) {
      return NextResponse.json({ error: 'Migraine trigger type not found' }, { status: 404 })
    }

    const updatedType = await prisma.migraineTriggerType.update({
      where: { id },
      data: {
        name: validatedData.name,
      },
    })

    return NextResponse.json(updatedType)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error updating migraine trigger type:', {
        error: error.issues,
        requestBody: body,
        typeId: id,
        userId,
        userDbId: user?.id,
        endpoint: `PUT /api/migraine-trigger-types/${id}`,
      })
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    // Handle unique constraint violation (duplicate name)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        {
          error: `Migraine trigger type "${validatedData?.name}" already exists. Please use a different name.`,
        },
        { status: 409 }
      )
    }

    console.error('Error updating migraine trigger type:', {
      error,
      requestBody: body,
      typeId: id,
      userId,
      userDbId: user?.id,
      endpoint: `PUT /api/migraine-trigger-types/${id}`,
    })
    return NextResponse.json({ error: 'Failed to update migraine trigger type' }, { status: 500 })
  }
}

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

    // Check if the migraine trigger type exists and belongs to the user
    const existingType = await prisma.migraineTriggerType.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingType) {
      return NextResponse.json({ error: 'Migraine trigger type not found' }, { status: 404 })
    }

    await prisma.migraineTriggerType.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Migraine trigger type deleted successfully' })
  } catch (error) {
    console.error('Error deleting migraine trigger type:', {
      error,
      typeId: id,
      userId,
      endpoint: `DELETE /api/migraine-trigger-types/${id}`,
    })
    return NextResponse.json({ error: 'Failed to delete migraine trigger type' }, { status: 500 })
  }
}
