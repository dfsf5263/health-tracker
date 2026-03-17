import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiError } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-middleware'
import { logApiError } from '@/lib/error-logger'
import { withApiLogging } from '@/lib/middleware/with-api-logging'
import { prisma } from '@/lib/prisma'

const createIrregularPhysicalTypeSchema = z.object({
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

    const irregularPhysicalTypes = await prisma.irregularPhysicalType.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(irregularPhysicalTypes)
  } catch (error) {
    await logApiError({
      request,
      error,
      operation: 'fetching irregular physical types',
      context: {
        userId,
        userDbId: user?.id,
      },
    })
    return ApiError.internal('fetch irregular physical types')
  }
})

export const POST = withApiLogging(async (request: NextRequest) => {
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let validatedData: z.infer<typeof createIrregularPhysicalTypeSchema> | null = null

  try {
    const authContext = await requireAuth()
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { userId: authUserId, user: authUser } = authContext
    userId = authUserId
    user = authUser

    body = await request.json()
    validatedData = createIrregularPhysicalTypeSchema.parse(body)

    const irregularPhysicalType = await prisma.irregularPhysicalType.create({
      data: {
        userId: user.id,
        name: validatedData.name,
      },
    })

    return NextResponse.json(irregularPhysicalType, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logApiError({
        request,
        error,
        operation: 'creating irregular physical type',
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
        `Irregular physical type "${validatedData?.name}" already exists. Please use a different name.`
      )
    }

    await logApiError({
      request,
      error,
      operation: 'creating irregular physical type',
      context: {
        requestBody: body,
        userId,
        userDbId: user?.id,
        validatedData,
      },
    })
    return ApiError.internal('create irregular physical type')
  }
})
