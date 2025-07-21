import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { syncCycles } from '@/lib/sync-cycles'
import { Flow, Color } from '@prisma/client'
import { logApiError } from '@/lib/error-logger'
import { ApiError, generateRequestId } from '@/lib/api-response'

const createPeriodDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  }),
  flow: z.nativeEnum(Flow),
  color: z.nativeEnum(Color),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  let userId: string | null = null
  let user: { id: string } | null = null

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
      requestId,
    })
    return ApiError.internal('fetch period days', requestId)
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let validatedData: { date: string; flow: Flow; color: Color; notes?: string } | null = null

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
        requestId,
      })
      return ApiError.validation(error, requestId)
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
        requestId,
      })

      return ApiError.conflict(
        `Period day already exists for ${formattedDate}. Please modify the existing period day.`,
        requestId
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
      requestId,
    })
    return ApiError.internal('create period day', requestId)
  }
}
