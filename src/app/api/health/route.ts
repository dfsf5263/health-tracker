import { NextRequest, NextResponse } from 'next/server'
import { ApiError } from '@/lib/api-response'
import { logApiError } from '@/lib/error-logger'
import { withApiLogging } from '@/lib/middleware/with-api-logging'
import { prisma } from '@/lib/prisma'

export const GET = withApiLogging(async (request: NextRequest) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`

    // Return healthy status
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        service: 'health-tracker',
        version: process.env.npm_package_version || '0.1.0',
      },
      { status: 200 }
    )
  } catch (error) {
    await logApiError({
      request,
      error,
      context: {},
      operation: 'health check',
    })

    // Return unhealthy status
    return ApiError.serviceUnavailable('Health check failed', {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      service: 'health-tracker',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}, 'debug')
