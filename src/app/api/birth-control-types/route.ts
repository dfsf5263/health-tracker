import { requireAuth } from '@/lib/auth-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logApiError } from '@/lib/error-logger'
import { ApiError, generateRequestId } from '@/lib/api-response'
import { withApiLogging } from '@/lib/middleware/with-api-logging'

const createBirthControlTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
  vaginalRingInsertion: z.boolean().optional(),
  vaginalRingRemoval: z.boolean().optional(),
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

    const birthControlTypes = await prisma.birthControlType.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(birthControlTypes)
  } catch (error) {
    await logApiError({
      request,
      error,
      operation: 'fetching birth control types',
      context: {
        userId,
        userDbId: user?.id,
      },
      requestId,
    })
    return ApiError.internal('fetch birth control types', requestId)
  }
})

export const POST = withApiLogging(async (request: NextRequest) => {
  const requestId = generateRequestId()
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let validatedData: z.infer<typeof createBirthControlTypeSchema> | null = null

  try {
    const authContext = await requireAuth()
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { userId: authUserId, user: authUser } = authContext
    userId = authUserId
    user = authUser

    body = await request.json()
    validatedData = createBirthControlTypeSchema.parse(body)

    // Validate vaginal ring insertion uniqueness
    if (validatedData.vaginalRingInsertion) {
      const existingInsertionType = await prisma.birthControlType.findFirst({
        where: {
          userId: user.id,
          vaginalRingInsertion: true,
        },
      })

      if (existingInsertionType) {
        return ApiError.conflict(
          `Only one birth control type can be designated for vaginal ring insertion. "${existingInsertionType.name}" is already set for insertion.`,
          requestId
        )
      }
    }

    // Validate vaginal ring removal uniqueness
    if (validatedData.vaginalRingRemoval) {
      const existingRemovalType = await prisma.birthControlType.findFirst({
        where: {
          userId: user.id,
          vaginalRingRemoval: true,
        },
      })

      if (existingRemovalType) {
        return ApiError.conflict(
          `Only one birth control type can be designated for vaginal ring removal. "${existingRemovalType.name}" is already set for removal.`,
          requestId
        )
      }
    }

    const birthControlType = await prisma.birthControlType.create({
      data: {
        userId: user.id,
        name: validatedData.name,
        vaginalRingInsertion: validatedData.vaginalRingInsertion || false,
        vaginalRingRemoval: validatedData.vaginalRingRemoval || false,
      },
    })

    return NextResponse.json(birthControlType, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logApiError({
        request,
        error,
        operation: 'creating birth control type',
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
        `Birth control type "${validatedData?.name}" already exists. Please use a different name.`,
        requestId
      )
    }

    await logApiError({
      request,
      error,
      operation: 'creating birth control type',
      context: {
        requestBody: body,
        userId,
        userDbId: user?.id,
        validatedData,
      },
      requestId,
    })
    return ApiError.internal('create birth control type', requestId)
  }
})
