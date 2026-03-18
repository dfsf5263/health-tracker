import { NextRequest, NextResponse } from 'next/server'
import { ApiError } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-middleware'
import { logApiError } from '@/lib/error-logger'
import { withApiLogging } from '@/lib/middleware/with-api-logging'
import { prisma } from '@/lib/prisma'
import { BirthControlDayWithType, predictNextRingEvent } from '@/lib/ring-prediction'

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

    // Fetch user's ring settings
    const userWithSettings = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        sex: true,
        daysWithBirthControlRing: true,
        daysWithoutBirthControlRing: true,
      },
    })

    if (!userWithSettings) {
      return ApiError.notFound('User')
    }

    // Return empty predictions for Male users
    if (userWithSettings.sex === 'Male') {
      return NextResponse.json({ prediction: null, basedOnEvents: 0, userSettings: {} })
    }

    // Fetch birth control events with their types, filtered to ring events only
    const birthControlEvents = (await prisma.birthControlDay.findMany({
      where: {
        userId: user.id,
        type: {
          OR: [{ vaginalRingInsertion: true }, { vaginalRingRemoval: true }],
        },
      },
      include: {
        type: true,
      },
      orderBy: {
        date: 'desc',
      },
    })) as BirthControlDayWithType[]

    // Generate ring prediction
    const predictionResult = predictNextRingEvent(birthControlEvents, {
      daysWithBirthControlRing: userWithSettings.daysWithBirthControlRing || undefined,
      daysWithoutBirthControlRing: userWithSettings.daysWithoutBirthControlRing || undefined,
    })

    return NextResponse.json(predictionResult)
  } catch (error) {
    await logApiError({
      request,
      error,
      context: {
        userId,
        userDbId: user?.id,
      },
      operation: 'get birth control ring predictions',
    })
    return ApiError.internal('get birth control ring predictions')
  }
})
