import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MigraineActivityTypeCard } from './migraine-activity-type-card'

const mockType = {
  id: 'type-1',
  userId: 'user-1',
  name: 'Missed Work',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('MigraineActivityTypeCard', () => {
  it('renders the type name', () => {
    render(
      <MigraineActivityTypeCard
        migraineActivityType={mockType}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(screen.getByText('Missed Work')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn()
    render(
      <MigraineActivityTypeCard
        migraineActivityType={mockType}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: `Edit ${mockType.name}` }))
    expect(onEdit).toHaveBeenCalledWith(mockType)
  })

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn()
    render(
      <MigraineActivityTypeCard
        migraineActivityType={mockType}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: `Delete ${mockType.name}` }))
    expect(onDelete).toHaveBeenCalledWith(mockType)
  })
})
