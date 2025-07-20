import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateIrregularPhysicalTypeSchema = z.object({
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
    const irregularPhysicalType = await prisma.irregularPhysicalType.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!irregularPhysicalType) {
      return NextResponse.json({ error: 'Irregular physical type not found' }, { status: 404 })
    }

    return NextResponse.json(irregularPhysicalType)
  } catch (error) {
    console.error('Error fetching irregular physical type:', error)
    return NextResponse.json({ error: 'Failed to fetch irregular physical type' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let id: string | null = null
  let existingIrregularPhysicalType: {
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
    const validatedData = updateIrregularPhysicalTypeSchema.parse(body)

    const { id: paramId } = await params
    id = paramId
    existingIrregularPhysicalType = await prisma.irregularPhysicalType.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingIrregularPhysicalType) {
      return NextResponse.json({ error: 'Irregular physical type not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name
    }

    const updatedIrregularPhysicalType = await prisma.irregularPhysicalType.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updatedIrregularPhysicalType)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error updating irregular physical type:', {
        error: error.issues,
        requestBody: body,
        irregularPhysicalTypeId: id,
        userId,
        userDbId: user?.id,
        existingIrregularPhysicalType,
        endpoint: 'PUT /api/irregular-physical-types/[id]',
      })
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    // Handle unique constraint violation (duplicate name)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const validatedData = updateIrregularPhysicalTypeSchema.parse(body)
      return NextResponse.json(
        {
          error: `Irregular physical type "${validatedData?.name}" already exists. Please use a different name.`,
        },
        { status: 409 }
      )
    }

    console.error('Error updating irregular physical type:', {
      error,
      requestBody: body,
      irregularPhysicalTypeId: id,
      userId,
      userDbId: user?.id,
      existingIrregularPhysicalType,
      endpoint: 'PUT /api/irregular-physical-types/[id]',
    })
    return NextResponse.json({ error: 'Failed to update irregular physical type' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string | null = null
  let user: { id: string } | null = null
  let id: string | null = null
  let existingIrregularPhysicalType: {
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
    existingIrregularPhysicalType = await prisma.irregularPhysicalType.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingIrregularPhysicalType) {
      return NextResponse.json({ error: 'Irregular physical type not found' }, { status: 404 })
    }

    // Check if there are any irregular physical days using this type
    const irregularPhysicalDaysCount = await prisma.irregularPhysicalDay.count({
      where: { typeId: id },
    })

    if (irregularPhysicalDaysCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete irregular physical type "${existingIrregularPhysicalType.name}" because it is being used in ${irregularPhysicalDaysCount} irregular physical day${irregularPhysicalDaysCount === 1 ? '' : 's'}.`,
        },
        { status: 409 }
      )
    }

    await prisma.irregularPhysicalType.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting irregular physical type:', {
      error,
      irregularPhysicalTypeId: id,
      userId,
      userDbId: user?.id,
      existingIrregularPhysicalType,
      endpoint: 'DELETE /api/irregular-physical-types/[id]',
    })
    return NextResponse.json({ error: 'Failed to delete irregular physical type' }, { status: 500 })
  }
}
