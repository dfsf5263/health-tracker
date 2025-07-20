import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateNormalPhysicalTypeSchema = z.object({
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
    const normalPhysicalType = await prisma.normalPhysicalType.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!normalPhysicalType) {
      return NextResponse.json({ error: 'Normal physical type not found' }, { status: 404 })
    }

    return NextResponse.json(normalPhysicalType)
  } catch (error) {
    console.error('Error fetching normal physical type:', error)
    return NextResponse.json({ error: 'Failed to fetch normal physical type' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let id: string | null = null
  let existingNormalPhysicalType: {
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
    const validatedData = updateNormalPhysicalTypeSchema.parse(body)

    const { id: paramId } = await params
    id = paramId
    existingNormalPhysicalType = await prisma.normalPhysicalType.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingNormalPhysicalType) {
      return NextResponse.json({ error: 'Normal physical type not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name
    }

    const updatedNormalPhysicalType = await prisma.normalPhysicalType.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updatedNormalPhysicalType)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error updating normal physical type:', {
        error: error.issues,
        requestBody: body,
        normalPhysicalTypeId: id,
        userId,
        userDbId: user?.id,
        existingNormalPhysicalType,
        endpoint: 'PUT /api/normal-physical-types/[id]',
      })
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    // Handle unique constraint violation (duplicate name)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const validatedData = updateNormalPhysicalTypeSchema.parse(body)
      return NextResponse.json(
        {
          error: `Normal physical type "${validatedData?.name}" already exists. Please use a different name.`,
        },
        { status: 409 }
      )
    }

    console.error('Error updating normal physical type:', {
      error,
      requestBody: body,
      normalPhysicalTypeId: id,
      userId,
      userDbId: user?.id,
      existingNormalPhysicalType,
      endpoint: 'PUT /api/normal-physical-types/[id]',
    })
    return NextResponse.json({ error: 'Failed to update normal physical type' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string | null = null
  let user: { id: string } | null = null
  let id: string | null = null
  let existingNormalPhysicalType: {
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
    existingNormalPhysicalType = await prisma.normalPhysicalType.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingNormalPhysicalType) {
      return NextResponse.json({ error: 'Normal physical type not found' }, { status: 404 })
    }

    // Check if there are any normal physical days using this type
    const normalPhysicalDaysCount = await prisma.normalPhysicalDay.count({
      where: { typeId: id },
    })

    if (normalPhysicalDaysCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete normal physical type "${existingNormalPhysicalType.name}" because it is being used in ${normalPhysicalDaysCount} normal physical day${normalPhysicalDaysCount === 1 ? '' : 's'}.`,
        },
        { status: 409 }
      )
    }

    await prisma.normalPhysicalType.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting normal physical type:', {
      error,
      normalPhysicalTypeId: id,
      userId,
      userDbId: user?.id,
      existingNormalPhysicalType,
      endpoint: 'DELETE /api/normal-physical-types/[id]',
    })
    return NextResponse.json({ error: 'Failed to delete normal physical type' }, { status: 500 })
  }
}
