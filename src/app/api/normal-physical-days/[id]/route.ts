import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logApiError } from '@/lib/error-logger'
import { ApiError, generateRequestId } from '@/lib/api-response'

const updateNormalPhysicalDaySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  typeId: z.string().uuid('Type ID must be a valid UUID').optional(),
  notes: z.string().trim().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = generateRequestId()
  let userId: string | null = null
  let user: { id: string } | null = null
  let id: string | null = null

  try {
    const authResult = await auth()
    userId = authResult.userId
    if (!userId) {
      return ApiError.unauthorized(requestId)
    }

    user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    })

    if (!user) {
      return ApiError.notFound('User', requestId)
    }

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
      return ApiError.notFound('Normal physical day', requestId)
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
      requestId,
    })
    return ApiError.internal('fetch normal physical day', requestId)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = generateRequestId()
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
    const authResult = await auth()
    userId = authResult.userId
    if (!userId) {
      return ApiError.unauthorized(requestId)
    }

    user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    })

    if (!user) {
      return ApiError.notFound('User', requestId)
    }

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
      return ApiError.notFound('Normal physical day', requestId)
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
        return ApiError.notFound('Normal physical type', requestId)
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
        requestId,
      })
      return ApiError.validation(error, requestId)
    }

    // Handle unique constraint violation (duplicate date + type for user)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return ApiError.conflict(
        `Normal physical day for this date and type already exists. Please choose a different date or type.`,
        requestId
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
      requestId,
    })
    return ApiError.internal('update normal physical day', requestId)
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
      return ApiError.unauthorized(requestId)
    }

    user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    })

    if (!user) {
      return ApiError.notFound('User', requestId)
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
      return ApiError.notFound('Normal physical day', requestId)
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
      requestId,
    })
    return ApiError.internal('delete normal physical day', requestId)
  }
}
