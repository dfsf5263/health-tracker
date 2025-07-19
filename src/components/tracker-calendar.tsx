'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { isWithinInterval } from 'date-fns'
import { PlusIcon, Droplet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CalendarDayButton, Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { Cycle, PeriodDay, Color } from '@prisma/client'
import { PredictionResult } from '@/lib/cycle-prediction'

interface TrackerCalendarProps {
  refreshTrigger?: number
}

export default function TrackerCalendar({ refreshTrigger }: TrackerCalendarProps) {
  const router = useRouter()
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [cycles, setCycles] = React.useState<Cycle[]>([])
  const [periodDays, setPeriodDays] = React.useState<PeriodDay[]>([])
  const [predictions, setPredictions] = React.useState<PredictionResult | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    fetchData()
  }, [refreshTrigger])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch cycles and period days in parallel
      const [cyclesResponse, periodDaysResponse] = await Promise.all([
        fetch('/api/cycles'),
        fetch('/api/period-days'),
      ])

      if (cyclesResponse.ok) {
        const cyclesData = await cyclesResponse.json()
        setCycles(cyclesData)

        // Fetch predictions if we have enough cycles
        if (cyclesData.length >= 3) {
          const predictionsResponse = await fetch('/api/cycles/predictions?count=6')
          if (predictionsResponse.ok) {
            const predictionsData = await predictionsResponse.json()
            setPredictions(predictionsData)
          }
        } else {
          setPredictions(null)
        }
      }

      if (periodDaysResponse.ok) {
        const periodDaysData = await periodDaysResponse.json()
        setPeriodDays(periodDaysData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const getPeriodDay = (day: Date): PeriodDay | null => {
    return (
      periodDays.find((periodDay) => {
        const periodDate = new Date(periodDay.date)
        // Use UTC methods to avoid timezone conversion issues
        return (
          periodDate.getUTCFullYear() === day.getFullYear() &&
          periodDate.getUTCMonth() === day.getMonth() &&
          periodDate.getUTCDate() === day.getDate()
        )
      }) || null
    )
  }

  const getDropletColor = (color: Color): string => {
    switch (color) {
      case Color.Red:
        return 'text-red-500 fill-red-500'
      case Color.Brown:
        return 'text-amber-700 fill-amber-700'
      default:
        return 'text-red-500 fill-red-500'
    }
  }

  const getSquareColor = (color: Color): string => {
    switch (color) {
      case Color.Red:
        return 'bg-red-500'
      case Color.Brown:
        return 'bg-amber-700'
      default:
        return 'bg-red-500'
    }
  }

  const SquareIcon = ({ className }: { className: string }) => <div className={className} />

  const isPredictedPeriodDay = (day: Date) => {
    if (!predictions) return false

    return predictions.predictions.some((prediction) => {
      const predictedStart = new Date(prediction.predictedDate)
      const predictedEnd = new Date(
        predictedStart.getTime() + (prediction.periodLength - 1) * 24 * 60 * 60 * 1000
      )

      return isWithinInterval(day, {
        start: predictedStart,
        end: predictedEnd,
      })
    })
  }

  const handleAddEvent = () => {
    router.push('/dashboard/add-event')
  }

  return (
    <Card className="w-full py-4">
      <CardContent className="px-4">
        <CalendarComponent
          mode="single"
          selected={date}
          onSelect={setDate}
          numberOfMonths={1}
          captionLayout="dropdown"
          className="w-full bg-transparent p-0"
          formatters={{
            formatMonthDropdown: (date) => {
              return date.toLocaleString('default', { month: 'long' })
            },
          }}
          components={{
            DayButton: ({ children, modifiers, day, ...props }) => {
              const periodDay = getPeriodDay(day.date)
              const isPredicted = !periodDay && isPredictedPeriodDay(day.date)

              return (
                <CalendarDayButton
                  day={day}
                  modifiers={modifiers}
                  className={isPredicted ? 'ring-1 ring-red-200 ring-dashed' : ''}
                  {...props}
                >
                  <div className="flex flex-col items-center w-full h-full pb-2">
                    <div className="flex-1 flex items-center justify-center">{children}</div>
                    <div className="flex items-center justify-center gap-0.5 min-h-[1rem]">
                      {!modifiers.outside && periodDay && (
                        <>
                          {/* Desktop: Droplet icons */}
                          <Droplet
                            className={`hidden sm:block h-3 w-3 ${getDropletColor(periodDay.color)} mb-1`}
                          />
                          {/* Mobile: Square icons */}
                          <SquareIcon
                            className={`block sm:hidden rounded h-2 w-2 ${getSquareColor(periodDay.color)} mb-1`}
                          />
                        </>
                      )}
                      {!modifiers.outside && isPredicted && (
                        <>
                          {/* Desktop: Droplet icons */}
                          <Droplet className="hidden sm:block h-3 w-3 text-red-300 opacity-60 mb-1" />
                          {/* Mobile: Square icons */}
                          <SquareIcon className="block sm:hidden rounded h-2 w-2 bg-red-300 opacity-60 mb-1" />
                        </>
                      )}
                    </div>
                  </div>
                </CalendarDayButton>
              )
            },
          }}
          required
        />
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-3 border-t px-4 !pt-4">
        <div className="flex w-full items-center justify-between px-1">
          <div className="text-sm font-medium">
            {date?.toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            title="Add Event"
            onClick={handleAddEvent}
          >
            <PlusIcon />
            <span className="sr-only">Add Event</span>
          </Button>
        </div>
        <div className="flex w-full flex-col gap-2">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading event data...</div>
          ) : periodDays.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No events tracked yet. Click the + button to add your first period day.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <Droplet className="h-3 w-3 text-red-500 fill-red-500" />
                  <span>Period days</span>
                </div>
                {predictions && (
                  <div className="flex items-center gap-1">
                    <Droplet className="h-3 w-3 text-red-300 opacity-60" />
                    <span>Predicted periods</span>
                  </div>
                )}
              </div>
              {cycles.length < 3 && (
                <div className="text-xs text-muted-foreground p-2 bg-muted rounded-md">
                  Add {3 - cycles.length} more cycle{3 - cycles.length !== 1 ? 's' : ''} to see
                  predictions
                </div>
              )}
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
