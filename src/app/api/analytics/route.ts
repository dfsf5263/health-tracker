import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: {
        id: true,
        averageCycleLength: true,
        averagePeriodLength: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get last 6 cycles
    const cycles = await prisma.cycle.findMany({
      where: { userId: user.id },
      orderBy: { startDate: 'desc' },
      take: 6,
    })

    // Get all period days for the last 6 cycles
    const cycleIds = cycles.map(cycle => cycle.id)
    const periodDays = await prisma.periodDay.findMany({
      where: {
        userId: user.id,
        date: {
          gte: cycles.length > 0 ? cycles[cycles.length - 1].startDate : new Date(),
          lte: cycles.length > 0 ? cycles[0].endDate : new Date(),
        },
      },
      orderBy: { date: 'asc' },
    })

    // Get total cycle count
    const totalCycles = await prisma.cycle.count({
      where: { userId: user.id },
    })

    const analytics = {
      averages: {
        cycleLength: user.averageCycleLength,
        periodLength: user.averagePeriodLength,
      },
      totalCycles,
      lastSixCycles: cycles.map(cycle => ({
        id: cycle.id,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        periodDays: periodDays.filter(
          pd => pd.date >= cycle.startDate && pd.date <= cycle.endDate
        ),
      })),
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}