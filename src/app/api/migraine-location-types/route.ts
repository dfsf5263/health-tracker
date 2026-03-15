import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logApiError } from '@/lib/error-logger'
import { ApiError, generateRequestId } from '@/lib/api-response'
import { withApiLogging } from '@/lib/middleware/with-api-logging'

export const GET = withApiLogging(async (request: NextRequest) => {
  const requestId = generateRequestId()

  try {
    const migraineLocationTypes = await prisma.migraineLocationType.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(migraineLocationTypes)
  } catch (error) {
    await logApiError({
      request,
      error,
      operation: 'fetching migraine location types',
      requestId,
    })
    return ApiError.internal('fetch migraine location types', requestId)
  }
})
