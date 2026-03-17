import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: {
      email: vi.fn(),
    },
  },
}))
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'
import { SignInForm } from './sign-in-form'

const mockSignIn = vi.mocked(authClient.signIn.email)
const mockRouter = vi.mocked(useRouter)

describe('SignInForm', () => {
  let push: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    push = vi.fn()
    mockRouter.mockReturnValue({ push } as never)
  })

  it('renders email and password fields', () => {
    render(<SignInForm />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('has a link to sign up', () => {
    render(<SignInForm />)
    const link = screen.getByRole('link', { name: 'Sign up' })
    expect(link).toHaveAttribute('href', '/sign-up')
  })

  it('calls signIn and redirects on success', async () => {
    mockSignIn.mockResolvedValue({ data: { user: { id: '1' } }, error: null } as never)

    render(<SignInForm />)
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        callbackURL: '/dashboard',
      })
      expect(push).toHaveBeenCalledWith('/dashboard')
      expect(toast.success).toHaveBeenCalledWith('Welcome back!')
    })
  })

  it('shows error toast on sign-in failure', async () => {
    mockSignIn.mockResolvedValue({
      data: null,
      error: { message: 'Invalid credentials' },
    } as never)

    render(<SignInForm />)
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong')
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials')
    })
  })

  it('shows email verification error for unverified email', async () => {
    mockSignIn.mockResolvedValue({
      data: null,
      error: { message: 'email not verified' },
    } as never)

    render(<SignInForm />)
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'password')
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Please verify your email address',
        expect.any(Object)
      )
    })
  })

  it('shows 2FA info toast when required', async () => {
    mockSignIn.mockResolvedValue({
      data: { twoFactorRedirect: true },
      error: null,
    } as never)

    render(<SignInForm />)
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'password')
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith(
        'Two-factor authentication required',
        expect.any(Object)
      )
    })
  })
})
