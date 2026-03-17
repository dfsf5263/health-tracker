import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BirthControlTypeCard } from './birth-control-type-card'

const mockType = {
  id: 'type-1',
  userId: 'user-1',
  name: 'Put in Contraceptive Ring',
  vaginalRingInsertion: true,
  vaginalRingRemoval: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('BirthControlTypeCard', () => {
  it('renders the type name', () => {
    render(<BirthControlTypeCard birthControlType={mockType} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Put in Contraceptive Ring')).toBeInTheDocument()
  })

  it('shows Ring Insertion badge when vaginalRingInsertion is true', () => {
    render(<BirthControlTypeCard birthControlType={mockType} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Ring Insertion')).toBeInTheDocument()
  })

  it('shows Ring Removal badge when vaginalRingRemoval is true', () => {
    const removalType = { ...mockType, vaginalRingInsertion: false, vaginalRingRemoval: true }
    render(
      <BirthControlTypeCard birthControlType={removalType} onEdit={vi.fn()} onDelete={vi.fn()} />
    )
    expect(screen.getByText('Ring Removal')).toBeInTheDocument()
  })

  it('shows General Use badge when neither ring flag is set', () => {
    const generalType = { ...mockType, vaginalRingInsertion: false, vaginalRingRemoval: false }
    render(
      <BirthControlTypeCard birthControlType={generalType} onEdit={vi.fn()} onDelete={vi.fn()} />
    )
    expect(screen.getByText('General Use')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn()
    render(<BirthControlTypeCard birthControlType={mockType} onEdit={onEdit} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: `Edit ${mockType.name}` }))
    expect(onEdit).toHaveBeenCalledWith(mockType)
  })

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn()
    render(
      <BirthControlTypeCard birthControlType={mockType} onEdit={vi.fn()} onDelete={onDelete} />
    )
    fireEvent.click(screen.getByRole('button', { name: `Delete ${mockType.name}` }))
    expect(onDelete).toHaveBeenCalledWith(mockType)
  })
})
