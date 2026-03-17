import { NextRequest, NextResponse } from 'next/server'
import { ApiError } from '@/lib/api-response'
import { logApiError } from '@/lib/error-logger'
import { withApiLogging } from '@/lib/middleware/with-api-logging'
import { prisma } from '@/lib/prisma'

export const GET = withApiLogging(async (request: NextRequest) => {
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
    })
    return ApiError.internal('fetch migraine location types')
  }
})
