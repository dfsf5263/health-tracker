import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateIrregularPhysicalDaySchema = z.object({
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
    const irregularPhysicalDay = await prisma.irregularPhysicalDay.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        type: true,
      },
    })

    if (!irregularPhysicalDay) {
      return NextResponse.json({ error: 'Irregular physical day not found' }, { status: 404 })
    }

    return NextResponse.json(irregularPhysicalDay)
  } catch (error) {
    console.error('Error fetching irregular physical day:', error)
    return NextResponse.json({ error: 'Failed to fetch irregular physical day' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let id: string | null = null
  let existingIrregularPhysicalDay: {
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
    const validatedData = updateIrregularPhysicalDaySchema.parse(body)

    const { id: paramId } = await params
    id = paramId
    existingIrregularPhysicalDay = await prisma.irregularPhysicalDay.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingIrregularPhysicalDay) {
      return NextResponse.json({ error: 'Irregular physical day not found' }, { status: 404 })
    }

    // If typeId is being updated, verify the new type belongs to the user
    if (validatedData.typeId && validatedData.typeId !== existingIrregularPhysicalDay.typeId) {
      const irregularPhysicalType = await prisma.irregularPhysicalType.findFirst({
        where: {
          id: validatedData.typeId,
          userId: user.id,
        },
      })

      if (!irregularPhysicalType) {
        return NextResponse.json({ error: 'Irregular physical type not found' }, { status: 404 })
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

    const updatedIrregularPhysicalDay = await prisma.irregularPhysicalDay.update({
      where: { id },
      data: updateData,
      include: {
        type: true,
      },
    })

    return NextResponse.json(updatedIrregularPhysicalDay)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error updating irregular physical day:', {
        error: error.issues,
        requestBody: body,
        irregularPhysicalDayId: id,
        userId,
        userDbId: user?.id,
        existingIrregularPhysicalDay,
        endpoint: 'PUT /api/irregular-physical-days/[id]',
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
          error: `Irregular physical day for this date and type already exists. Please choose a different date or type.`,
        },
        { status: 409 }
      )
    }

    console.error('Error updating irregular physical day:', {
      error,
      requestBody: body,
      irregularPhysicalDayId: id,
      userId,
      userDbId: user?.id,
      existingIrregularPhysicalDay,
      endpoint: 'PUT /api/irregular-physical-days/[id]',
    })
    return NextResponse.json({ error: 'Failed to update irregular physical day' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string | null = null
  let user: { id: string } | null = null
  let id: string | null = null
  let existingIrregularPhysicalDay: {
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
    existingIrregularPhysicalDay = await prisma.irregularPhysicalDay.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingIrregularPhysicalDay) {
      return NextResponse.json({ error: 'Irregular physical day not found' }, { status: 404 })
    }

    await prisma.irregularPhysicalDay.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting irregular physical day:', {
      error,
      irregularPhysicalDayId: id,
      userId,
      userDbId: user?.id,
      existingIrregularPhysicalDay,
      endpoint: 'DELETE /api/irregular-physical-days/[id]',
    })
    return NextResponse.json({ error: 'Failed to delete irregular physical day' }, { status: 500 })
  }
}
