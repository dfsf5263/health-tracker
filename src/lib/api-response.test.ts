import { describe, expect, it } from 'vitest'
import { ApiError, errorResponse } from './api-response'

describe('errorResponse', () => {
  it('returns a NextResponse with correct status', async () => {
    const response = errorResponse('Not found', 404)
    expect(response.status).toBe(404)
  })

  it('includes error message and timestamp in body', async () => {
    const response = errorResponse('Bad request', 400)
    const body = await response.json()
    expect(body.error).toBe('Bad request')
    expect(body.timestamp).toBeDefined()
  })

  it('includes details when provided', async () => {
    const details = [{ field: 'email', message: 'required' }]
    const response = errorResponse('Validation', 400, details)
    const body = await response.json()
    expect(body.details).toEqual(details)
  })

  it('omits details when not provided', async () => {
    const response = errorResponse('Error', 500)
    const body = await response.json()
    expect(body.details).toBeUndefined()
  })
})

describe('ApiError', () => {
  it('unauthorized returns 401', async () => {
    const response = ApiError.unauthorized()
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('notFound returns 404 with resource name', async () => {
    const response = ApiError.notFound('User')
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.error).toBe('User not found')
  })

  it('validation returns 400 with zod issues', async () => {
    const { z } = await import('zod')
    const schema = z.object({ name: z.string() })
    const result = schema.safeParse({ name: 123 })
    if (result.success) throw new Error('Expected validation failure')

    const response = ApiError.validation(result.error)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Invalid request data')
    expect(body.details).toBeDefined()
    expect(Array.isArray(body.details)).toBe(true)
  })

  it('conflict returns 409', async () => {
    const response = ApiError.conflict('Already exists')
    expect(response.status).toBe(409)
    const body = await response.json()
    expect(body.error).toBe('Already exists')
  })

  it('internal returns 500 with operation description', async () => {
    const response = ApiError.internal('fetch data')
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('Failed to fetch data')
  })

  it('serviceUnavailable returns 503', async () => {
    const response = ApiError.serviceUnavailable('DB down', { reason: 'timeout' })
    expect(response.status).toBe(503)
    const body = await response.json()
    expect(body.error).toBe('DB down')
    expect(body.details).toEqual({ reason: 'timeout' })
  })
})
