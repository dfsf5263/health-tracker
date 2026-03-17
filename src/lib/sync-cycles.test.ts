import { describe, expect, it } from 'vitest'
import { db } from '@/test/mocks/db'
import { syncCycles } from './sync-cycles'

describe('syncCycles', () => {
  it('clears averages when no period days exist', async () => {
    db.periodDay.findMany.mockResolvedValue([])
    db.cycle.deleteMany.mockResolvedValue({ count: 0 })
    db.user.update.mockResolvedValue({} as never)

    await syncCycles('user-1')

    expect(db.cycle.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } })
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { averageCycleLength: null, averagePeriodLength: null },
    })
  })

  it('creates a single cycle from consecutive days', async () => {
    db.periodDay.findMany.mockResolvedValue([
      { date: new Date('2024-03-01') },
      { date: new Date('2024-03-02') },
      { date: new Date('2024-03-03') },
    ] as never)
    db.cycle.deleteMany.mockResolvedValue({ count: 0 })
    db.cycle.create.mockResolvedValue({} as never)
    db.user.update.mockResolvedValue({} as never)

    await syncCycles('user-1')

    // Should create exactly 1 cycle
    expect(db.cycle.create).toHaveBeenCalledTimes(1)
    expect(db.cycle.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-03'),
      },
    })
  })

  it('splits into multiple cycles with gaps > 3 days', async () => {
    db.periodDay.findMany.mockResolvedValue([
      { date: new Date('2024-01-01') },
      { date: new Date('2024-01-02') },
      { date: new Date('2024-01-03') },
      // Gap of 25 days
      { date: new Date('2024-01-28') },
      { date: new Date('2024-01-29') },
      { date: new Date('2024-01-30') },
    ] as never)
    db.cycle.deleteMany.mockResolvedValue({ count: 0 })
    db.cycle.create.mockResolvedValue({} as never)
    db.user.update.mockResolvedValue({} as never)

    await syncCycles('user-1')

    expect(db.cycle.create).toHaveBeenCalledTimes(2)
  })

  it('calculates correct average period length', async () => {
    // Two cycles: Jan 1-3 (3 days) and Jan 28-31 (4 days) → average = 3.5
    db.periodDay.findMany.mockResolvedValue([
      { date: new Date('2024-01-01') },
      { date: new Date('2024-01-02') },
      { date: new Date('2024-01-03') },
      { date: new Date('2024-01-28') },
      { date: new Date('2024-01-29') },
      { date: new Date('2024-01-30') },
      { date: new Date('2024-01-31') },
    ] as never)
    db.cycle.deleteMany.mockResolvedValue({ count: 0 })
    db.cycle.create.mockResolvedValue({} as never)
    db.user.update.mockResolvedValue({} as never)

    await syncCycles('user-1')

    const updateCall = db.user.update.mock.calls[0][0]
    // Period lengths: 3 days and 4 days → average = 3.5
    expect(updateCall.data.averagePeriodLength).toBe(3.5)
    // Cycle length: 27 days between starts
    expect(updateCall.data.averageCycleLength).toBe(27)
  })

  it('sets averageCycleLength to null with only one cycle', async () => {
    db.periodDay.findMany.mockResolvedValue([
      { date: new Date('2024-01-01') },
      { date: new Date('2024-01-02') },
    ] as never)
    db.cycle.deleteMany.mockResolvedValue({ count: 0 })
    db.cycle.create.mockResolvedValue({} as never)
    db.user.update.mockResolvedValue({} as never)

    await syncCycles('user-1')

    const updateCall = db.user.update.mock.calls[0][0]
    expect(updateCall.data.averageCycleLength).toBeNull()
    expect(updateCall.data.averagePeriodLength).toBe(2)
  })

  it('does not split cycle when gap is exactly 3 days', async () => {
    db.periodDay.findMany.mockResolvedValue([
      { date: new Date('2024-01-01') },
      { date: new Date('2024-01-04') }, // 3 days gap — should stay in same cycle
    ] as never)
    db.cycle.deleteMany.mockResolvedValue({ count: 0 })
    db.cycle.create.mockResolvedValue({} as never)
    db.user.update.mockResolvedValue({} as never)

    await syncCycles('user-1')

    expect(db.cycle.create).toHaveBeenCalledTimes(1)
  })

  it('splits cycle when gap exceeds 3 days', async () => {
    db.periodDay.findMany.mockResolvedValue([
      { date: new Date('2024-01-01') },
      { date: new Date('2024-01-05') }, // 4 days gap — new cycle
    ] as never)
    db.cycle.deleteMany.mockResolvedValue({ count: 0 })
    db.cycle.create.mockResolvedValue({} as never)
    db.user.update.mockResolvedValue({} as never)

    await syncCycles('user-1')

    expect(db.cycle.create).toHaveBeenCalledTimes(2)
  })
})
