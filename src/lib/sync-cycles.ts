import { prisma } from '@/lib/prisma'
import { differenceInDays } from 'date-fns'

export async function syncCycles(userId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.cycle.deleteMany({
      where: { userId },
    })

    const periodDays = await tx.periodDay.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    })

    if (periodDays.length === 0) {
      // No period days, clear averages
      await tx.user.update({
        where: { id: userId },
        data: {
          averageCycleLength: null,
          averagePeriodLength: null,
        },
      })
      return
    }

    const cycles: Array<{ startDate: Date; endDate: Date }> = []
    let currentCycleStart = periodDays[0].date
    let lastDate = periodDays[0].date

    for (let i = 1; i < periodDays.length; i++) {
      const currentDate = periodDays[i].date
      const daysDiff = Math.floor(
        (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysDiff > 1) {
        cycles.push({
          startDate: currentCycleStart,
          endDate: lastDate,
        })
        currentCycleStart = currentDate
      }

      lastDate = currentDate
    }

    cycles.push({
      startDate: currentCycleStart,
      endDate: lastDate,
    })

    // Create cycles in database
    for (const cycle of cycles) {
      await tx.cycle.create({
        data: {
          userId,
          startDate: cycle.startDate,
          endDate: cycle.endDate,
        },
      })
    }

    // Calculate averages
    let averageCycleLength: number | null = null
    let averagePeriodLength: number | null = null

    // Calculate average period length (days from start to end of each cycle)
    if (cycles.length > 0) {
      const periodLengths = cycles.map(
        (cycle) => differenceInDays(cycle.endDate, cycle.startDate) + 1
      )
      averagePeriodLength = periodLengths.reduce((sum, len) => sum + len, 0) / periodLengths.length
    }

    // Calculate average cycle length (days between consecutive cycle starts)
    if (cycles.length > 1) {
      const cycleLengths: number[] = []
      for (let i = 0; i < cycles.length - 1; i++) {
        const currentStart = cycles[i].startDate
        const nextStart = cycles[i + 1].startDate
        cycleLengths.push(differenceInDays(nextStart, currentStart))
      }
      averageCycleLength = cycleLengths.reduce((sum, len) => sum + len, 0) / cycleLengths.length
    }

    // Update user with calculated averages
    await tx.user.update({
      where: { id: userId },
      data: {
        averageCycleLength,
        averagePeriodLength,
      },
    })
  })
}
