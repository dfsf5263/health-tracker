import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MigraineActivityTypeForm } from './migraine-activity-type-form'

describe('MigraineActivityTypeForm', () => {
  it('renders "Add" title when creating new type', () => {
    render(<MigraineActivityTypeForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByText('Add New Migraine Activity Type')).toBeInTheDocument()
  })

  it('renders "Edit" title when editing existing type', () => {
    render(
      <MigraineActivityTypeForm
        migraineActivityType={{ name: 'Missed Work' }}
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    )
    expect(screen.getByText('Edit Migraine Activity Type')).toBeInTheDocument()
  })

  it('populates name from existing type', () => {
    render(
      <MigraineActivityTypeForm
        migraineActivityType={{ name: 'Missed Work' }}
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    )
    expect(screen.getByLabelText('Type Name')).toHaveValue('Missed Work')
  })

  it('calls onSubmit with trimmed name', () => {
    const onSubmit = vi.fn()
    render(<MigraineActivityTypeForm open={true} onClose={vi.fn()} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Type Name'), {
      target: { value: '  Slower at Work  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create Type' }))

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Slower at Work' })
  })

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn()
    render(<MigraineActivityTypeForm open={true} onClose={onClose} onSubmit={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalled()
  })
})
