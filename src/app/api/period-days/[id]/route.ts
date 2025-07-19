import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { syncCycles } from '@/lib/sync-cycles'
import { Flow, Color } from '@prisma/client'

const updatePeriodDaySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'Date must be in YYYY-MM-DD format',
    })
    .optional(),
  flow: z.nativeEnum(Flow).optional(),
  color: z.nativeEnum(Color).optional(),
  notes: z.string().optional().nullable(),
})

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let existingPeriodDay: {
    id: string
    date: Date
    flow: string
    color: string
    notes?: string | null
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
    const validatedData = updatePeriodDaySchema.parse(body)

    existingPeriodDay = await prisma.periodDay.findFirst({
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
      // Parse YYYY-MM-DD format directly to avoid timezone issues
      const [year, month, day] = validatedData.date.split('-').map(Number)
      const date = new Date(year, month - 1, day)
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
      console.error('Validation error updating period day:', {
        error: error.issues,
        requestBody: body,
        periodDayId: params.id,
        userId,
        userDbId: user?.id,
        existingPeriodDay,
        endpoint: 'PUT /api/period-days/[id]',
      })
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating period day:', {
      error,
      requestBody: body,
      periodDayId: params.id,
      userId,
      userDbId: user?.id,
      existingPeriodDay,
      endpoint: 'PUT /api/period-days/[id]',
    })
    return NextResponse.json({ error: 'Failed to update period day' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  let userId: string | null = null
  let user: { id: string } | null = null
  let existingPeriodDay: {
    id: string
    date: Date
    flow: string
    color: string
    notes?: string | null
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

    existingPeriodDay = await prisma.periodDay.findFirst({
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
    console.error('Error deleting period day:', {
      error,
      periodDayId: params.id,
      userId,
      userDbId: user?.id,
      existingPeriodDay,
      endpoint: 'DELETE /api/period-days/[id]',
    })
    return NextResponse.json({ error: 'Failed to delete period day' }, { status: 500 })
  }
}
