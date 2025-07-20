import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateNormalPhysicalDaySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  typeId: z.string().uuid('Type ID must be a valid UUID').optional(),
  notes: z.string().trim().optional(),
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
    const normalPhysicalDay = await prisma.normalPhysicalDay.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        type: true,
      },
    })

    if (!normalPhysicalDay) {
      return NextResponse.json({ error: 'Normal physical day not found' }, { status: 404 })
    }

    return NextResponse.json(normalPhysicalDay)
  } catch (error) {
    console.error('Error fetching normal physical day:', error)
    return NextResponse.json({ error: 'Failed to fetch normal physical day' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let id: string | null = null
  let existingNormalPhysicalDay: {
    id: string
    userId: string
    date: Date
    typeId: string
    notes: string | null
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
    const validatedData = updateNormalPhysicalDaySchema.parse(body)

    const { id: paramId } = await params
    id = paramId
    existingNormalPhysicalDay = await prisma.normalPhysicalDay.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingNormalPhysicalDay) {
      return NextResponse.json({ error: 'Normal physical day not found' }, { status: 404 })
    }

    // If typeId is being updated, verify the new type belongs to the user
    if (validatedData.typeId && validatedData.typeId !== existingNormalPhysicalDay.typeId) {
      const normalPhysicalType = await prisma.normalPhysicalType.findFirst({
        where: {
          id: validatedData.typeId,
          userId: user.id,
        },
      })

      if (!normalPhysicalType) {
        return NextResponse.json({ error: 'Normal physical type not found' }, { status: 404 })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (validatedData.date !== undefined) {
      updateData.date = new Date(validatedData.date)
    }
    if (validatedData.typeId !== undefined) {
      updateData.typeId = validatedData.typeId
    }
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes
    }

    const updatedNormalPhysicalDay = await prisma.normalPhysicalDay.update({
      where: { id },
      data: updateData,
      include: {
        type: true,
      },
    })

    return NextResponse.json(updatedNormalPhysicalDay)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error updating normal physical day:', {
        error: error.issues,
        requestBody: body,
        normalPhysicalDayId: id,
        userId,
        userDbId: user?.id,
        existingNormalPhysicalDay,
        endpoint: 'PUT /api/normal-physical-days/[id]',
      })
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    // Handle unique constraint violation (duplicate date + type for user)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        {
          error: `Normal physical day for this date and type already exists. Please choose a different date or type.`,
        },
        { status: 409 }
      )
    }

    console.error('Error updating normal physical day:', {
      error,
      requestBody: body,
      normalPhysicalDayId: id,
      userId,
      userDbId: user?.id,
      existingNormalPhysicalDay,
      endpoint: 'PUT /api/normal-physical-days/[id]',
    })
    return NextResponse.json({ error: 'Failed to update normal physical day' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string | null = null
  let user: { id: string } | null = null
  let id: string | null = null
  let existingNormalPhysicalDay: {
    id: string
    userId: string
    date: Date
    typeId: string
    notes: string | null
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
    existingNormalPhysicalDay = await prisma.normalPhysicalDay.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingNormalPhysicalDay) {
      return NextResponse.json({ error: 'Normal physical day not found' }, { status: 404 })
    }

    await prisma.normalPhysicalDay.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting normal physical day:', {
      error,
      normalPhysicalDayId: id,
      userId,
      userDbId: user?.id,
      existingNormalPhysicalDay,
      endpoint: 'DELETE /api/normal-physical-days/[id]',
    })
    return NextResponse.json({ error: 'Failed to delete normal physical day' }, { status: 500 })
  }
}
