import { NextRequest, NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}))

import logger from '@/lib/logger'
import { withApiLogging } from './with-api-logging'

const mockLogger = vi.mocked(logger)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('withApiLogging', () => {
  it('logs request and successful response at info level', async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }))
    const wrapped = withApiLogging(handler)
    const req = new NextRequest('http://localhost/api/test')

    const res = await wrapped(req)

    expect(res.status).toBe(200)
    expect(mockLogger.info).toHaveBeenCalledTimes(2)
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', url: 'http://localhost/api/test' }),
      'api request'
    )
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ status: 200, durationMs: expect.any(Number) }),
      'api response'
    )
  })

  it('logs at debug level when specified', async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }))
    const wrapped = withApiLogging(handler, 'debug')
    const req = new NextRequest('http://localhost/api/health')

    await wrapped(req)

    expect(mockLogger.debug).toHaveBeenCalledTimes(2)
  })

  it('logs error and rethrows on unhandled exception', async () => {
    const error = new Error('kaboom')
    const handler = vi.fn().mockRejectedValue(error)
    const wrapped = withApiLogging(handler)
    const req = new NextRequest('http://localhost/api/test')

    await expect(wrapped(req)).rejects.toThrow('kaboom')
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: error, durationMs: expect.any(Number) }),
      'unhandled api error'
    )
  })

  it('passes context through to handler', async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({}))
    const wrapped = withApiLogging(handler)
    const req = new NextRequest('http://localhost/api/test/123')
    const context = { params: Promise.resolve({ id: '123' }) }

    await wrapped(req, context)

    expect(handler).toHaveBeenCalledWith(req, context)
  })

  it('includes correlation ID from headers', async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({}))
    const wrapped = withApiLogging(handler)
    const req = new NextRequest('http://localhost/api/test', {
      headers: { 'x-correlation-id': 'abc-123' },
    })

    await wrapped(req)

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: 'abc-123' }),
      'api request'
    )
  })
})
