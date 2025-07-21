import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logApiError } from '@/lib/error-logger'
import { ApiError, generateRequestId } from '@/lib/api-response'

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

    const cycles = await prisma.cycle.findMany({
      where: { userId: user.id },
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json(cycles)
  } catch (error) {
    await logApiError({
      request,
      error,
      context: {
        userId,
        userDbId: user?.id,
      },
      operation: 'fetch cycles',
      requestId,
    })
    return ApiError.internal('fetch cycles', requestId)
  }
}
