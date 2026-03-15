import { requireAuth } from '@/lib/auth-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logApiError } from '@/lib/error-logger'
import { ApiError, generateRequestId } from '@/lib/api-response'
import { withApiLogging } from '@/lib/middleware/with-api-logging'

const updateBirthControlDaySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  typeId: z.string().uuid('Type ID must be a valid UUID').optional(),
  notes: z.string().trim().optional(),
})

export const GET = withApiLogging(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const requestId = generateRequestId()
    let userId: string | null = null
    let user: { id: string } | null = null
    let id: string | null = null

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
      const birthControlDay = await prisma.birthControlDay.findFirst({
        where: {
          id,
          userId: user.id,
        },
        include: {
          type: true,
        },
      })

      if (!birthControlDay) {
        return ApiError.notFound('Birth control day', requestId)
      }

      return NextResponse.json(birthControlDay)
    } catch (error) {
      await logApiError({
        request,
        error,
        context: {
          userId,
          userDbId: user?.id,
          birthControlDayId: id,
        },
        operation: 'fetch birth control day',
        requestId,
      })
      return ApiError.internal('fetch birth control day', requestId)
    }
  }
)

export const PUT = withApiLogging(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const requestId = generateRequestId()
    let userId: string | null = null
    let user: { id: string } | null = null
    let body: unknown = null
    let id: string | null = null
    let existingBirthControlDay: {
      id: string
      userId: string
      date: Date
      typeId: string
      notes: string | null
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
      const validatedData = updateBirthControlDaySchema.parse(body)

      const { id: paramId } = await params
      id = paramId
      existingBirthControlDay = await prisma.birthControlDay.findFirst({
        where: {
          id,
          userId: user.id,
        },
      })

      if (!existingBirthControlDay) {
        return ApiError.notFound('Birth control day', requestId)
      }

      // If typeId is being updated, verify the new type belongs to the user
      if (validatedData.typeId && validatedData.typeId !== existingBirthControlDay.typeId) {
        const birthControlType = await prisma.birthControlType.findFirst({
          where: {
            id: validatedData.typeId,
            userId: user.id,
          },
        })

        if (!birthControlType) {
          return ApiError.notFound('Birth control type', requestId)
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

      const updatedBirthControlDay = await prisma.birthControlDay.update({
        where: { id },
        data: updateData,
        include: {
          type: true,
        },
      })

      return NextResponse.json(updatedBirthControlDay)
    } catch (error) {
      if (error instanceof z.ZodError) {
        await logApiError({
          request,
          error,
          context: {
            requestBody: body,
            birthControlDayId: id,
            userId,
            userDbId: user?.id,
            existingBirthControlDay,
          },
          operation: 'validate birth control day update',
          requestId,
        })
        return ApiError.validation(error, requestId)
      }

      // Handle unique constraint violation (duplicate date + type for user)
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        await logApiError({
          request,
          error,
          context: {
            requestBody: body,
            birthControlDayId: id,
            userId,
            userDbId: user?.id,
            existingBirthControlDay,
          },
          operation: 'update birth control day (duplicate)',
          requestId,
        })
        return ApiError.conflict(
          'Birth control day for this date and type already exists. Please choose a different date or type.',
          requestId
        )
      }

      await logApiError({
        request,
        error,
        context: {
          requestBody: body,
          birthControlDayId: id,
          userId,
          userDbId: user?.id,
          existingBirthControlDay,
        },
        operation: 'update birth control day',
        requestId,
      })
      return ApiError.internal('update birth control day', requestId)
    }
  }
)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId()
  let userId: string | null = null
  let user: { id: string } | null = null
  let id: string | null = null
  let existingBirthControlDay: {
    id: string
    userId: string
    date: Date
    typeId: string
    notes: string | null
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
    existingBirthControlDay = await prisma.birthControlDay.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingBirthControlDay) {
      return ApiError.notFound('Birth control day', requestId)
    }

    await prisma.birthControlDay.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    await logApiError({
      request,
      error,
      context: {
        birthControlDayId: id,
        userId,
        userDbId: user?.id,
        existingBirthControlDay,
      },
      operation: 'delete birth control day',
      requestId,
    })
    return ApiError.internal('delete birth control day', requestId)
  }
}
