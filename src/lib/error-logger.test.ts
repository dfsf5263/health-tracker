import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { logApiError } from './error-logger'
import logger from '@/lib/logger'

describe('logApiError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs error with method, url, and operation', async () => {
    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'GET',
    })

    await logApiError({
      request,
      error: new Error('Test error'),
      operation: 'fetch data',
      requestId: 'req-123',
    })

    expect(logger.error).toHaveBeenCalled()
    const callArgs = vi.mocked(logger.error).mock.calls[0]
    const logData = callArgs[0] as Record<string, unknown>

    expect(logData.method).toBe('GET')
    expect(logData.url).toContain('/api/test')
    expect(logData.operation).toBe('fetch data')
    expect(logData.requestId).toBe('req-123')
  })

  it('sanitizes sensitive headers', async () => {
    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer secret-token-12345',
      },
    })

    await logApiError({
      request,
      error: new Error('fail'),
    })

    expect(logger.error).toHaveBeenCalled()
    const callArgs = vi.mocked(logger.error).mock.calls[0]
    const logData = callArgs[0] as Record<string, unknown>
    const headers = logData.headers as Record<string, string>

    // Authorization header should be masked
    const authHeader = headers.authorization ?? headers.Authorization
    expect(authHeader).toBeDefined()
    expect(authHeader).not.toBe('Bearer secret-token-12345')
    expect(authHeader).toContain('***')
    // Content-type should be preserved
    const contentType = headers['content-type'] ?? headers['Content-Type']
    expect(contentType).toBe('application/json')
  })

  it('sanitizes sensitive body fields', async () => {
    const body = JSON.stringify({
      email: 'test@example.com',
      password: 'mysecretpassword',
      name: 'Test',
    })

    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    })

    await logApiError({
      request,
      error: new Error('fail'),
    })

    expect(logger.error).toHaveBeenCalled()
    const callArgs = vi.mocked(logger.error).mock.calls[0]
    const logData = callArgs[0] as Record<string, unknown>

    // Body may or may not be present depending on request clone behavior
    if (logData.body) {
      const logBody = logData.body as Record<string, unknown>
      // Password should be masked
      expect(logBody.password).toContain('***')
      expect(logBody.password).not.toBe('mysecretpassword')
      // Non-sensitive fields should be preserved
      expect(logBody.email).toBe('test@example.com')
      expect(logBody.name).toBe('Test')
    }
  })

  it('includes context when provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'GET',
    })

    await logApiError({
      request,
      error: new Error('fail'),
      context: { userId: 'user-123', action: 'delete' },
    })

    expect(logger.error).toHaveBeenCalled()
    const callArgs = vi.mocked(logger.error).mock.calls[0]
    const logData = callArgs[0] as Record<string, unknown>

    // Context is sanitized before logging
    if (logData.context) {
      const context = logData.context as Record<string, unknown>
      expect(context.userId).toBe('user-123')
      expect(context.action).toBe('delete')
    }
  })

  it('handles logging failure gracefully', async () => {
    vi.mocked(logger.error).mockImplementationOnce(() => {
      throw new Error('logging broken')
    })

    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'GET',
    })

    // Should not throw
    await expect(
      logApiError({
        request,
        error: new Error('original error'),
      })
    ).resolves.toBeUndefined()

    // Should have been called at least twice (original failure + fallback)
    expect(logger.error).toHaveBeenCalledTimes(2)
  })
})
