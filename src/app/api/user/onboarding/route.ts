import { Sex } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiError } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-middleware'
import { logApiError } from '@/lib/error-logger'
import { withApiLogging } from '@/lib/middleware/with-api-logging'
import { prisma } from '@/lib/prisma'

const updateSexSchema = z.object({
  sex: z.nativeEnum(Sex).refine((v) => v === 'Male' || v === 'Female', {
    message: 'Sex must be Male or Female',
  }),
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

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { sex: true },
    })

    if (!userData) {
      return ApiError.notFound('User')
    }

    return NextResponse.json({
      completed: userData.sex === 'Male' || userData.sex === 'Female',
    })
  } catch (error) {
    await logApiError({
      request,
      error,
      context: {
        userId,
        userDbId: user?.id,
      },
      operation: 'get onboarding status',
    })
    return ApiError.internal('get onboarding status')
  }
})

export const POST = withApiLogging(async (request: NextRequest) => {
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null

  try {
    const authContext = await requireAuth()
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { userId: authUserId, user: authUser } = authContext
    userId = authUserId
    user = authUser

    body = await request.json()
    const validationResult = updateSexSchema.safeParse(body)

    if (!validationResult.success) {
      await logApiError({
        request,
        error: validationResult.error,
        context: {
          userId,
          userDbId: user.id,
          requestBody: body,
        },
        operation: 'update onboarding validation',
      })
      return ApiError.validation(validationResult.error)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { sex: validationResult.data.sex },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    await logApiError({
      request,
      error,
      context: {
        userId,
        userDbId: user?.id,
        requestBody: body,
      },
      operation: 'update onboarding',
    })
    return ApiError.internal('update onboarding')
  }
})
