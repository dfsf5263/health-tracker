import { requireAuth } from '@/lib/auth-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logApiError } from '@/lib/error-logger'
import { ApiError, generateRequestId } from '@/lib/api-response'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = generateRequestId()
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
    const cycle = await prisma.cycle.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!cycle) {
      return ApiError.notFound('Cycle', requestId)
    }

    return NextResponse.json(cycle)
  } catch (error) {
    await logApiError({
      request,
      error,
      context: {
        userId,
        userDbId: user?.id,
        cycleId: id,
      },
      operation: 'fetch cycle',
      requestId,
    })
    return ApiError.internal('fetch cycle', requestId)
  }
}
