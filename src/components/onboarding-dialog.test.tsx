import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OnboardingDialog } from './onboarding-dialog'

describe('OnboardingDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders title and description when open', () => {
    render(<OnboardingDialog open={true} onComplete={vi.fn()} />)

    expect(screen.getByText('Welcome to Health Tracker!')).toBeInTheDocument()
    expect(
      screen.getByText("We're glad you're here. Before you dive in, we have one quick question.")
    ).toBeInTheDocument()
  })

  it('shows Male and Female radio options', () => {
    render(<OnboardingDialog open={true} onComplete={vi.fn()} />)

    expect(screen.getByRole('radio', { name: 'Male' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Female' })).toBeInTheDocument()
  })

  it('disables Get Started button when no option selected', () => {
    render(<OnboardingDialog open={true} onComplete={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Get Started' })).toBeDisabled()
  })

  it('enables Get Started button after selecting Male', () => {
    render(<OnboardingDialog open={true} onComplete={vi.fn()} />)

    fireEvent.click(screen.getByRole('radio', { name: 'Male' }))
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeEnabled()
  })

  it('enables Get Started button after selecting Female', () => {
    render(<OnboardingDialog open={true} onComplete={vi.fn()} />)

    fireEvent.click(screen.getByRole('radio', { name: 'Female' }))
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeEnabled()
  })

  it('calls POST API with selected sex on submit', async () => {
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }))
    const onComplete = vi.fn()

    render(<OnboardingDialog open={true} onComplete={onComplete} />)

    fireEvent.click(screen.getByRole('radio', { name: 'Male' }))
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sex: 'Male' }),
      })
    })
  })

  it('calls onComplete after successful POST', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    )
    const onComplete = vi.fn()

    render(<OnboardingDialog open={true} onComplete={onComplete} />)

    fireEvent.click(screen.getByRole('radio', { name: 'Female' }))
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }))

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledOnce()
    })
  })

  it('displays error message on API failure', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 })
    )

    render(<OnboardingDialog open={true} onComplete={vi.fn()} />)

    fireEvent.click(screen.getByRole('radio', { name: 'Male' }))
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }))

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
    })
  })

  it('displays error message on network failure', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))

    render(<OnboardingDialog open={true} onComplete={vi.fn()} />)

    fireEvent.click(screen.getByRole('radio', { name: 'Female' }))
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }))

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
    })
  })

  it('shows Saving... text while submitting', async () => {
    let resolvePromise: (value: Response) => void
    const pendingPromise = new Promise<Response>((resolve) => {
      resolvePromise = resolve
    })
    vi.spyOn(global, 'fetch').mockReturnValue(pendingPromise)

    render(<OnboardingDialog open={true} onComplete={vi.fn()} />)

    fireEvent.click(screen.getByRole('radio', { name: 'Male' }))
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
    })

    resolvePromise!(new Response(JSON.stringify({ success: true }), { status: 200 }))
  })

  it('does not render when open is false', () => {
    render(<OnboardingDialog open={false} onComplete={vi.fn()} />)

    expect(screen.queryByText('Welcome to Health Tracker!')).not.toBeInTheDocument()
  })
})
