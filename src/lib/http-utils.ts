import { toast } from 'sonner'

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
  retryAfter?: number
  validationErrors?: Array<{
    row: number
    field: string
    value: string
    message: string
  }>
  details?: unknown
}

/**
 * Backend API error response structure (matches src/lib/api-response.ts)
 */
export interface ApiErrorResponse {
  error: string
  details?: unknown
  timestamp?: string
}

export interface FetchOptions extends RequestInit {
  showErrorToast?: boolean
  showRateLimitToast?: boolean
}

/**
 * Formats an error toast with HTTP status code for debugging
 */
function formatErrorToast(status: number, message: string): void {
  toast.error(`Error ${status}: ${message}`, {
    duration: 5000,
  })
}

/**
 * Shows a success toast with consistent formatting
 */
export function showSuccessToast(message: string, description?: string): void {
  toast.success(message, {
    description,
    duration: 3000,
  })
}

/**
 * Enhanced fetch wrapper with consistent error handling and rate limiting support
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<{ data: T | null; error: string | null; response: Response; errorData?: unknown }> {
  const { showErrorToast = true, showRateLimitToast = true, ...fetchOptions } = options

  try {
    const response = await fetch(url, fetchOptions)

    // Handle rate limiting (429 status)
    if (response.status === 429) {
      const errorData: ApiErrorResponse & { retryAfter?: number } = await response
        .json()
        .catch(() => ({}))
      const retryAfter = response.headers.get('Retry-After')
      const retryAfterSeconds = retryAfter ? parseInt(retryAfter) : errorData.retryAfter || 60

      const retryMessage =
        retryAfterSeconds > 0
          ? ` Please try again in ${retryAfterSeconds} seconds.`
          : ' Please try again later.'

      const errorMessage = errorData.error || 'Rate limit exceeded.'
      const fullMessage = errorMessage + retryMessage

      if (showRateLimitToast) {
        formatErrorToast(429, fullMessage)
      }

      return {
        data: null,
        error: fullMessage,
        response,
        errorData,
      }
    }

    // Handle authentication errors (401) - redirect instead of showing toast
    if (response.status === 401) {
      const errorData: ApiErrorResponse & { message?: string } = await response
        .json()
        .catch(() => ({}))

      // Redirect to sign-in page if we're in the browser
      if (typeof window !== 'undefined') {
        window.location.href = '/sign-in'
      }

      return {
        data: null,
        error: 'Authentication required',
        response,
        errorData,
      }
    }

    // Handle other HTTP errors
    if (!response.ok) {
      const errorData: ApiErrorResponse & { message?: string } = await response
        .json()
        .catch(() => ({}))
      const errorMessage =
        errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`

      if (showErrorToast) {
        formatErrorToast(response.status, errorMessage)
      }

      return {
        data: null,
        error: errorMessage,
        response,
        errorData,
      }
    }

    // Success case
    const data = await response.json()
    return {
      data,
      error: null,
      response,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Network error occurred'

    if (showErrorToast) {
      formatErrorToast(0, errorMessage) // Status 0 for network errors
    }

    return {
      data: null,
      error: errorMessage,
      response: new Response(null, { status: 502 }),
      errorData: undefined,
    }
  }
}

/**
 * Specific helper for rate limit aware API calls
 */
export async function rateAwareApiFetch<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<{ data: T | null; error: string | null; isRateLimited: boolean; errorData?: unknown }> {
  const result = await apiFetch<T>(url, options)

  return {
    data: result.data,
    error: result.error,
    isRateLimited: result.response.status === 429,
    errorData: result.errorData,
  }
}

/**
 * Helper to extract retry-after information from rate limit errors
 */
export function parseRetryAfter(error: string): number | null {
  const match = error.match(/try again in (\d+) seconds/)
  return match ? parseInt(match[1]) : null
}
