import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Standard error response structure
 */
interface ErrorResponse {
  error: string
  details?: unknown
  timestamp?: string
}

/**
 * Creates a standardized error response for API routes
 */
export function errorResponse(
  message: string,
  status: number,
  details?: unknown
): NextResponse<ErrorResponse> {
  const response: ErrorResponse = {
    error: message,
    timestamp: new Date().toISOString(),
  }

  if (details !== undefined) {
    response.details = details
  }

  return NextResponse.json(response, { status })
}

/**
 * Common error response helpers
 */
export const ApiError = {
  /**
   * 401 Unauthorized - User not authenticated
   */
  unauthorized: () => errorResponse('Unauthorized', 401),

  /**
   * 404 Not Found - Resource doesn't exist
   */
  notFound: (resource: string) => errorResponse(`${resource} not found`, 404),

  /**
   * 400 Bad Request - Validation errors
   */
  validation: (error: z.ZodError) => errorResponse('Invalid request data', 400, error.issues),

  /**
   * 409 Conflict - Duplicate resource
   */
  conflict: (message: string) => errorResponse(message, 409),

  /**
   * 500 Internal Server Error - Unexpected errors
   */
  internal: (operation: string) => errorResponse(`Failed to ${operation}`, 500),

  /**
   * 503 Service Unavailable - Service health issues
   */
  serviceUnavailable: (message: string, details?: unknown) => errorResponse(message, 503, details),
}
