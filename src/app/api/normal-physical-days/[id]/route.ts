import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiError } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-middleware'
import { logApiError } from '@/lib/error-logger'
import { withApiLogging } from '@/lib/middleware/with-api-logging'
import { prisma } from '@/lib/prisma'

const updateNormalPhysicalDaySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  typeId: z.string().uuid('Type ID must be a valid UUID').optional(),
  notes: z.string().trim().optional(),
})

export const GET = withApiLogging(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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
        return ApiError.notFound('Normal physical day')
      }

      return NextResponse.json(normalPhysicalDay)
    } catch (error) {
      await logApiError({
        request,
        error,
        operation: 'fetching normal physical day',
        context: {
          normalPhysicalDayId: id,
          userId,
          userDbId: user?.id,
        },
      })
      return ApiError.internal('fetch normal physical day')
    }
  }
)

export const PUT = withApiLogging(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    let userId: string | null = null
    let user: { id: string } | null = null
    let body: unknown = null
    let validatedData: z.infer<typeof updateNormalPhysicalDaySchema> | null = null
    let id: string | null = null
    let existingNormalPhysicalDay: {
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
      validatedData = updateNormalPhysicalDaySchema.parse(body)

      const { id: paramId } = await params
      id = paramId
      existingNormalPhysicalDay = await prisma.normalPhysicalDay.findFirst({
        where: {
          id,
          userId: user.id,
        },
      })

      if (!existingNormalPhysicalDay) {
        return ApiError.notFound('Normal physical day')
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
          return ApiError.notFound('Normal physical type')
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
        await logApiError({
          request,
          error,
          operation: 'updating normal physical day',
          context: {
            requestBody: body,
            normalPhysicalDayId: id,
            userId,
            userDbId: user?.id,
            validationError: error.issues,
            existingNormalPhysicalDay,
          },
        })
        return ApiError.validation(error)
      }

      // Handle unique constraint violation (duplicate date + type for user)
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        return ApiError.conflict(
          `Normal physical day for this date and type already exists. Please choose a different date or type.`
        )
      }

      await logApiError({
        request,
        error,
        operation: 'updating normal physical day',
        context: {
          requestBody: body,
          normalPhysicalDayId: id,
          userId,
          userDbId: user?.id,
          validatedData,
          existingNormalPhysicalDay,
        },
      })
      return ApiError.internal('update normal physical day')
    }
  }
)

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
    const authContext = await requireAuth()
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { userId: authUserId, user: authUser } = authContext
    userId = authUserId
    user = authUser

    const { id: paramId } = await params
    id = paramId
    existingNormalPhysicalDay = await prisma.normalPhysicalDay.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingNormalPhysicalDay) {
      return ApiError.notFound('Normal physical day')
    }

    await prisma.normalPhysicalDay.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    await logApiError({
      request,
      error,
      operation: 'deleting normal physical day',
      context: {
        normalPhysicalDayId: id,
        userId,
        userDbId: user?.id,
        existingNormalPhysicalDay,
      },
    })
    return ApiError.internal('delete normal physical day')
  }
}
