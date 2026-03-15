import { requireAuth } from '@/lib/auth-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logApiError } from '@/lib/error-logger'
import { ApiError, generateRequestId } from '@/lib/api-response'
import { withApiLogging } from '@/lib/middleware/with-api-logging'

const updateMigraineMedicationTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
})

export const PUT = withApiLogging(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const requestId = generateRequestId()
    let userId: string | null = null
    let user: { id: string } | null = null
    let body: unknown = null
    let validatedData: z.infer<typeof updateMigraineMedicationTypeSchema> | null = null
    let id: string | null = null

    try {
      const authContext = await requireAuth()
      if (authContext instanceof NextResponse) {
        return authContext
      }

      const { userId: authUserId, user: authUser } = authContext
      userId = authUserId
      user = authUser

      body = await request.json()
      validatedData = updateMigraineMedicationTypeSchema.parse(body)

      const { id: paramId } = await params
      id = paramId

      // Check if the migraine medication type exists and belongs to the user
      const existingType = await prisma.migraineMedicationType.findFirst({
        where: {
          id,
          userId: user.id,
        },
      })

      if (!existingType) {
        return ApiError.notFound('Migraine medication type', requestId)
      }

      const updatedType = await prisma.migraineMedicationType.update({
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
          operation: 'updating migraine medication type',
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
          `Migraine medication type "${validatedData?.name}" already exists. Please use a different name.`,
          requestId
        )
      }

      await logApiError({
        request,
        error,
        operation: 'updating migraine medication type',
        context: {
          requestBody: body,
          typeId: id,
          userId,
          userDbId: user?.id,
          validatedData,
        },
        requestId,
      })
      return ApiError.internal('update migraine medication type', requestId)
    }
  }
)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId()
  let userId: string | null = null
  let id: string | null = null

  try {
    const authContext = await requireAuth()
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { userId: authUserId, user: authUser } = authContext
    userId = authUserId
    const user = authUser

    const { id: paramId } = await params
    id = paramId

    // Check if the migraine medication type exists and belongs to the user
    const existingType = await prisma.migraineMedicationType.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingType) {
      return ApiError.notFound('Migraine medication type', requestId)
    }

    await prisma.migraineMedicationType.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Migraine medication type deleted successfully' })
  } catch (error) {
    await logApiError({
      request,
      error,
      operation: 'deleting migraine medication type',
      context: {
        typeId: id,
        userId,
      },
      requestId,
    })
    return ApiError.internal('delete migraine medication type', requestId)
  }
}
