import { act, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
}))
vi.mock('@/lib/http-utils', () => ({
  apiFetch: vi.fn(),
}))
vi.mock('@/components/nav-user', () => ({
  NavUser: () => <div data-testid="nav-user" />,
}))

Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

import { SidebarProvider } from '@/components/ui/sidebar'
import { apiFetch } from '@/lib/http-utils'
import { AppSidebar } from './app-sidebar'

const mockApiFetch = vi.mocked(apiFetch)
const mockResponse = new Response(null, { status: 200 })

function renderSidebar() {
  return render(
    <SidebarProvider>
      <AppSidebar />
    </SidebarProvider>
  )
}

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows Migraine Breakdown for Female users', async () => {
    mockApiFetch.mockResolvedValue({ data: { sex: 'Female' }, error: null, response: mockResponse })
    renderSidebar()

    await waitFor(() => {
      expect(screen.getByText('Migraine Breakdown')).toBeInTheDocument()
    })
  })

  it('shows Cycle Tracking for Female users', async () => {
    mockApiFetch.mockResolvedValue({ data: { sex: 'Female' }, error: null, response: mockResponse })
    renderSidebar()

    await waitFor(() => {
      expect(screen.getByText('Cycle Tracking')).toBeInTheDocument()
    })
  })

  it('shows Migraine Breakdown for Male users', async () => {
    mockApiFetch.mockResolvedValue({ data: { sex: 'Male' }, error: null, response: mockResponse })
    renderSidebar()

    await waitFor(() => {
      expect(screen.getByText('Migraine Breakdown')).toBeInTheDocument()
    })
  })

  it('hides Cycle Tracking for Male users', async () => {
    mockApiFetch.mockResolvedValue({ data: { sex: 'Male' }, error: null, response: mockResponse })
    renderSidebar()

    await waitFor(() => {
      expect(screen.getByText('Migraine Breakdown')).toBeInTheDocument()
    })
    expect(screen.queryByText('Cycle Tracking')).not.toBeInTheDocument()
  })

  it('shows Cycle Tracking when sex is empty (default)', async () => {
    mockApiFetch.mockResolvedValue({ data: { sex: '' }, error: null, response: mockResponse })
    renderSidebar()

    await waitFor(() => {
      expect(screen.getByText('Cycle Tracking')).toBeInTheDocument()
    })
  })

  it('renders Analytics group title', async () => {
    mockApiFetch.mockResolvedValue({ data: { sex: 'Female' }, error: null, response: mockResponse })
    renderSidebar()

    await waitFor(() => {
      expect(screen.getByText('Analytics')).toBeInTheDocument()
    })
  })

  it('shows Cycle Tracking when apiFetch returns no data', async () => {
    mockApiFetch.mockResolvedValue({ data: null, error: 'failed', response: mockResponse })
    renderSidebar()

    // With no data, sex stays '' which is not 'Male', so Cycle Tracking shows
    await waitFor(() => {
      expect(screen.getByText('Migraine Breakdown')).toBeInTheDocument()
    })
    expect(screen.getByText('Cycle Tracking')).toBeInTheDocument()
  })

  it('updates sidebar when profile-updated event is dispatched', async () => {
    mockApiFetch.mockResolvedValue({ data: { sex: 'Female' }, error: null, response: mockResponse })
    renderSidebar()

    await waitFor(() => {
      expect(screen.getByText('Cycle Tracking')).toBeInTheDocument()
    })

    // Simulate profile update to Male
    act(() => {
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: { sex: 'Male' } }))
    })

    await waitFor(() => {
      expect(screen.queryByText('Cycle Tracking')).not.toBeInTheDocument()
    })
  })
})
