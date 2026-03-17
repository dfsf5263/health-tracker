import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockSend = vi.fn()

// Mock the resend module with a proper class constructor
vi.mock('resend', () => {
  return {
    Resend: class MockResend {
      emails = { send: mockSend }
    },
  }
})

// Reset mockSend before each test globally
beforeEach(() => {
  mockSend.mockReset()
})

describe('sendBirthControlReminder', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: 'test-api-key',
      EMAIL_FROM_ADDRESS: 'noreply@example.com',
    }
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  it('sends insertion reminder email with correct params', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email-123' }, error: null })

    const { sendBirthControlReminder } = await import('./email-service')
    const result = await sendBirthControlReminder({
      to: 'user@example.com',
      firstName: 'Jane',
      reminderType: 'insertion',
    })

    expect(result.success).toBe(true)
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['user@example.com'],
        from: 'noreply@example.com',
        subject: expect.stringContaining('insert'),
      })
    )
  })

  it('sends removal reminder email', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email-456' }, error: null })

    const { sendBirthControlReminder } = await import('./email-service')
    const result = await sendBirthControlReminder({
      to: 'user@example.com',
      firstName: 'Jane',
      reminderType: 'removal',
    })

    expect(result.success).toBe(true)
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('remove'),
      })
    )
  })

  it('returns error when Resend API fails', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'Rate limited' } })

    const { sendBirthControlReminder } = await import('./email-service')
    const result = await sendBirthControlReminder({
      to: 'user@example.com',
      firstName: 'Jane',
      reminderType: 'insertion',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Rate limited')
  })

  it('returns error when EMAIL_FROM_ADDRESS is not set', async () => {
    delete process.env.EMAIL_FROM_ADDRESS

    const { sendBirthControlReminder } = await import('./email-service')
    const result = await sendBirthControlReminder({
      to: 'user@example.com',
      firstName: 'Jane',
      reminderType: 'insertion',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('EMAIL_FROM_ADDRESS')
  })
})

describe('sendEmailVerification', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: 'test-api-key',
      EMAIL_FROM_ADDRESS: 'noreply@example.com',
    }
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  it('sends verification email with correct params', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email-789' }, error: null })

    const { sendEmailVerification } = await import('./email-service')
    const result = await sendEmailVerification({
      to: 'user@example.com',
      firstName: 'Jane',
      verificationUrl: 'https://app.example.com/verify?token=abc',
    })

    expect(result.success).toBe(true)
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['user@example.com'],
        subject: expect.stringContaining('Verify'),
      })
    )
  })

  it('returns error when RESEND_API_KEY is not set', async () => {
    delete process.env.RESEND_API_KEY

    const { sendEmailVerification } = await import('./email-service')
    const result = await sendEmailVerification({
      to: 'user@example.com',
      firstName: 'Jane',
      verificationUrl: 'https://app.example.com/verify?token=abc',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('RESEND_API_KEY')
  })
})
