import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiError } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-middleware'
import { logApiError } from '@/lib/error-logger'
import { withApiLogging } from '@/lib/middleware/with-api-logging'
import { prisma } from '@/lib/prisma'

const updateIrregularPhysicalTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim()
    .optional(),
})

export const GET = withApiLogging(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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
      const irregularPhysicalType = await prisma.irregularPhysicalType.findFirst({
        where: {
          id,
          userId: user.id,
        },
      })

      if (!irregularPhysicalType) {
        return ApiError.notFound('Irregular physical type')
      }

      return NextResponse.json(irregularPhysicalType)
    } catch (error) {
      await logApiError({
        request,
        error,
        operation: 'fetching irregular physical type',
        context: {
          irregularPhysicalTypeId: id,
          userId,
          userDbId: user?.id,
        },
      })
      return ApiError.internal('fetch irregular physical type')
    }
  }
)

export const PUT = withApiLogging(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    let userId: string | null = null
    let user: { id: string } | null = null
    let body: unknown = null
    let validatedData: z.infer<typeof updateIrregularPhysicalTypeSchema> | null = null
    let id: string | null = null
    let existingIrregularPhysicalType: {
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
      validatedData = updateIrregularPhysicalTypeSchema.parse(body)

      const { id: paramId } = await params
      id = paramId
      existingIrregularPhysicalType = await prisma.irregularPhysicalType.findFirst({
        where: {
          id,
          userId: user.id,
        },
      })

      if (!existingIrregularPhysicalType) {
        return ApiError.notFound('Irregular physical type')
      }

      const updateData: Record<string, unknown> = {}
      if (validatedData.name !== undefined) {
        updateData.name = validatedData.name
      }

      const updatedIrregularPhysicalType = await prisma.irregularPhysicalType.update({
        where: { id },
        data: updateData,
      })

      return NextResponse.json(updatedIrregularPhysicalType)
    } catch (error) {
      if (error instanceof z.ZodError) {
        await logApiError({
          request,
          error,
          operation: 'updating irregular physical type',
          context: {
            requestBody: body,
            irregularPhysicalTypeId: id,
            userId,
            userDbId: user?.id,
            validationError: error.issues,
            existingIrregularPhysicalType,
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
        operation: 'updating irregular physical type',
        context: {
          requestBody: body,
          irregularPhysicalTypeId: id,
          userId,
          userDbId: user?.id,
          validatedData,
          existingIrregularPhysicalType,
        },
      })
      return ApiError.internal('update irregular physical type')
    }
  }
)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string | null = null
  let user: { id: string } | null = null
  let id: string | null = null
  let existingIrregularPhysicalType: {
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
    existingIrregularPhysicalType = await prisma.irregularPhysicalType.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingIrregularPhysicalType) {
      return ApiError.notFound('Irregular physical type')
    }

    // Check if there are any irregular physical days using this type
    const irregularPhysicalDaysCount = await prisma.irregularPhysicalDay.count({
      where: { typeId: id },
    })

    if (irregularPhysicalDaysCount > 0) {
      return ApiError.conflict(
        `Cannot delete irregular physical type "${existingIrregularPhysicalType.name}" because it is being used in ${irregularPhysicalDaysCount} irregular physical day${irregularPhysicalDaysCount === 1 ? '' : 's'}.`
      )
    }

    await prisma.irregularPhysicalType.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    await logApiError({
      request,
      error,
      operation: 'deleting irregular physical type',
      context: {
        irregularPhysicalTypeId: id,
        userId,
        userDbId: user?.id,
        existingIrregularPhysicalType,
      },
    })
    return ApiError.internal('delete irregular physical type')
  }
}
