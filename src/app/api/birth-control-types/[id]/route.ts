import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateBirthControlTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim()
    .optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params
    const birthControlType = await prisma.birthControlType.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!birthControlType) {
      return NextResponse.json({ error: 'Birth control type not found' }, { status: 404 })
    }

    return NextResponse.json(birthControlType)
  } catch (error) {
    console.error('Error fetching birth control type:', error)
    return NextResponse.json({ error: 'Failed to fetch birth control type' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let id: string | null = null
  let existingBirthControlType: {
    id: string
    name: string
    userId: string
  } | null = null

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
    const validatedData = updateBirthControlTypeSchema.parse(body)

    const { id: paramId } = await params
    id = paramId
    existingBirthControlType = await prisma.birthControlType.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingBirthControlType) {
      return NextResponse.json({ error: 'Birth control type not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name
    }

    const updatedBirthControlType = await prisma.birthControlType.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updatedBirthControlType)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error updating birth control type:', {
        error: error.issues,
        requestBody: body,
        birthControlTypeId: id,
        userId,
        userDbId: user?.id,
        existingBirthControlType,
        endpoint: 'PUT /api/birth-control-types/[id]',
      })
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    // Handle unique constraint violation (duplicate name)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const validatedData = updateBirthControlTypeSchema.parse(body)
      return NextResponse.json(
        {
          error: `Birth control type "${validatedData?.name}" already exists. Please use a different name.`,
        },
        { status: 409 }
      )
    }

    console.error('Error updating birth control type:', {
      error,
      requestBody: body,
      birthControlTypeId: id,
      userId,
      userDbId: user?.id,
      existingBirthControlType,
      endpoint: 'PUT /api/birth-control-types/[id]',
    })
    return NextResponse.json({ error: 'Failed to update birth control type' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string | null = null
  let user: { id: string } | null = null
  let id: string | null = null
  let existingBirthControlType: {
    id: string
    name: string
    userId: string
  } | null = null

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

    const { id: paramId } = await params
    id = paramId
    existingBirthControlType = await prisma.birthControlType.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingBirthControlType) {
      return NextResponse.json({ error: 'Birth control type not found' }, { status: 404 })
    }

    // Check if there are any birth control days using this type
    const birthControlDaysCount = await prisma.birthControlDay.count({
      where: { typeId: id },
    })

    if (birthControlDaysCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete birth control type "${existingBirthControlType.name}" because it is being used in ${birthControlDaysCount} birth control day${birthControlDaysCount === 1 ? '' : 's'}.`,
        },
        { status: 409 }
      )
    }

    await prisma.birthControlType.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting birth control type:', {
      error,
      birthControlTypeId: id,
      userId,
      userDbId: user?.id,
      existingBirthControlType,
      endpoint: 'DELETE /api/birth-control-types/[id]',
    })
    return NextResponse.json({ error: 'Failed to delete birth control type' }, { status: 500 })
  }
}
