'use client'

import { Activity, Calendar, Clock, Hash } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { apiFetch } from '@/lib/http-utils'

interface PeriodDay {
  id: string
  date: string
  flow: string
  color: string
  notes?: string
}

interface Cycle {
  id: string
  startDate: string
  endDate: string
  periodDays: PeriodDay[]
}

interface AnalyticsData {
  averages: {
    cycleLength: number | null
    periodLength: number | null
  }
  totalCycles: number
  lastSixCycles: Cycle[]
}

export default function CycleTrackingPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data: analyticsData, error: fetchError } =
          await apiFetch<AnalyticsData>('/api/analytics')
        if (fetchError || !analyticsData) {
          setError(fetchError || 'Failed to load analytics')
          return
        }
        setData(analyticsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-4 pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Analytics</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card>
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>Start tracking your period to see analytics</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="gap-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Cycle Length</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.averages.cycleLength ? `${data.averages.cycleLength.toFixed(1)} days` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Time between cycle starts</p>
          </CardContent>
        </Card>

        <Card className="gap-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Period Length</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.averages.periodLength ? `${data.averages.periodLength.toFixed(1)} days` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Duration of periods</p>
          </CardContent>
        </Card>

        <Card className="gap-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cycles</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCycles}</div>
            <p className="text-xs text-muted-foreground">Cycles tracked</p>
          </CardContent>
        </Card>

        <Card className="gap-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Cycle</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.lastSixCycles.length > 0
                ? new Date(data.lastSixCycles[0].startDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Most recent cycle start</p>
          </CardContent>
        </Card>
      </div>

      {/* Last 6 Cycles Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Cycles</CardTitle>
          <CardDescription>Your last 6 menstrual cycles with daily flow patterns</CardDescription>
        </CardHeader>
        <CardContent>
          {data.lastSixCycles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No cycles found. Start tracking your period to see cycle patterns.
            </p>
          ) : (
            <div className="space-y-6">
              {data.lastSixCycles.map((cycle, index) => (
                <div key={cycle.id} className="border-l-2 border-muted pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">Cycle {data.lastSixCycles.length - index}</h3>
                    <span className="text-sm text-muted-foreground">
                      {new Date(cycle.startDate).toLocaleDateString()} -{' '}
                      {new Date(cycle.endDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {(() => {
                      const startDate = new Date(cycle.startDate)
                      const endDate = new Date(cycle.endDate)
                      const days = []

                      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                        const currentDate = new Date(d)
                        const dateString = currentDate.toISOString().split('T')[0]
                        const periodDay = cycle.periodDays.find(
                          (pd) => pd.date.split('T')[0] === dateString
                        )

                        days.push(
                          <div
                            key={dateString}
                            className={`w-6 h-6 rounded border text-xs flex items-center justify-center relative ${
                              periodDay
                                ? getFlowColor(periodDay.color)
                                : 'bg-transparent border-gray-300'
                            }`}
                            title={
                              periodDay
                                ? `${currentDate.toLocaleDateString()}: ${periodDay.flow} (${periodDay.color})`
                                : `${currentDate.toLocaleDateString()}: No flow`
                            }
                          >
                            {periodDay && (
                              <div
                                className={`rounded-full bg-white ${getFlowCircleSize(periodDay.flow)}`}
                              />
                            )}
                          </div>
                        )
                      }

                      return days
                    })()}
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground">
                    {cycle.periodDays.length} days with flow
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function getFlowColor(color: string): string {
  const isRed = color === 'Red'
  return isRed ? 'bg-red-500 border-red-600' : 'bg-amber-700 border-amber-800'
}

function getFlowCircleSize(flow: string): string {
  switch (flow) {
    case 'Spotting':
      return 'w-1 h-1'
    case 'Light':
      return 'w-1.5 h-1.5'
    case 'Medium':
      return 'w-2.5 h-2.5'
    case 'Heavy':
      return 'w-3.5 h-3.5'
    case 'SuperHeavy':
      return 'w-4 h-4'
    default:
      return ''
  }
}
