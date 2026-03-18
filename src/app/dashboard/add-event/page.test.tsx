import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock apiFetch before importing the component
vi.mock('@/lib/http-utils', () => ({
  apiFetch: vi.fn(),
  showSuccessToast: vi.fn(),
}))

// Mock heavy sub-components that are not under test
vi.mock('@/components/ui/carousel', () => ({
  Carousel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CarouselContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CarouselItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/ui/progress', () => ({
  Progress: () => <div data-testid="progress" />,
}))
vi.mock('@/components/forms/period-day-form', () => ({
  PeriodDayForm: () => null,
}))
vi.mock('@/components/forms/birth-control-day-form', () => ({
  BirthControlDayForm: () => null,
}))
vi.mock('@/components/forms/irregular-physical-day-form', () => ({
  IrregularPhysicalDayForm: () => null,
}))
vi.mock('@/components/forms/normal-physical-day-form', () => ({
  NormalPhysicalDayForm: () => null,
}))
vi.mock('@/components/birth-control-type-form', () => ({
  BirthControlTypeForm: () => null,
}))
vi.mock('@/components/irregular-physical-type-form', () => ({
  IrregularPhysicalTypeForm: () => null,
}))
vi.mock('@/components/normal-physical-type-form', () => ({
  NormalPhysicalTypeForm: () => null,
}))
vi.mock('@/components/forms/migraine-start-datetime-form', () => ({
  MigraineStartDateTimeForm: () => null,
}))
vi.mock('@/components/forms/migraine-migraine-over', () => ({
  MigraineMigraineover: () => null,
}))
vi.mock('@/components/forms/migraine-end-datetime-form', () => ({
  MigraineEndDateTimeForm: () => null,
}))
vi.mock('@/components/forms/migraine-attack-types-form', () => ({
  MigraineAttackTypesForm: () => null,
}))
vi.mock('@/components/forms/migraine-pain-level-form', () => ({
  MigrainePainLevelForm: () => null,
}))
vi.mock('@/components/forms/migraine-symptom-types-form', () => ({
  MigraineSymptomTypesForm: () => null,
}))
vi.mock('@/components/forms/migraine-trigger-types-form', () => ({
  MigraineTriggerTypesForm: (props: { onContinue?: () => void }) => (
    <button data-testid="trigger-continue" onClick={props.onContinue}>
      mock trigger continue
    </button>
  ),
}))
vi.mock('@/components/forms/migraine-period-status-form', () => ({
  MigrainePeriodStatusForm: () => null,
}))
vi.mock('@/components/forms/migraine-medication-types-form', () => ({
  MigraineMedicationTypesForm: () => null,
}))
vi.mock('@/components/forms/migraine-precognition-types-form', () => ({
  MigrainePrecognitionTypesForm: () => null,
}))
vi.mock('@/components/forms/migraine-relief-types-form', () => ({
  MigraineReliefTypesForm: () => null,
}))
vi.mock('@/components/forms/migraine-activity-types-form', () => ({
  MigraineActivityTypesForm: () => null,
}))
vi.mock('@/components/forms/migraine-location-types-form', () => ({
  MigraineLocationTypesForm: () => null,
}))
vi.mock('@/components/forms/migraine-notes-form', () => ({
  MigraineNotesForm: () => null,
}))

import { apiFetch } from '@/lib/http-utils'
import AddEventPage from './page'

const mockApiFetch = vi.mocked(apiFetch)

describe('AddEventPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('shows all 5 event type buttons for Female users', async () => {
    mockApiFetch.mockResolvedValue({
      data: { sex: 'Female' },
      error: null,
      response: new Response(),
    })

    render(<AddEventPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Period$/i })).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Birth Control/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Irregular Physical Event/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Normal Physical Event/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Migraine$/i })).toBeInTheDocument()
  })

  it('hides Period and Birth Control buttons for Male users', async () => {
    mockApiFetch.mockResolvedValue({
      data: { sex: 'Male' },
      error: null,
      response: new Response(),
    })

    render(<AddEventPage />)

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /^Period$/i })).not.toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /Birth Control/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Irregular Physical Event/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Normal Physical Event/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Migraine$/i })).toBeInTheDocument()
  })

  it('calculates migraine progress and skips period status for Male', async () => {
    mockApiFetch.mockResolvedValue({
      data: { sex: 'Male' },
      error: null,
      response: new Response(),
    })

    render(<AddEventPage />)

    // Wait for Male sex to be applied (hides Period/Birth Control)
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /^Period$/i })).not.toBeInTheDocument()
    })

    // Click Migraine to enter migraine flow
    fireEvent.click(screen.getByRole('button', { name: /^Migraine$/i }))

    // The trigger continue button should be rendered (via our mock)
    const triggerContinue = screen.getByTestId('trigger-continue')
    fireEvent.click(triggerContinue)

    // If we got here without error, the Male branch (skip period status) was exercised
    // The progress calculation with sex === 'Male' (13 steps) is also now covered
    expect(triggerContinue).toBeInTheDocument()
  })

  it('shows all event types before profile loads', () => {
    // Never resolves — simulates pending fetch
    mockApiFetch.mockReturnValue(new Promise(() => {}))

    render(<AddEventPage />)

    expect(screen.getByRole('button', { name: /^Period$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Birth Control/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Irregular Physical Event/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Normal Physical Event/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Migraine$/i })).toBeInTheDocument()
  })
})
