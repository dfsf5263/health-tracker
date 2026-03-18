'use client'

import { AlertTriangle, Brain, Clock, Hash, Info, Lightbulb, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { apiFetch } from '@/lib/http-utils'

const RANGES = ['30d', '90d', '1y', '2y', '3y', 'all'] as const
type Range = (typeof RANGES)[number]

const RANGE_LABELS: Record<Range, string> = {
  '30d': '30 days',
  '90d': '90 days',
  '1y': '1 year',
  '2y': '2 years',
  '3y': '3 years',
  all: 'All time',
}

const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
]

interface NameCount {
  name: string
  count: number
}

interface AnalyticsData {
  summary: {
    total: number
    avgPainLevel: number
    avgDurationHours: number
  }
  topTriggers: NameCount[]
  attackTypes: NameCount[]
  symptoms: NameCount[]
  medications: NameCount[]
  reliefMethods: NameCount[]
  painLevelOverTime: { week: string; avgPainLevel: number }[]
  dayOfWeekDistribution: { day: string; count: number }[]
  timeOfDayDistribution: { block: string; count: number }[]
  periodStatusDistribution: { status: string; count: number }[]
  symptomCoOccurrence: { pair: string; count: number }[]
}

function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function generateInsights(data: AnalyticsData, sex: string): string[] {
  const insights: string[] = []

  if (data.topTriggers.length > 0) {
    insights.push(
      `Your most common trigger is "${data.topTriggers[0].name}" (${data.topTriggers[0].count} occurrences).`
    )
  }

  if (data.attackTypes.length > 0) {
    insights.push(
      `Most frequent attack type: "${data.attackTypes[0].name}" (${data.attackTypes[0].count} times).`
    )
  }

  if (data.symptoms.length >= 2) {
    insights.push(`Top symptoms: "${data.symptoms[0].name}" and "${data.symptoms[1].name}".`)
  } else if (data.symptoms.length === 1) {
    insights.push(`Most common symptom: "${data.symptoms[0].name}".`)
  }

  const worstDay = data.dayOfWeekDistribution.reduce(
    (max, d) => (d.count > max.count ? d : max),
    data.dayOfWeekDistribution[0]
  )
  if (worstDay && worstDay.count > 0) {
    insights.push(`${worstDay.day} is your worst day of the week (${worstDay.count} migraines).`)
  }

  if (sex !== 'Male' && data.periodStatusDistribution.length > 0) {
    const yesCount = data.periodStatusDistribution.find((p) => p.status === 'Yes')?.count ?? 0
    const totalWithStatus = data.periodStatusDistribution.reduce((s, p) => s + p.count, 0)
    if (totalWithStatus > 0) {
      const pct = Math.round((yesCount / totalWithStatus) * 100)
      insights.push(`${pct}% of your migraines occurred during your period.`)
    }
  }

  return insights
}

export default function MigraineBreakdownPage() {
  const [range, setRange] = useState<Range>('90d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [sex, setSex] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      const { data: profile } = await apiFetch<{ sex: string }>('/api/user/profile')
      if (profile) setSex(profile.sex)
    }
    loadProfile()
  }, [])

  const fetchData = useCallback(async (r: Range) => {
    setIsLoading(true)
    setError(null)
    const params = r === 'all' ? '' : `?range=${r}`
    const { data: analyticsData, error: fetchError } = await apiFetch<AnalyticsData>(
      `/api/migraines/analytics${params}`
    )
    if (fetchError || !analyticsData) {
      setError(fetchError || 'Failed to load migraine analytics')
    } else {
      setData(analyticsData)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchData(range)
  }, [range, fetchData])

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-4 pt-6">
        <Skeleton className="h-10 w-80" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ))}
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

  if (!data || data.summary.total === 0) {
    return (
      <div className="flex-1 space-y-6 p-4 pt-6">
        <RangeFilter range={range} onRangeChange={setRange} />
        <div className="flex items-center justify-center p-8">
          <Card className="max-w-md">
            <CardHeader className="text-center">
              <Brain className="mx-auto h-12 w-12 text-muted-foreground" />
              <CardTitle>No Migraines Recorded</CardTitle>
              <CardDescription>
                Start tracking your migraines to see analytics and insights here.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  const insights = generateInsights(data, sex)

  return (
    <div className="flex-1 space-y-6 p-4 pt-6">
      <RangeFilter range={range} onRangeChange={setRange} />

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="gap-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Migraines</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.total}</div>
            <p className="text-xs text-muted-foreground">In the last {RANGE_LABELS[range]}</p>
          </CardContent>
        </Card>

        <Card className="gap-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Pain Level</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.avgPainLevel}/10</div>
            <p className="text-xs text-muted-foreground">Average severity</p>
          </CardContent>
        </Card>

        <Card className="gap-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.avgDurationHours > 0
                ? formatDuration(data.summary.avgDurationHours)
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Average migraine length</p>
          </CardContent>
        </Card>
      </div>

      {/* Key Findings */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <CardTitle>Key Findings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.map((insight) => (
                <li key={insight} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {insight}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Charts grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Triggers */}
        {data.topTriggers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Triggers</CardTitle>
              <CardDescription>Most common migraine triggers</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={data.topTriggers.slice(0, 8)}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {data.topTriggers.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Attack Types */}
        {data.attackTypes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Attack Types</CardTitle>
              <CardDescription>Breakdown by attack type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.attackTypes}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {data.attackTypes.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 justify-center">
                {data.attackTypes.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs">
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    {item.name} ({item.count})
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pain Level Trend */}
        {data.painLevelOverTime.length > 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Pain Level Trend</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-64 text-xs">
                    Each point is one week&apos;s average pain level. The time range controls how
                    far back the trend goes.
                  </TooltipContent>
                </Tooltip>
              </div>
              <CardDescription>Weekly average pain level</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.painLevelOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => {
                      const d = new Date(String(v))
                      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }}
                  />
                  <YAxis domain={[0, 10]} width={30} />
                  <RechartsTooltip
                    labelFormatter={(v) => {
                      const d = new Date(String(v))
                      return `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgPainLevel"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Avg Pain"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Day of Week */}
        <Card>
          <CardHeader>
            <CardTitle>Day of Week</CardTitle>
            <CardDescription>When migraines occur most</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.dayOfWeekDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tickFormatter={(v) => String(v).slice(0, 3)} />
                <YAxis allowDecimals={false} width={30} />
                <RechartsTooltip />
                <Bar dataKey="count" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time of Day */}
        <Card>
          <CardHeader>
            <CardTitle>Time of Day</CardTitle>
            <CardDescription>Onset time distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.timeOfDayDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="block" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} width={30} />
                <RechartsTooltip />
                <Bar dataKey="count" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Period Status Correlation (Female only) */}
        {sex !== 'Male' && data.periodStatusDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Period Status Correlation</CardTitle>
              <CardDescription>Migraines relative to your period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.periodStatusDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {data.periodStatusDistribution.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 justify-center">
                {data.periodStatusDistribution.map((item, i) => (
                  <div key={item.status} className="flex items-center gap-1.5 text-xs">
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    {item.status} ({item.count})
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Symptom Co-occurrence */}
      {data.symptomCoOccurrence.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Symptom Co-occurrence</CardTitle>
            <CardDescription>Symptoms that frequently appear together</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.symptomCoOccurrence.map((item) => (
                <div key={item.pair} className="flex items-center justify-between">
                  <span className="text-sm">{item.pair}</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${Math.max(
                          20,
                          (item.count / data.symptomCoOccurrence[0].count) * 120
                        )}px`,
                      }}
                    />
                    <span className="text-sm font-medium tabular-nums w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function RangeFilter({
  range,
  onRangeChange,
}: {
  range: Range
  onRangeChange: (r: Range) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {RANGES.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onRangeChange(r)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            range === r
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {RANGE_LABELS[r]}
        </button>
      ))}
    </div>
  )
}
