import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logApiError } from '@/lib/error-logger'
import { ApiError, generateRequestId } from '@/lib/api-response'

const updateIrregularPhysicalTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim()
    .optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = generateRequestId()
  let userId: string | null = null
  let user: { id: string } | null = null
  let id: string | null = null

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

    const { id: paramId } = await params
    id = paramId
    const irregularPhysicalType = await prisma.irregularPhysicalType.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!irregularPhysicalType) {
      return ApiError.notFound('Irregular physical type', requestId)
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
      requestId,
    })
    return ApiError.internal('fetch irregular physical type', requestId)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = generateRequestId()
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
      return ApiError.notFound('Irregular physical type', requestId)
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
        requestId,
      })
      return ApiError.validation(error, requestId)
    }

    // Handle unique constraint violation (duplicate name)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return ApiError.conflict(
        `Irregular physical type "${validatedData?.name}" already exists. Please use a different name.`,
        requestId
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
      requestId,
    })
    return ApiError.internal('update irregular physical type', requestId)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId()
  let userId: string | null = null
  let user: { id: string } | null = null
  let id: string | null = null
  let existingIrregularPhysicalType: {
    id: string
    name: string
    userId: string
  } | null = null

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

    const { id: paramId } = await params
    id = paramId
    existingIrregularPhysicalType = await prisma.irregularPhysicalType.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingIrregularPhysicalType) {
      return ApiError.notFound('Irregular physical type', requestId)
    }

    // Check if there are any irregular physical days using this type
    const irregularPhysicalDaysCount = await prisma.irregularPhysicalDay.count({
      where: { typeId: id },
    })

    if (irregularPhysicalDaysCount > 0) {
      return ApiError.conflict(
        `Cannot delete irregular physical type "${existingIrregularPhysicalType.name}" because it is being used in ${irregularPhysicalDaysCount} irregular physical day${irregularPhysicalDaysCount === 1 ? '' : 's'}.`,
        requestId
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
      requestId,
    })
    return ApiError.internal('delete irregular physical type', requestId)
  }
}
