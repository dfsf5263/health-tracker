import { requireAuth } from '@/lib/auth-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logApiError } from '@/lib/error-logger'
import { ApiError, generateRequestId } from '@/lib/api-response'
import { withApiLogging } from '@/lib/middleware/with-api-logging'

const updateBirthControlTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim()
    .optional(),
  vaginalRingInsertion: z.boolean().optional(),
  vaginalRingRemoval: z.boolean().optional(),
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
      const birthControlType = await prisma.birthControlType.findFirst({
        where: {
          id,
          userId: user.id,
        },
      })

      if (!birthControlType) {
        return ApiError.notFound('Birth control type', requestId)
      }

      return NextResponse.json(birthControlType)
    } catch (error) {
      await logApiError({
        request,
        error,
        operation: 'fetching birth control type',
        context: {
          birthControlTypeId: id,
          userId,
          userDbId: user?.id,
        },
        requestId,
      })
      return ApiError.internal('fetch birth control type', requestId)
    }
  }
)

export const PUT = withApiLogging(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const requestId = generateRequestId()
    let userId: string | null = null
    let user: { id: string } | null = null
    let body: unknown = null
    let id: string | null = null
    let existingBirthControlType: {
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
      const validatedData = updateBirthControlTypeSchema.parse(body)

      const { id: paramId } = await params
      id = paramId
      existingBirthControlType = await prisma.birthControlType.findFirst({
        where: {
          id,
          userId: user.id,
        },
      })

      if (!existingBirthControlType) {
        return ApiError.notFound('Birth control type', requestId)
      }

      // Validate vaginal ring insertion uniqueness
      if (validatedData.vaginalRingInsertion === true) {
        const existingInsertionType = await prisma.birthControlType.findFirst({
          where: {
            userId: user.id,
            vaginalRingInsertion: true,
            id: { not: id }, // Exclude current record
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
      if (validatedData.vaginalRingRemoval === true) {
        const existingRemovalType = await prisma.birthControlType.findFirst({
          where: {
            userId: user.id,
            vaginalRingRemoval: true,
            id: { not: id }, // Exclude current record
          },
        })

        if (existingRemovalType) {
          return ApiError.conflict(
            `Only one birth control type can be designated for vaginal ring removal. "${existingRemovalType.name}" is already set for removal.`,
            requestId
          )
        }
      }

      const updateData: Record<string, unknown> = {}
      if (validatedData.name !== undefined) {
        updateData.name = validatedData.name
      }
      if (validatedData.vaginalRingInsertion !== undefined) {
        updateData.vaginalRingInsertion = validatedData.vaginalRingInsertion
      }
      if (validatedData.vaginalRingRemoval !== undefined) {
        updateData.vaginalRingRemoval = validatedData.vaginalRingRemoval
      }

      const updatedBirthControlType = await prisma.birthControlType.update({
        where: { id },
        data: updateData,
      })

      return NextResponse.json(updatedBirthControlType)
    } catch (error) {
      if (error instanceof z.ZodError) {
        await logApiError({
          request,
          error,
          operation: 'updating birth control type',
          context: {
            requestBody: body,
            birthControlTypeId: id,
            userId,
            userDbId: user?.id,
            validationError: error.issues,
            existingBirthControlType,
          },
          requestId,
        })
        return ApiError.validation(error, requestId)
      }

      // Handle unique constraint violation (duplicate name)
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        const validatedData = updateBirthControlTypeSchema.parse(body)
        return ApiError.conflict(
          `Birth control type "${validatedData?.name}" already exists. Please use a different name.`,
          requestId
        )
      }

      await logApiError({
        request,
        error,
        operation: 'updating birth control type',
        context: {
          requestBody: body,
          birthControlTypeId: id,
          userId,
          userDbId: user?.id,
          existingBirthControlType,
        },
        requestId,
      })
      return ApiError.internal('update birth control type', requestId)
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
  let existingBirthControlType: {
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
    existingBirthControlType = await prisma.birthControlType.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingBirthControlType) {
      return ApiError.notFound('Birth control type', requestId)
    }

    // Check if there are any birth control days using this type
    const birthControlDaysCount = await prisma.birthControlDay.count({
      where: { typeId: id },
    })

    if (birthControlDaysCount > 0) {
      return ApiError.conflict(
        `Cannot delete birth control type "${existingBirthControlType.name}" because it is being used in ${birthControlDaysCount} birth control day${birthControlDaysCount === 1 ? '' : 's'}.`,
        requestId
      )
    }

    await prisma.birthControlType.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    await logApiError({
      request,
      error,
      operation: 'deleting birth control type',
      context: {
        birthControlTypeId: id,
        userId,
        userDbId: user?.id,
        existingBirthControlType,
      },
      requestId,
    })
    return ApiError.internal('delete birth control type', requestId)
  }
}
