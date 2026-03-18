import { render, screen } from '@testing-library/react'
import { Activity, Brain } from 'lucide-react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SidebarProvider } from '@/components/ui/sidebar'
import { NavGroup } from './nav-group'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard/analytics/migraines'),
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

import { usePathname } from 'next/navigation'

const mockUsePathname = vi.mocked(usePathname)

const items = [
  { name: 'Migraine Breakdown', url: '/dashboard/analytics/migraines', icon: Brain },
  { name: 'Cycle Tracking', url: '/dashboard/analytics/cycle-tracking', icon: Activity },
]

function renderNavGroup() {
  return render(
    <SidebarProvider>
      <NavGroup title="Analytics" items={items} />
    </SidebarProvider>
  )
}

describe('NavGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePathname.mockReturnValue('/dashboard/analytics/migraines')
  })

  it('renders the group title', () => {
    renderNavGroup()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
  })

  it('renders all item links', () => {
    renderNavGroup()
    expect(screen.getByText('Migraine Breakdown')).toBeInTheDocument()
    expect(screen.getByText('Cycle Tracking')).toBeInTheDocument()
  })

  it('renders links with correct hrefs', () => {
    renderNavGroup()
    const link = screen.getByText('Migraine Breakdown').closest('a')
    expect(link).toHaveAttribute('href', '/dashboard/analytics/migraines')
  })

  it('marks the active item based on pathname', () => {
    renderNavGroup()
    const activeButton = screen.getByText('Migraine Breakdown').closest('[data-active]')
    expect(activeButton).toHaveAttribute('data-active', 'true')
  })

  it('does not mark inactive items as active', () => {
    renderNavGroup()
    const inactiveButton = screen.getByText('Cycle Tracking').closest('[data-active]')
    expect(inactiveButton).not.toHaveAttribute('data-active', 'true')
  })
})
