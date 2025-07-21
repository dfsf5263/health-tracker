import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Standard error response structure
 */
interface ErrorResponse {
  error: string
  details?: unknown
  requestId?: string
  timestamp?: string
}

/**
 * Creates a standardized error response for API routes
 */
export function errorResponse(
  message: string,
  status: number,
  details?: unknown,
  requestId?: string
): NextResponse<ErrorResponse> {
  const response: ErrorResponse = {
    error: message,
    timestamp: new Date().toISOString(),
  }

  if (details !== undefined) {
    response.details = details
  }

  if (requestId) {
    response.requestId = requestId
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
  unauthorized: (requestId?: string) => errorResponse('Unauthorized', 401, undefined, requestId),

  /**
   * 404 Not Found - Resource doesn't exist
   */
  notFound: (resource: string, requestId?: string) =>
    errorResponse(`${resource} not found`, 404, undefined, requestId),

  /**
   * 400 Bad Request - Validation errors
   */
  validation: (error: z.ZodError, requestId?: string) =>
    errorResponse('Invalid request data', 400, error.issues, requestId),

  /**
   * 409 Conflict - Duplicate resource
   */
  conflict: (message: string, requestId?: string) =>
    errorResponse(message, 409, undefined, requestId),

  /**
   * 500 Internal Server Error - Unexpected errors
   */
  internal: (operation: string, requestId?: string) =>
    errorResponse(`Failed to ${operation}`, 500, undefined, requestId),

  /**
   * 503 Service Unavailable - Service health issues
   */
  serviceUnavailable: (message: string, details?: unknown, requestId?: string) =>
    errorResponse(message, 503, details, requestId),
}

/**
 * Generates a simple request ID for tracing
 * Format: timestamp-random
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 9)
  return `${timestamp}-${random}`
}
