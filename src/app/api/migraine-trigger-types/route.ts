import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiError } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-middleware'
import { logApiError } from '@/lib/error-logger'
import { withApiLogging } from '@/lib/middleware/with-api-logging'
import { prisma } from '@/lib/prisma'

const createMigraineTriggerTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
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

    const migraineTriggerTypes = await prisma.migraineTriggerType.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(migraineTriggerTypes)
  } catch (error) {
    await logApiError({
      request,
      error,
      operation: 'fetching migraine trigger types',
      context: {
        userId,
        userDbId: user?.id,
      },
    })
    return ApiError.internal('fetch migraine trigger types')
  }
})

export const POST = withApiLogging(async (request: NextRequest) => {
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let validatedData: z.infer<typeof createMigraineTriggerTypeSchema> | null = null

  try {
    const authContext = await requireAuth()
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { userId: authUserId, user: authUser } = authContext
    userId = authUserId
    user = authUser

    body = await request.json()
    validatedData = createMigraineTriggerTypeSchema.parse(body)

    const migraineTriggerType = await prisma.migraineTriggerType.create({
      data: {
        userId: user.id,
        name: validatedData.name,
      },
    })

    return NextResponse.json(migraineTriggerType, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logApiError({
        request,
        error,
        operation: 'creating migraine trigger type',
        context: {
          requestBody: body,
          userId,
          userDbId: user?.id,
          validationError: error.issues,
        },
      })
      return ApiError.validation(error)
    }

    // Handle unique constraint violation (duplicate name)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return ApiError.conflict(
        `Migraine trigger type "${validatedData?.name}" already exists. Please use a different name.`
      )
    }

    await logApiError({
      request,
      error,
      operation: 'creating migraine trigger type',
      context: {
        requestBody: body,
        userId,
        userDbId: user?.id,
        validatedData,
      },
    })
    return ApiError.internal('create migraine trigger type')
  }
})
