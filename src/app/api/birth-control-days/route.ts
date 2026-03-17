import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiError } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-middleware'
import { logApiError } from '@/lib/error-logger'
import { withApiLogging } from '@/lib/middleware/with-api-logging'
import { prisma } from '@/lib/prisma'

const createBirthControlDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  typeId: z.string().uuid('Type ID must be a valid UUID'),
  notes: z.string().trim().optional(),
})

export const GET = withApiLogging(async (request: NextRequest) => {
  let userId: string | null = null
  let user: { id: string } | null = null

  try {
    const authContext = await requireAuth()
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { userId: authUserId, user: authUser } = authContext
    userId = authUserId
    user = authUser

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const typeId = searchParams.get('typeId')

    const whereClause: { userId: string; date?: { gte: Date; lte: Date }; typeId?: string } = {
      userId: user.id,
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (typeId) {
      whereClause.typeId = typeId
    }

    const birthControlDays = await prisma.birthControlDay.findMany({
      where: whereClause,
      include: {
        type: true,
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(birthControlDays)
  } catch (error) {
    await logApiError({
      request,
      error,
      context: {
        userId,
        userDbId: user?.id,
      },
      operation: 'fetch birth control days',
    })
    return ApiError.internal('fetch birth control days')
  }
})

export const POST = withApiLogging(async (request: NextRequest) => {
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let validatedData: z.infer<typeof createBirthControlDaySchema> | null = null

  try {
    const authContext = await requireAuth()
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { userId: authUserId, user: authUser } = authContext
    userId = authUserId
    user = authUser

    body = await request.json()
    validatedData = createBirthControlDaySchema.parse(body)

    // Verify the type belongs to the user
    const birthControlType = await prisma.birthControlType.findFirst({
      where: {
        id: validatedData.typeId,
        userId: user.id,
      },
    })

    if (!birthControlType) {
      return ApiError.notFound('Birth control type')
    }

    const birthControlDay = await prisma.birthControlDay.create({
      data: {
        userId: user.id,
        date: new Date(validatedData.date),
        typeId: validatedData.typeId,
        notes: validatedData.notes,
      },
      include: {
        type: true,
      },
    })

    return NextResponse.json(birthControlDay, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logApiError({
        request,
        error,
        context: {
          requestBody: body,
          userId,
          userDbId: user?.id,
        },
        operation: 'validate birth control day creation',
      })
      return ApiError.validation(error)
    }

    // Handle unique constraint violation (duplicate date + type for user)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      await logApiError({
        request,
        error,
        context: {
          requestBody: body,
          userId,
          userDbId: user?.id,
        },
        operation: 'create birth control day (duplicate)',
      })
      return ApiError.conflict(
        'Birth control day for this date and type already exists. Please choose a different date or type.'
      )
    }

    await logApiError({
      request,
      error,
      context: {
        requestBody: body,
        userId,
        userDbId: user?.id,
      },
      operation: 'create birth control day',
    })
    return ApiError.internal('create birth control day')
  }
})
