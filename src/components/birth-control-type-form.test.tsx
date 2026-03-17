import { describe, expect, it, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BirthControlTypeForm } from './birth-control-type-form'

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

describe('BirthControlTypeForm', () => {
  it('renders "Add" title when no birth control type', () => {
    render(<BirthControlTypeForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByText('Add New Birth Control Type')).toBeInTheDocument()
  })

  it('renders "Edit" title when editing existing type', () => {
    const existing = { name: 'Test', vaginalRingInsertion: false, vaginalRingRemoval: false }
    render(
      <BirthControlTypeForm
        birthControlType={existing}
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    )
    expect(screen.getByText('Edit Birth Control Type')).toBeInTheDocument()
  })

  it('populates form fields from existing type', () => {
    const existing = { name: 'Ring Insert', vaginalRingInsertion: true, vaginalRingRemoval: false }
    render(
      <BirthControlTypeForm
        birthControlType={existing}
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    )
    expect(screen.getByLabelText('Type Name')).toHaveValue('Ring Insert')
  })

  it('calls onSubmit with form data', () => {
    const onSubmit = vi.fn()
    render(<BirthControlTypeForm open={true} onClose={vi.fn()} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Type Name'), { target: { value: 'My Type' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Type' }))

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'My Type',
      vaginalRingInsertion: false,
      vaginalRingRemoval: false,
    })
  })

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn()
    render(<BirthControlTypeForm open={true} onClose={onClose} onSubmit={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('shows Update button when editing', () => {
    const existing = { name: 'Test', vaginalRingInsertion: false, vaginalRingRemoval: false }
    render(
      <BirthControlTypeForm
        birthControlType={existing}
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Update Type' })).toBeInTheDocument()
  })
})
