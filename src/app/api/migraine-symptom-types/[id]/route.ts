import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logApiError } from '@/lib/error-logger'
import { ApiError, generateRequestId } from '@/lib/api-response'

const updateMigraineSymptomTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = generateRequestId()
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let validatedData: z.infer<typeof updateMigraineSymptomTypeSchema> | null = null
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

    body = await request.json()
    validatedData = updateMigraineSymptomTypeSchema.parse(body)

    const { id: paramId } = await params
    id = paramId

    // Check if the migraine symptom type exists and belongs to the user
    const existingType = await prisma.migraineSymptomType.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingType) {
      return ApiError.notFound('Migraine symptom type', requestId)
    }

    const updatedType = await prisma.migraineSymptomType.update({
      where: { id },
      data: {
        name: validatedData.name,
      },
    })

    return NextResponse.json(updatedType)
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logApiError({
        request,
        error,
        operation: 'updating migraine symptom type',
        context: {
          requestBody: body,
          typeId: id,
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
        `Migraine symptom type "${validatedData?.name}" already exists. Please use a different name.`,
        requestId
      )
    }

    await logApiError({
      request,
      error,
      operation: 'updating migraine symptom type',
      context: {
        requestBody: body,
        typeId: id,
        userId,
        userDbId: user?.id,
        validatedData,
      },
      requestId,
    })
    return ApiError.internal('update migraine symptom type', requestId)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId()
  let userId: string | null = null
  let id: string | null = null

  try {
    const authResult = await auth()
    userId = authResult.userId
    if (!userId) {
      return ApiError.unauthorized(requestId)
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    })

    if (!user) {
      return ApiError.notFound('User', requestId)
    }

    const { id: paramId } = await params
    id = paramId

    // Check if the migraine symptom type exists and belongs to the user
    const existingType = await prisma.migraineSymptomType.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingType) {
      return ApiError.notFound('Migraine symptom type', requestId)
    }

    await prisma.migraineSymptomType.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Migraine symptom type deleted successfully' })
  } catch (error) {
    await logApiError({
      request,
      error,
      operation: 'deleting migraine symptom type',
      context: {
        typeId: id,
        userId,
      },
      requestId,
    })
    return ApiError.internal('delete migraine symptom type', requestId)
  }
}
