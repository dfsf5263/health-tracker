import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { requestSizeLimit, standardApiSizeLimit } from './request-size'

describe('requestSizeLimit', () => {
  it('returns null when content-length is under limit', async () => {
    const middleware = requestSizeLimit(1024) // 1KB
    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'content-length': '512' },
    })

    const result = await middleware(request)
    expect(result).toBeNull()
  })

  it('returns 413 when content-length exceeds limit', async () => {
    const middleware = requestSizeLimit(1024) // 1KB
    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'content-length': '2048' },
    })

    const result = await middleware(request)
    expect(result).not.toBeNull()
    expect(result!.status).toBe(413)

    const body = await result!.json()
    expect(body.error).toContain('Request too large')
    expect(body.maxSizeBytes).toBe(1024)
    expect(body.providedSizeBytes).toBe(2048)
  })

  it('returns null when no content-length header', async () => {
    const middleware = requestSizeLimit(1024)
    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
    })

    const result = await middleware(request)
    expect(result).toBeNull()
  })

  it('returns null when content-length equals limit', async () => {
    const middleware = requestSizeLimit(1024)
    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'content-length': '1024' },
    })

    const result = await middleware(request)
    expect(result).toBeNull()
  })
})

describe('standardApiSizeLimit', () => {
  it('allows requests under 1MB', async () => {
    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'content-length': '500000' }, // ~500KB
    })

    const result = await standardApiSizeLimit(request)
    expect(result).toBeNull()
  })

  it('rejects requests over 1MB', async () => {
    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'content-length': '2000000' }, // ~2MB
    })

    const result = await standardApiSizeLimit(request)
    expect(result).not.toBeNull()
    expect(result!.status).toBe(413)
  })
})
