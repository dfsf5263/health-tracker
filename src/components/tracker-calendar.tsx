'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { isWithinInterval } from 'date-fns'
import {
  PlusIcon,
  Droplet,
  Pill,
  Activity,
  Heart,
  Brain,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CalendarDayButton, Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { Cycle, PeriodDay, Color } from '@prisma/client'
import { PredictionResult } from '@/lib/cycle-prediction'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'

type EventType = 'period' | 'birth-control' | 'irregular-physical' | 'normal-physical' | 'migraine'

interface EventTypeConfig {
  type: EventType
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  implemented: boolean
}

const eventTypeConfigs: EventTypeConfig[] = [
  {
    type: 'period',
    label: 'Period',
    icon: Droplet,
    color: 'text-red-500',
    implemented: true,
  },
  {
    type: 'birth-control',
    label: 'Birth Control',
    icon: Pill,
    color: 'text-blue-500',
    implemented: false,
  },
  {
    type: 'irregular-physical',
    label: 'Irregular Physical',
    icon: Activity,
    color: 'text-orange-500',
    implemented: false,
  },
  {
    type: 'normal-physical',
    label: 'Normal Physical',
    icon: Heart,
    color: 'text-green-500',
    implemented: false,
  },
  {
    type: 'migraine',
    label: 'Migraine',
    icon: Brain,
    color: 'text-purple-500',
    implemented: false,
  },
]

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

  const getEventsForDate = (selectedDate: Date | undefined, eventType: EventType) => {
    if (!selectedDate) return []

    switch (eventType) {
      case 'period':
        const periodDay = getPeriodDay(selectedDate)
        return periodDay ? [periodDay] : []
      case 'birth-control':
      case 'irregular-physical':
      case 'normal-physical':
      case 'migraine':
        // Placeholder: return empty array for unimplemented types
        return []
      default:
        return []
    }
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

  const EventSection = ({
    config,
    selectedDate,
  }: {
    config: EventTypeConfig
    selectedDate: Date | undefined
  }) => {
    const Icon = config.icon
    const events = getEventsForDate(selectedDate, config.type)
    const hasEvents = events.length > 0
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
    const [deletingId, setDeletingId] = React.useState<string | null>(null)
    const [isDeleting, setIsDeleting] = React.useState(false)

    const handleEdit = (eventId: string, eventType: EventType) => {
      if (eventType === 'period') {
        router.push(`/dashboard/edit-period-day?id=${eventId}`)
      } else {
        // For future event types, add their specific edit routes here
        toast.error('Edit functionality for this event type is not implemented yet')
      }
    }

    const handleDeleteClick = (eventId: string) => {
      setDeletingId(eventId)
      setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
      if (!deletingId) return

      setIsDeleting(true)
      try {
        const response = await fetch(`/api/period-days/${deletingId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to delete period day')
        }

        toast.success('Period day deleted successfully')
        setDeleteDialogOpen(false)
        fetchData() // Refresh the calendar data
      } catch (error) {
        console.error('Error deleting period day:', error)
        toast.error('Failed to delete period day')
      } finally {
        setIsDeleting(false)
        setDeletingId(null)
      }
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-3 w-3 ${config.color}`} />
          <span className="text-xs font-medium">{config.label}</span>
        </div>

        {!config.implemented ? (
          <div className="text-xs text-muted-foreground ml-5">Coming soon</div>
        ) : hasEvents ? (
          <div className="space-y-2">
            {config.type === 'period' &&
              events.map((event) => {
                const periodDay = event as PeriodDay
                return (
                  <Card key={periodDay.id} className="p-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="text-xs">
                          <span className="text-muted-foreground">Flow: </span>
                          <span className="capitalize">
                            {periodDay.flow === 'SuperHeavy'
                              ? 'Super Heavy'
                              : periodDay.flow.toLowerCase()}
                          </span>
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground">Color: </span>
                          <span className="capitalize">{periodDay.color.toLowerCase()}</span>
                        </div>
                        {periodDay.notes && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">Notes: </span>
                            <span>{periodDay.notes}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleEdit(periodDay.id, config.type)}
                        >
                          <PencilIcon className="h-3 w-3" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleDeleteClick(periodDay.id)}
                        >
                          <Trash2Icon className="h-3 w-3" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground ml-5">
            No {config.label.toLowerCase()} events
          </div>
        )}

        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          title="Delete Period Day"
          description="Are you sure you want to delete this period day? This action cannot be undone."
          isDeleting={isDeleting}
        />
      </div>
    )
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
        <div className="flex w-full flex-col gap-3">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading event data...</div>
          ) : !date ? (
            <div className="text-sm text-muted-foreground">Select a date to see events</div>
          ) : (
            <>
              {/* Events for Selected Date */}
              <div className="space-y-3">
                {eventTypeConfigs.map((config) => (
                  <EventSection key={config.type} config={config} selectedDate={date} />
                ))}
              </div>

              {/* Legend and Help */}
              <div className="border-t pt-3 space-y-2">
                {predictions && (
                  <div className="flex items-center gap-1 text-xs">
                    <Droplet className="h-3 w-3 text-red-300 opacity-60" />
                    <span className="text-muted-foreground">
                      Predicted periods shown on calendar
                    </span>
                  </div>
                )}
                {cycles.length < 3 && (
                  <div className="text-xs text-muted-foreground p-2 bg-muted rounded-md">
                    Add {3 - cycles.length} more cycle{3 - cycles.length !== 1 ? 's' : ''} to see
                    predictions
                  </div>
                )}
                {periodDays.length === 0 && (
                  <div className="text-xs text-muted-foreground p-2 bg-muted rounded-md">
                    No events tracked yet. Click the + button to add your first event.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
