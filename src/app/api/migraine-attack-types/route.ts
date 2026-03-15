import { requireAuth } from '@/lib/auth-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logApiError } from '@/lib/error-logger'
import { ApiError, generateRequestId } from '@/lib/api-response'
import { withApiLogging } from '@/lib/middleware/with-api-logging'

const createMigraineAttackTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
})

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

    const migraineAttackTypes = await prisma.migraineAttackType.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(migraineAttackTypes)
  } catch (error) {
    await logApiError({
      request,
      error,
      operation: 'fetching migraine attack types',
      context: {
        userId,
        userDbId: user?.id,
      },
      requestId,
    })
    return ApiError.internal('fetch migraine attack types', requestId)
  }
})

export const POST = withApiLogging(async (request: NextRequest) => {
  const requestId = generateRequestId()
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let validatedData: z.infer<typeof createMigraineAttackTypeSchema> | null = null

  try {
    const authContext = await requireAuth()
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { userId: authUserId, user: authUser } = authContext
    userId = authUserId
    user = authUser

    body = await request.json()
    validatedData = createMigraineAttackTypeSchema.parse(body)

    const migraineAttackType = await prisma.migraineAttackType.create({
      data: {
        userId: user.id,
        name: validatedData.name,
      },
    })

    return NextResponse.json(migraineAttackType, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logApiError({
        request,
        error,
        operation: 'creating migraine attack type',
        context: {
          requestBody: body,
          userId,
          userDbId: user?.id,
          validationError: error.issues,
        },
        requestId,
      })
      return ApiError.validation(error, requestId)
    }

    // Handle unique constraint violation (duplicate name)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return ApiError.conflict(
        `Migraine attack type "${validatedData?.name}" already exists. Please use a different name.`,
        requestId
      )
    }

    await logApiError({
      request,
      error,
      operation: 'creating migraine attack type',
      context: {
        requestBody: body,
        userId,
        userDbId: user?.id,
        validatedData,
      },
      requestId,
    })
    return ApiError.internal('create migraine attack type', requestId)
  }
})
