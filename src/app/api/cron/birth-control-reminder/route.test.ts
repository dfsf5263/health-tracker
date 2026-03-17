import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/error-logger', () => ({
  logApiError: vi.fn(),
}))
vi.mock('@/lib/middleware/with-api-logging', () => ({
  withApiLogging: (handler: Function) => handler,
}))
vi.mock('@/lib/birth-control-reminders', () => ({
  processReminderUsers: vi.fn(),
  getCurrentTimeWindow: vi.fn(() => ({ hour: 8, start: 0, end: 30 })),
}))
vi.mock('@/lib/email-service', () => ({
  sendBirthControlReminder: vi.fn(),
}))

import { processReminderUsers } from '@/lib/birth-control-reminders'
import { sendBirthControlReminder } from '@/lib/email-service'
import { POST } from './route'

const mockProcessUsers = vi.mocked(processReminderUsers)
const mockSendEmail = vi.mocked(sendBirthControlReminder)

const CRON_SECRET = 'test-cron-secret'

function makeRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {}
  if (authHeader) {
    headers.authorization = authHeader
  }
  return new NextRequest('http://localhost/api/cron/birth-control-reminder', {
    method: 'POST',
    headers,
  })
}

describe('POST /api/cron/birth-control-reminder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CRON_SECRET', CRON_SECRET)
  })

  it('returns 401 without authorization header', async () => {
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns 401 with wrong secret', async () => {
    const res = await POST(makeRequest('Bearer wrong-secret'))
    expect(res.status).toBe(401)
  })

  it('returns 500 when CRON_SECRET is not set', async () => {
    vi.stubEnv('CRON_SECRET', '')
    // process.env.CRON_SECRET is empty string which is falsy
    const res = await POST(makeRequest(`Bearer ${CRON_SECRET}`))
    expect(res.status).toBe(500)
  })

  it('processes reminders and sends emails', async () => {
    mockProcessUsers.mockResolvedValue([
      {
        email: 'user@example.com',
        firstName: 'Jane',
        qualified: true,
        reminderType: 'insertion',
        reason: 'qualified',
      },
    ] as never)
    mockSendEmail.mockResolvedValue({ success: true })

    const res = await POST(makeRequest(`Bearer ${CRON_SECRET}`))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.results.successful).toBe(1)
    expect(data.results.failed).toBe(0)
    expect(mockSendEmail).toHaveBeenCalledWith({
      to: 'user@example.com',
      firstName: 'Jane',
      reminderType: 'insertion',
    })
  })

  it('handles email send failure gracefully', async () => {
    mockProcessUsers.mockResolvedValue([
      {
        email: 'user@example.com',
        firstName: 'Jane',
        qualified: true,
        reminderType: 'removal',
        reason: 'qualified',
      },
    ] as never)
    mockSendEmail.mockResolvedValue({ success: false, error: 'SMTP error' })

    const res = await POST(makeRequest(`Bearer ${CRON_SECRET}`))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.results.successful).toBe(0)
    expect(data.results.failed).toBe(1)
  })

  it('skips non-qualified users', async () => {
    mockProcessUsers.mockResolvedValue([
      {
        email: 'skip@example.com',
        firstName: 'Skip',
        qualified: false,
        reminderType: null,
        reason: 'no prediction',
      },
    ] as never)

    const res = await POST(makeRequest(`Bearer ${CRON_SECRET}`))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.results.successful).toBe(0)
    expect(data.results.failed).toBe(0)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })
})
