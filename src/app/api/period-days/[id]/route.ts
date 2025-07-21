import { requireAuth } from '@/lib/auth-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { syncCycles } from '@/lib/sync-cycles'
import { Flow, Color } from '@prisma/client'
import { logApiError } from '@/lib/error-logger'
import { ApiError, generateRequestId } from '@/lib/api-response'

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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = generateRequestId()
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let id: string | null = null
  let existingPeriodDay: {
    id: string
    date: Date
    flow: string
    color: string
    notes?: string | null
  } | null = null

  try {
    const authContext = await requireAuth()
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { userId: authUserId, user: authUser } = authContext
    userId = authUserId
    user = authUser

    body = await request.json()
    const validatedData = updatePeriodDaySchema.parse(body)

    const { id: paramId } = await params
    id = paramId
    existingPeriodDay = await prisma.periodDay.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingPeriodDay) {
      return ApiError.notFound('Period day', requestId)
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
      where: { id },
      data: updateData,
    })

    await syncCycles(user.id)

    return NextResponse.json(updatedPeriodDay)
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logApiError({
        request,
        error,
        context: {
          requestBody: body,
          periodDayId: id,
          userId,
          userDbId: user?.id,
          existingPeriodDay,
        },
        operation: 'validate period day update',
        requestId,
      })
      return ApiError.validation(error, requestId)
    }

    await logApiError({
      request,
      error,
      context: {
        requestBody: body,
        periodDayId: id,
        userId,
        userDbId: user?.id,
        existingPeriodDay,
      },
      operation: 'update period day',
      requestId,
    })
    return ApiError.internal('update period day', requestId)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId()
  let userId: string | null = null
  let user: { id: string } | null = null
  let id: string | null = null
  let existingPeriodDay: {
    id: string
    date: Date
    flow: string
    color: string
    notes?: string | null
  } | null = null

  try {
    const authContext = await requireAuth()
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { userId: authUserId, user: authUser } = authContext
    userId = authUserId
    user = authUser

    const { id: paramId } = await params
    id = paramId
    existingPeriodDay = await prisma.periodDay.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingPeriodDay) {
      return ApiError.notFound('Period day', requestId)
    }

    await prisma.periodDay.delete({
      where: { id },
    })

    await syncCycles(user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    await logApiError({
      request,
      error,
      context: {
        periodDayId: id,
        userId,
        userDbId: user?.id,
        existingPeriodDay,
      },
      operation: 'delete period day',
      requestId,
    })
    return ApiError.internal('delete period day', requestId)
  }
}
