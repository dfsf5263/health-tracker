import { describe, expect, it } from 'vitest'
import { getPageTitle } from './route-titles'

describe('getPageTitle', () => {
  it('returns correct title for known routes', () => {
    expect(getPageTitle('/dashboard')).toBe('Dashboard')
    expect(getPageTitle('/dashboard/analytics')).toBe('Analytics')
    expect(getPageTitle('/dashboard/add-event')).toBe('Add Event')
    expect(getPageTitle('/dashboard/settings')).toBe('Settings')
    expect(getPageTitle('/dashboard/settings/profile')).toBe('Profile Settings')
  })

  it('returns correct title for edit routes', () => {
    expect(getPageTitle('/dashboard/edit-period-day')).toBe('Edit Period Day')
    expect(getPageTitle('/dashboard/edit-birth-control-day')).toBe('Edit Birth Control Day')
    expect(getPageTitle('/dashboard/edit-irregular-physical-day')).toBe(
      'Edit Irregular Physical Day'
    )
    expect(getPageTitle('/dashboard/edit-normal-physical-day')).toBe('Edit Normal Physical Day')
    expect(getPageTitle('/dashboard/edit-migraine')).toBe('Edit Migraine')
  })

  it('returns Dashboard as fallback for unknown routes', () => {
    expect(getPageTitle('/unknown')).toBe('Dashboard')
    expect(getPageTitle('/dashboard/nonexistent')).toBe('Dashboard')
    expect(getPageTitle('')).toBe('Dashboard')
  })

  it('returns correct title for manage event types', () => {
    expect(getPageTitle('/dashboard/manage-event-types')).toBe('Manage Event Types')
  })
})
