import { requireAuth } from '@/lib/auth-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logApiError } from '@/lib/error-logger'
import { ApiError, generateRequestId } from '@/lib/api-response'
import { withApiLogging } from '@/lib/middleware/with-api-logging'

const updateNormalPhysicalTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim()
    .optional(),
})

export const GET = withApiLogging(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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
      const normalPhysicalType = await prisma.normalPhysicalType.findFirst({
        where: {
          id,
          userId: user.id,
        },
      })

      if (!normalPhysicalType) {
        return ApiError.notFound('Normal physical type', requestId)
      }

      return NextResponse.json(normalPhysicalType)
    } catch (error) {
      await logApiError({
        request,
        error,
        operation: 'fetching normal physical type',
        context: {
          normalPhysicalTypeId: id,
          userId,
          userDbId: user?.id,
        },
        requestId,
      })
      return ApiError.internal('fetch normal physical type', requestId)
    }
  }
)

export const PUT = withApiLogging(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const requestId = generateRequestId()
    let userId: string | null = null
    let user: { id: string } | null = null
    let body: unknown = null
    let validatedData: z.infer<typeof updateNormalPhysicalTypeSchema> | null = null
    let id: string | null = null
    let existingNormalPhysicalType: {
      id: string
      name: string
      userId: string
    } | null = null

    try {
      const authContext = await requireAuth()
      if (authContext instanceof NextResponse) {
        return authContext
      }

      const { userId: authUserId, user: authUser } = authContext
      userId = authUserId
      user = authUser

      body = await request.json()
      validatedData = updateNormalPhysicalTypeSchema.parse(body)

      const { id: paramId } = await params
      id = paramId
      existingNormalPhysicalType = await prisma.normalPhysicalType.findFirst({
        where: {
          id,
          userId: user.id,
        },
      })

      if (!existingNormalPhysicalType) {
        return ApiError.notFound('Normal physical type', requestId)
      }

      const updateData: Record<string, unknown> = {}
      if (validatedData.name !== undefined) {
        updateData.name = validatedData.name
      }

      const updatedNormalPhysicalType = await prisma.normalPhysicalType.update({
        where: { id },
        data: updateData,
      })

      return NextResponse.json(updatedNormalPhysicalType)
    } catch (error) {
      if (error instanceof z.ZodError) {
        await logApiError({
          request,
          error,
          operation: 'updating normal physical type',
          context: {
            requestBody: body,
            normalPhysicalTypeId: id,
            userId,
            userDbId: user?.id,
            validationError: error.issues,
            existingNormalPhysicalType,
          },
          requestId,
        })
        return ApiError.validation(error, requestId)
      }

      // Handle unique constraint violation (duplicate name)
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        return ApiError.conflict(
          `Normal physical type "${validatedData?.name}" already exists. Please use a different name.`,
          requestId
        )
      }

      await logApiError({
        request,
        error,
        operation: 'updating normal physical type',
        context: {
          requestBody: body,
          normalPhysicalTypeId: id,
          userId,
          userDbId: user?.id,
          validatedData,
          existingNormalPhysicalType,
        },
        requestId,
      })
      return ApiError.internal('update normal physical type', requestId)
    }
  }
)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId()
  let userId: string | null = null
  let user: { id: string } | null = null
  let id: string | null = null
  let existingNormalPhysicalType: {
    id: string
    name: string
    userId: string
  } | null = null

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
    existingNormalPhysicalType = await prisma.normalPhysicalType.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingNormalPhysicalType) {
      return ApiError.notFound('Normal physical type', requestId)
    }

    // Check if there are any normal physical days using this type
    const normalPhysicalDaysCount = await prisma.normalPhysicalDay.count({
      where: { typeId: id },
    })

    if (normalPhysicalDaysCount > 0) {
      return ApiError.conflict(
        `Cannot delete normal physical type "${existingNormalPhysicalType.name}" because it is being used in ${normalPhysicalDaysCount} normal physical day${normalPhysicalDaysCount === 1 ? '' : 's'}.`,
        requestId
      )
    }

    await prisma.normalPhysicalType.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    await logApiError({
      request,
      error,
      operation: 'deleting normal physical type',
      context: {
        normalPhysicalTypeId: id,
        userId,
        userDbId: user?.id,
        existingNormalPhysicalType,
      },
      requestId,
    })
    return ApiError.internal('delete normal physical type', requestId)
  }
}
