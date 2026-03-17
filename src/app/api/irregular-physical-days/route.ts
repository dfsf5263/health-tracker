import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiError } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-middleware'
import { logApiError } from '@/lib/error-logger'
import { withApiLogging } from '@/lib/middleware/with-api-logging'
import { prisma } from '@/lib/prisma'

const createIrregularPhysicalDaySchema = z.object({
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

    const irregularPhysicalDays = await prisma.irregularPhysicalDay.findMany({
      where: whereClause,
      include: {
        type: true,
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(irregularPhysicalDays)
  } catch (error) {
    await logApiError({
      request,
      error,
      operation: 'fetching irregular physical days',
      context: {
        userId,
        userDbId: user?.id,
      },
    })
    return ApiError.internal('fetch irregular physical days')
  }
})

export const POST = withApiLogging(async (request: NextRequest) => {
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let validatedData: z.infer<typeof createIrregularPhysicalDaySchema> | null = null

  try {
    const authContext = await requireAuth()
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { userId: authUserId, user: authUser } = authContext
    userId = authUserId
    user = authUser

    body = await request.json()
    validatedData = createIrregularPhysicalDaySchema.parse(body)

    // Verify the type belongs to the user
    const irregularPhysicalType = await prisma.irregularPhysicalType.findFirst({
      where: {
        id: validatedData.typeId,
        userId: user.id,
      },
    })

    if (!irregularPhysicalType) {
      return ApiError.notFound('Irregular physical type')
    }

    const irregularPhysicalDay = await prisma.irregularPhysicalDay.create({
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

    return NextResponse.json(irregularPhysicalDay, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logApiError({
        request,
        error,
        operation: 'creating irregular physical day',
        context: {
          requestBody: body,
          userId,
          userDbId: user?.id,
          validationError: error.issues,
        },
      })
      return ApiError.validation(error)
    }

    // Handle unique constraint violation (duplicate date + type for user)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return ApiError.conflict(
        `Irregular physical day for this date and type already exists. Please choose a different date or type.`
      )
    }

    await logApiError({
      request,
      error,
      operation: 'creating irregular physical day',
      context: {
        requestBody: body,
        userId,
        userDbId: user?.id,
        validatedData,
      },
    })
    return ApiError.internal('create irregular physical day')
  }
})
