import { requireAuth } from '@/lib/auth-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { predictCycles, PredictionModel, PredictionResult } from '@/lib/cycle-prediction'
import { logApiError } from '@/lib/error-logger'
import { ApiError, generateRequestId } from '@/lib/api-response'

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const count = parseInt(searchParams.get('count') || '3')
    const model = (searchParams.get('model') || 'simple_average') as PredictionModel

    // Validate parameters
    if (count < 1 || count > 12) {
      return ApiError.validation(
        {
          issues: [
            {
              code: 'custom',
              message: 'Count must be between 1 and 12',
              path: ['count'],
            },
          ],
        } as z.ZodError,
        requestId
      )
    }

    const validModels: PredictionModel[] = ['simple_average', 'weighted_average']
    if (!validModels.includes(model)) {
      return ApiError.validation(
        {
          issues: [
            {
              code: 'custom',
              message: `Invalid model. Must be one of: ${validModels.join(', ')}`,
              path: ['model'],
            },
          ],
        } as z.ZodError,
        requestId
      )
    }

    // Fetch user's cycles
    const cycles = await prisma.cycle.findMany({
      where: { userId: user.id },
      orderBy: { startDate: 'desc' },
    })

    if (cycles.length === 0) {
      return ApiError.notFound('Cycle data', requestId)
    }

    try {
      const predictions: PredictionResult = predictCycles(cycles, count, model)
      return NextResponse.json(predictions)
    } catch (predictionError: unknown) {
      const errorMessage =
        predictionError instanceof Error ? predictionError.message : 'Unknown prediction error'
      await logApiError({
        request,
        error: predictionError,
        operation: 'generating cycle predictions',
        context: {
          userId,
          userDbId: user?.id,
          count,
          model,
          cycleCount: cycles.length,
        },
        requestId,
      })
      return ApiError.validation(
        {
          issues: [
            {
              code: 'custom',
              message: errorMessage,
              path: ['prediction'],
            },
          ],
        } as z.ZodError,
        requestId
      )
    }
  } catch (error) {
    await logApiError({
      request,
      error,
      operation: 'generating cycle predictions',
      context: {
        userId,
        userDbId: user?.id,
      },
      requestId,
    })
    return ApiError.internal('generate predictions', requestId)
  }
}
