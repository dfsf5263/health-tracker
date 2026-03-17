import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiError } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-middleware'
import { logApiError } from '@/lib/error-logger'
import { withApiLogging } from '@/lib/middleware/with-api-logging'
import { prisma } from '@/lib/prisma'

const updateMigrainePrecognitionTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
})

export const PUT = withApiLogging(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    let userId: string | null = null
    let user: { id: string } | null = null
    let body: unknown = null
    let validatedData: z.infer<typeof updateMigrainePrecognitionTypeSchema> | null = null
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
      validatedData = updateMigrainePrecognitionTypeSchema.parse(body)

      const { id: paramId } = await params
      id = paramId

      // Check if the migraine precognition type exists and belongs to the user
      const existingType = await prisma.migrainePrecognitionType.findFirst({
        where: {
          id,
          userId: user.id,
        },
      })

      if (!existingType) {
        return ApiError.notFound('Migraine precognition type')
      }

      const updatedType = await prisma.migrainePrecognitionType.update({
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
          operation: 'updating migraine precognition type',
          context: {
            requestBody: body,
            typeId: id,
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
          `Migraine precognition type "${validatedData?.name}" already exists. Please use a different name.`
        )
      }

      await logApiError({
        request,
        error,
        operation: 'updating migraine precognition type',
        context: {
          requestBody: body,
          typeId: id,
          userId,
          userDbId: user?.id,
          validatedData,
        },
      })
      return ApiError.internal('update migraine precognition type')
    }
  }
)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Check if the migraine precognition type exists and belongs to the user
    const existingType = await prisma.migrainePrecognitionType.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingType) {
      return ApiError.notFound('Migraine precognition type')
    }

    await prisma.migrainePrecognitionType.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Migraine precognition type deleted successfully' })
  } catch (error) {
    await logApiError({
      request,
      error,
      operation: 'deleting migraine precognition type',
      context: {
        typeId: id,
        userId,
      },
    })
    return ApiError.internal('delete migraine precognition type')
  }
}
