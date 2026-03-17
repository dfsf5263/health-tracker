import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DeleteConfirmationDialog } from './delete-confirmation-dialog'

describe('DeleteConfirmationDialog', () => {
  it('renders title and description when open', () => {
    render(
      <DeleteConfirmationDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete Item"
        description="Are you sure you want to delete this?"
      />
    )

    expect(screen.getByText('Delete Item')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to delete this?')).toBeInTheDocument()
  })

  it('shows Cancel and Delete buttons', () => {
    render(
      <DeleteConfirmationDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete"
        description="Confirm?"
      />
    )

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('calls onConfirm when Delete is clicked', () => {
    const onConfirm = vi.fn()
    render(
      <DeleteConfirmationDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        title="Delete"
        description="Confirm?"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onOpenChange(false) when Cancel is clicked', () => {
    const onOpenChange = vi.fn()
    render(
      <DeleteConfirmationDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={vi.fn()}
        title="Delete"
        description="Confirm?"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows "Deleting..." and disables buttons when isDeleting', () => {
    render(
      <DeleteConfirmationDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete"
        description="Confirm?"
        isDeleting={true}
      />
    )

    expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })
})
