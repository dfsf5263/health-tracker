import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parseRetryAfter } from './http-utils'

// Mock sonner toast to prevent DOM errors
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('parseRetryAfter', () => {
  it('extracts seconds from retry message', () => {
    expect(parseRetryAfter('Please try again in 60 seconds.')).toBe(60)
  })

  it('returns null when no match', () => {
    expect(parseRetryAfter('Unknown error')).toBeNull()
  })

  it('handles various second values', () => {
    expect(parseRetryAfter('try again in 30 seconds')).toBe(30)
    expect(parseRetryAfter('try again in 120 seconds')).toBe(120)
  })
})

describe('apiFetch', () => {
  const originalFetch = globalThis.fetch
  const originalWindow = globalThis.window

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns data on successful response', async () => {
    const mockData = { id: 1, name: 'test' }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockData),
    })

    // Re-import to pick up mocked fetch
    const { apiFetch } = await import('./http-utils')
    const result = await apiFetch('/api/test', { showErrorToast: false })

    expect(result.data).toEqual(mockData)
    expect(result.error).toBeNull()
  })

  it('handles 429 rate limit response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ 'Retry-After': '30' }),
      json: () => Promise.resolve({ error: 'Too many requests' }),
    })

    const { apiFetch } = await import('./http-utils')
    const result = await apiFetch('/api/test', { showRateLimitToast: false })

    expect(result.data).toBeNull()
    expect(result.error).toContain('Too many requests')
    expect(result.response.status).toBe(429)
  })

  it('handles 401 unauthorized response', async () => {
    // Remove window to prevent redirect attempt
    const windowSpy = vi.spyOn(globalThis, 'window', 'get').mockReturnValue(undefined as never)

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    })

    const { apiFetch } = await import('./http-utils')
    const result = await apiFetch('/api/test', { showErrorToast: false })

    expect(result.data).toBeNull()
    expect(result.error).toBe('Authentication required')

    windowSpy.mockRestore()
  })

  it('handles generic HTTP errors', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({ error: 'Something went wrong' }),
    })

    const { apiFetch } = await import('./http-utils')
    const result = await apiFetch('/api/test', { showErrorToast: false })

    expect(result.data).toBeNull()
    expect(result.error).toBe('Something went wrong')
  })

  it('handles network errors', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'))

    const { apiFetch } = await import('./http-utils')
    const result = await apiFetch('/api/test', { showErrorToast: false })

    expect(result.data).toBeNull()
    expect(result.error).toBe('Failed to fetch')
    expect(result.response.status).toBe(502)
  })

  it('handles non-JSON error responses gracefully', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      json: () => Promise.reject(new Error('not json')),
    })

    const { apiFetch } = await import('./http-utils')
    const result = await apiFetch('/api/test', { showErrorToast: false })

    expect(result.data).toBeNull()
    expect(result.error).toContain('502')
  })
})

describe('showSuccessToast', () => {
  it('calls toast.success with message', async () => {
    const { toast } = await import('sonner')
    const { showSuccessToast } = await import('./http-utils')

    showSuccessToast('Created successfully')

    expect(toast.success).toHaveBeenCalledWith('Created successfully', {
      description: undefined,
      duration: 3000,
    })
  })
})

describe('rateAwareApiFetch', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns isRateLimited false on success', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 1 }),
    })

    const { rateAwareApiFetch } = await import('./http-utils')
    const result = await rateAwareApiFetch('/api/test', { showErrorToast: false })

    expect(result.isRateLimited).toBe(false)
    expect(result.data).toEqual({ id: 1 })
  })

  it('returns isRateLimited true on 429', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ 'Retry-After': '10' }),
      json: () => Promise.resolve({ error: 'Rate limit' }),
    })

    const { rateAwareApiFetch } = await import('./http-utils')
    const result = await rateAwareApiFetch('/api/test', {
      showRateLimitToast: false,
      showErrorToast: false,
    })

    expect(result.isRateLimited).toBe(true)
    expect(result.data).toBeNull()
  })
})
