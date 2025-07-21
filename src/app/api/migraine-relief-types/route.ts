import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logApiError } from '@/lib/error-logger'
import { ApiError, generateRequestId } from '@/lib/api-response'

const createMigraineReliefTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
})

export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  let userId: string | null = null
  let user: { id: string } | null = null

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

    const migraineReliefTypes = await prisma.migraineReliefType.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(migraineReliefTypes)
  } catch (error) {
    await logApiError({
      request,
      error,
      operation: 'fetching migraine relief types',
      context: {
        userId,
        userDbId: user?.id,
      },
      requestId,
    })
    return ApiError.internal('fetch migraine relief types', requestId)
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let validatedData: z.infer<typeof createMigraineReliefTypeSchema> | null = null

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
    validatedData = createMigraineReliefTypeSchema.parse(body)

    const migraineReliefType = await prisma.migraineReliefType.create({
      data: {
        userId: user.id,
        name: validatedData.name,
      },
    })

    return NextResponse.json(migraineReliefType, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logApiError({
        request,
        error,
        operation: 'creating migraine relief type',
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
        `Migraine relief type "${validatedData?.name}" already exists. Please use a different name.`,
        requestId
      )
    }

    await logApiError({
      request,
      error,
      operation: 'creating migraine relief type',
      context: {
        requestBody: body,
        userId,
        userDbId: user?.id,
        validatedData,
      },
      requestId,
    })
    return ApiError.internal('create migraine relief type', requestId)
  }
}
