import { Color, Flow } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiError } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-middleware'
import { logApiError } from '@/lib/error-logger'
import { withApiLogging } from '@/lib/middleware/with-api-logging'
import { prisma } from '@/lib/prisma'
import { syncCycles } from '@/lib/sync-cycles'

const createPeriodDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  }),
  flow: z.nativeEnum(Flow),
  color: z.nativeEnum(Color),
  notes: z.string().optional(),
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

    const periodDays = await prisma.periodDay.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(periodDays)
  } catch (error) {
    await logApiError({
      request,
      error,
      context: {
        userId,
        userDbId: user?.id,
      },
      operation: 'fetch period days',
    })
    return ApiError.internal('fetch period days')
  }
})

export const POST = withApiLogging(async (request: NextRequest) => {
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let validatedData: { date: string; flow: Flow; color: Color; notes?: string } | null = null

  try {
    const authContext = await requireAuth()
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { userId: authUserId, user: authUser } = authContext
    userId = authUserId
    user = authUser

    body = await request.json()
    validatedData = createPeriodDaySchema.parse(body)

    // Parse YYYY-MM-DD format directly to avoid timezone issues
    const [year, month, day] = validatedData.date.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    date.setUTCHours(0, 0, 0, 0)

    const periodDay = await prisma.periodDay.create({
      data: {
        userId: user.id,
        date,
        flow: validatedData.flow,
        color: validatedData.color,
        notes: validatedData.notes,
      },
    })

    await syncCycles(user.id)

    return NextResponse.json(periodDay)
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
        operation: 'validate period day creation',
      })
      return ApiError.validation(error)
    }

    // Handle unique constraint violation (duplicate period day)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      let formattedDate = 'this date'

      // Format the date for user-friendly display if validation succeeded
      if (validatedData?.date) {
        const [year, month, day] = validatedData.date.split('-').map(Number)
        const dateObj = new Date(year, month - 1, day)
        formattedDate = dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      }

      await logApiError({
        request,
        error,
        context: {
          requestBody: body,
          userId,
          userDbId: user?.id,
          date: validatedData?.date,
          formattedDate,
        },
        operation: 'create period day (duplicate)',
      })

      return ApiError.conflict(
        `Period day already exists for ${formattedDate}. Please modify the existing period day.`
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
      operation: 'create period day',
    })
    return ApiError.internal('create period day')
  }
})
