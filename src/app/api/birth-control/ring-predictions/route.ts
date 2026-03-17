import { requireAuth } from '@/lib/auth-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logApiError } from '@/lib/error-logger'
import { ApiError, generateRequestId } from '@/lib/api-response'
import { predictNextRingEvent, BirthControlDayWithType } from '@/lib/ring-prediction'
import { withApiLogging } from '@/lib/middleware/with-api-logging'

export const GET = withApiLogging(async (request: NextRequest) => {
  const requestId = generateRequestId()
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
        daysWithBirthControlRing: true,
        daysWithoutBirthControlRing: true,
      },
    })

    if (!userWithSettings) {
      return ApiError.notFound('User', requestId)
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
      requestId,
    })
    return ApiError.internal('get birth control ring predictions', requestId)
  }
})
