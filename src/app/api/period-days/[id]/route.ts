import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { syncCycles } from '@/lib/sync-cycles'
import { Flow, Color } from '@prisma/client'

const updatePeriodDaySchema = z.object({
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    })
    .optional(),
  flow: z.nativeEnum(Flow).optional(),
  color: z.nativeEnum(Color).optional(),
  notes: z.string().optional().nullable(),
})

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const body = await request.json()
    const validatedData = updatePeriodDaySchema.parse(body)

    const existingPeriodDay = await prisma.periodDay.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existingPeriodDay) {
      return NextResponse.json({ error: 'Period day not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (validatedData.date) {
      const date = new Date(validatedData.date)
      date.setUTCHours(0, 0, 0, 0)
      updateData.date = date
    }

    if (validatedData.flow !== undefined) {
      updateData.flow = validatedData.flow
    }

    if (validatedData.color !== undefined) {
      updateData.color = validatedData.color
    }

    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes
    }

    const updatedPeriodDay = await prisma.periodDay.update({
      where: { id: params.id },
      data: updateData,
    })

    await syncCycles(user.id)

    return NextResponse.json(updatedPeriodDay)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating period day:', error)
    return NextResponse.json({ error: 'Failed to update period day' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const existingPeriodDay = await prisma.periodDay.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existingPeriodDay) {
      return NextResponse.json({ error: 'Period day not found' }, { status: 404 })
    }

    await prisma.periodDay.delete({
      where: { id: params.id },
    })

    await syncCycles(user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting period day:', error)
    return NextResponse.json({ error: 'Failed to delete period day' }, { status: 500 })
  }
}
