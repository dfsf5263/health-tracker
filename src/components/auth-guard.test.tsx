import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))
vi.mock('@/components/ui/loading-overlay', () => ({
  LoadingOverlay: ({ isLoading, text }: { isLoading: boolean; text: string }) =>
    isLoading ? <div data-testid="loading-overlay">{text}</div> : null,
}))

import { authClient } from '@/lib/auth-client'
import { AuthGuard } from './auth-guard'

const mockUseSession = vi.mocked(authClient.useSession)
const mockRouter = vi.mocked(useRouter)

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading overlay while session is pending', () => {
    mockUseSession.mockReturnValue({ data: null, isPending: true } as never)

    render(
      <AuthGuard>
        <div>Protected</div>
      </AuthGuard>
    )

    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument()
    expect(screen.queryByText('Protected')).not.toBeInTheDocument()
  })

  it('renders children when session is active', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '1' } },
      isPending: false,
    } as never)

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to sign-in when no session', () => {
    const push = vi.fn()
    mockRouter.mockReturnValue({ push } as never)
    mockUseSession.mockReturnValue({ data: null, isPending: false } as never)

    render(
      <AuthGuard>
        <div>Protected</div>
      </AuthGuard>
    )

    expect(push).toHaveBeenCalledWith('/sign-in')
    expect(screen.queryByText('Protected')).not.toBeInTheDocument()
  })
})
