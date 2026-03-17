import { NextRequest, NextResponse } from 'next/server'
import { ApiError } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-middleware'
import { logApiError } from '@/lib/error-logger'
import { withApiLogging } from '@/lib/middleware/with-api-logging'
import { prisma } from '@/lib/prisma'

export const GET = withApiLogging(async (request: NextRequest) => {
  let userId: string | null = null
  let user: {
    id: string
    averageCycleLength: number | null
    averagePeriodLength: number | null
  } | null = null

  try {
    const authContext = await requireAuth()
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { userId: authUserId, user: authUser } = authContext
    userId = authUserId

    // Get the specific fields we need for analytics
    const userWithAnalytics = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        averageCycleLength: true,
        averagePeriodLength: true,
      },
    })

    if (!userWithAnalytics) {
      return ApiError.notFound('User analytics')
    }

    user = userWithAnalytics

    // Get last 6 cycles
    const cycles = await prisma.cycle.findMany({
      where: { userId: user.id },
      orderBy: { startDate: 'desc' },
      take: 6,
    })

    // Get all period days for the last 6 cycles
    const periodDays = await prisma.periodDay.findMany({
      where: {
        userId: user.id,
        date: {
          gte: cycles.length > 0 ? cycles[cycles.length - 1].startDate : new Date(),
          lte: cycles.length > 0 ? cycles[0].endDate : new Date(),
        },
      },
      orderBy: { date: 'asc' },
    })

    // Get total cycle count
    const totalCycles = await prisma.cycle.count({
      where: { userId: user.id },
    })

    const analytics = {
      averages: {
        cycleLength: user.averageCycleLength,
        periodLength: user.averagePeriodLength,
      },
      totalCycles,
      lastSixCycles: cycles.map((cycle) => ({
        id: cycle.id,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        periodDays: periodDays.filter(
          (pd) => pd.date >= cycle.startDate && pd.date <= cycle.endDate
        ),
      })),
    }

    return NextResponse.json(analytics)
  } catch (error) {
    await logApiError({
      request,
      error,
      operation: 'fetching analytics',
      context: {
        userId,
        userDbId: user?.id,
      },
    })
    return ApiError.internal('fetch analytics')
  }
})
