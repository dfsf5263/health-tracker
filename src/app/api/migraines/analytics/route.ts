import { NextRequest, NextResponse } from 'next/server'
import { ApiError } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-middleware'
import { logApiError } from '@/lib/error-logger'
import { withApiLogging } from '@/lib/middleware/with-api-logging'
import { prisma } from '@/lib/prisma'

const RANGE_MAP: Record<string, number> = {
  '30d': 30,
  '90d': 90,
  '1y': 365,
  '2y': 730,
  '3y': 1095,
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function countByName(
  migraines: MigraineWithRelations[],
  extractor: (m: MigraineWithRelations) => string[]
): { name: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const m of migraines) {
    for (const name of extractor(m)) {
      counts.set(name, (counts.get(name) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

type MigraineWithRelations = Awaited<ReturnType<typeof queryMigraines>>[number]

async function queryMigraines(userId: string, startDate?: Date) {
  return prisma.migraine.findMany({
    where: {
      userId,
      ...(startDate && { startDateTime: { gte: startDate } }),
    },
    include: {
      migraineMigraineAttackTypes: {
        include: { migraineAttackType: true },
      },
      migraineMigraineSymptomTypes: {
        include: { migraineSymptomType: true },
      },
      migraineMigraineTriggerTypes: {
        include: { migraineTriggerType: true },
      },
      migraineMigraineMedicationTypes: {
        include: { migraineMedicationType: true },
      },
      migraineMigraineReliefTypes: {
        include: { migraineReliefType: true },
      },
      migraineMigraineActivityTypes: {
        include: { migraineActivityType: true },
      },
      migraineMigraineLocationTypes: {
        include: { migraineLocationType: true },
      },
    },
    orderBy: { startDateTime: 'asc' },
  })
}

export const GET = withApiLogging(async (request: NextRequest) => {
  let userId: string | null = null

  try {
    const authContext = await requireAuth()
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { userId: authUserId, user } = authContext
    userId = authUserId

    const range = request.nextUrl.searchParams.get('range') ?? '90d'
    const days = RANGE_MAP[range]
    const startDate = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : undefined

    const migraines = await queryMigraines(user.id, startDate)

    // Summary
    const total = migraines.length
    const avgPainLevel = total > 0 ? migraines.reduce((sum, m) => sum + m.painLevel, 0) / total : 0

    const durationsHours = migraines
      .filter((m) => m.endDateTime)
      .map(
        (m) =>
          (new Date(m.endDateTime!).getTime() - new Date(m.startDateTime).getTime()) /
          (1000 * 60 * 60)
      )
    const avgDurationHours =
      durationsHours.length > 0
        ? durationsHours.reduce((sum, d) => sum + d, 0) / durationsHours.length
        : 0

    // Breakdowns
    const topTriggers = countByName(migraines, (m) =>
      m.migraineMigraineTriggerTypes.map((r) => r.migraineTriggerType.name)
    )
    const attackTypes = countByName(migraines, (m) =>
      m.migraineMigraineAttackTypes.map((r) => r.migraineAttackType.name)
    )
    const symptoms = countByName(migraines, (m) =>
      m.migraineMigraineSymptomTypes.map((r) => r.migraineSymptomType.name)
    )
    const medications = countByName(migraines, (m) =>
      m.migraineMigraineMedicationTypes.map((r) => r.migraineMedicationType.name)
    )
    const reliefMethods = countByName(migraines, (m) =>
      m.migraineMigraineReliefTypes.map((r) => r.migraineReliefType.name)
    )

    // Pain level over time — weekly averages
    const painLevelOverTime: { week: string; avgPainLevel: number }[] = []
    if (total > 0) {
      const weekMap = new Map<string, number[]>()
      for (const m of migraines) {
        const d = new Date(m.startDateTime)
        const weekStart = new Date(d)
        weekStart.setUTCDate(d.getUTCDate() - d.getUTCDay())
        weekStart.setUTCHours(0, 0, 0, 0)
        const key = weekStart.toISOString().split('T')[0]
        const arr = weekMap.get(key) ?? []
        arr.push(m.painLevel)
        weekMap.set(key, arr)
      }
      for (const [week, levels] of weekMap) {
        painLevelOverTime.push({
          week,
          avgPainLevel: Math.round((levels.reduce((s, l) => s + l, 0) / levels.length) * 10) / 10,
        })
      }
      painLevelOverTime.sort((a, b) => a.week.localeCompare(b.week))
    }

    // Day of week distribution
    const dayOfWeekCounts = Array.from({ length: 7 }, () => 0)
    for (const m of migraines) {
      dayOfWeekCounts[new Date(m.startDateTime).getDay()]++
    }
    const dayOfWeekDistribution = DAY_NAMES.map((day, i) => ({
      day,
      count: dayOfWeekCounts[i],
    }))

    // Time of day distribution (4-hour blocks)
    const timeBlocks = ['12–4a', '4–8a', '8–12p', '12–4p', '4–8p', '8–12a']
    const timeCounts = Array.from({ length: 6 }, () => 0)
    for (const m of migraines) {
      const hour = new Date(m.startDateTime).getHours()
      timeCounts[Math.floor(hour / 4)]++
    }
    const timeOfDayDistribution = timeBlocks.map((block, i) => ({
      block,
      count: timeCounts[i],
    }))

    // Period status distribution
    const periodStatusCounts = new Map<string, number>()
    for (const m of migraines) {
      if (m.periodStatus) {
        periodStatusCounts.set(m.periodStatus, (periodStatusCounts.get(m.periodStatus) ?? 0) + 1)
      }
    }
    const periodStatusDistribution = [...periodStatusCounts.entries()]
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count)

    // Symptom co-occurrence (top pairs)
    const pairCounts = new Map<string, number>()
    for (const m of migraines) {
      const names = m.migraineMigraineSymptomTypes.map((s) => s.migraineSymptomType.name).sort()
      for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
          const key = `${names[i]} + ${names[j]}`
          pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1)
        }
      }
    }
    const symptomCoOccurrence = [...pairCounts.entries()]
      .map(([pair, count]) => ({ pair, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    return NextResponse.json({
      summary: {
        total,
        avgPainLevel: Math.round(avgPainLevel * 10) / 10,
        avgDurationHours: Math.round(avgDurationHours * 10) / 10,
      },
      topTriggers,
      attackTypes,
      symptoms,
      medications,
      reliefMethods,
      painLevelOverTime,
      dayOfWeekDistribution,
      timeOfDayDistribution,
      periodStatusDistribution,
      symptomCoOccurrence,
    })
  } catch (error) {
    await logApiError({
      request,
      error,
      operation: 'fetching migraine analytics',
      context: { userId },
    })
    return ApiError.internal('fetch migraine analytics')
  }
})
