import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signUp: {
      email: vi.fn(),
    },
    getSession: vi.fn(),
  },
}))
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'
import { SignUpForm } from './sign-up-form'

const mockSignUp = vi.mocked(authClient.signUp.email)
const mockGetSession = vi.mocked(authClient.getSession)
const mockRouter = vi.mocked(useRouter)

describe('SignUpForm', () => {
  let push: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    push = vi.fn()
    mockRouter.mockReturnValue({ push } as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders all form fields', () => {
    render(<SignUpForm />)
    expect(screen.getByLabelText('First name')).toBeInTheDocument()
    expect(screen.getByLabelText('Last name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument()
  })

  it('has a link to sign in', () => {
    render(<SignUpForm />)
    const link = screen.getByRole('link', { name: 'Sign in' })
    expect(link).toHaveAttribute('href', '/sign-in')
  })

  it('redirects to dashboard when session exists after sign up', async () => {
    mockSignUp.mockResolvedValue({ data: { user: { id: '1' } }, error: null } as never)
    mockGetSession.mockResolvedValue({ data: { user: { id: '1' } } } as never)

    render(<SignUpForm />)
    await userEvent.type(screen.getByLabelText('First name'), 'John')
    await userEvent.type(screen.getByLabelText('Last name'), 'Doe')
    await userEvent.type(screen.getByLabelText('Email'), 'john@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
        })
      )
      expect(push).toHaveBeenCalledWith('/dashboard')
      expect(toast.success).toHaveBeenCalledWith('Account created successfully!')
    })
  })

  it('redirects to verify-email when no session after sign up', async () => {
    mockSignUp.mockResolvedValue({ data: { user: { id: '1' } }, error: null } as never)
    mockGetSession.mockResolvedValue({ data: null } as never)

    render(<SignUpForm />)
    await userEvent.type(screen.getByLabelText('First name'), 'Jane')
    await userEvent.type(screen.getByLabelText('Last name'), 'Doe')
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith(
        `/verify-email-sent?email=${encodeURIComponent('jane@example.com')}`
      )
    })
  })

  it('shows error toast on sign up failure', async () => {
    mockSignUp.mockResolvedValue({
      data: null,
      error: { message: 'Email already in use' },
    } as never)

    render(<SignUpForm />)
    await userEvent.type(screen.getByLabelText('First name'), 'John')
    await userEvent.type(screen.getByLabelText('Last name'), 'Doe')
    await userEvent.type(screen.getByLabelText('Email'), 'john@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email already in use')
    })
  })

  it('shows generic error on exception', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockSignUp.mockRejectedValue(new Error('Network error'))

    render(<SignUpForm />)
    await userEvent.type(screen.getByLabelText('First name'), 'John')
    await userEvent.type(screen.getByLabelText('Last name'), 'Doe')
    await userEvent.type(screen.getByLabelText('Email'), 'john@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred')
    })
  })
})
