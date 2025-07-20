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
import {
  Cycle,
  PeriodDay,
  Color,
  BirthControlDay,
  BirthControlType,
  IrregularPhysicalDay,
  IrregularPhysicalType,
  NormalPhysicalDay,
  NormalPhysicalType,
} from '@prisma/client'
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

interface BirthControlDayWithType extends BirthControlDay {
  type: BirthControlType
}

interface IrregularPhysicalDayWithType extends IrregularPhysicalDay {
  type: IrregularPhysicalType
}

interface NormalPhysicalDayWithType extends NormalPhysicalDay {
  type: NormalPhysicalType
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
    implemented: true,
  },
  {
    type: 'irregular-physical',
    label: 'Irregular Physical',
    icon: Activity,
    color: 'text-orange-500',
    implemented: true,
  },
  {
    type: 'normal-physical',
    label: 'Normal Physical',
    icon: Heart,
    color: 'text-green-500',
    implemented: true,
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
  const [birthControlDays, setBirthControlDays] = React.useState<BirthControlDayWithType[]>([])
  const [irregularPhysicalDays, setIrregularPhysicalDays] = React.useState<
    IrregularPhysicalDayWithType[]
  >([])
  const [normalPhysicalDays, setNormalPhysicalDays] = React.useState<NormalPhysicalDayWithType[]>(
    []
  )
  const [predictions, setPredictions] = React.useState<PredictionResult | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    fetchData()
  }, [refreshTrigger])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch cycles, period days, birth control days, irregular physical days, and normal physical days in parallel
      const [
        cyclesResponse,
        periodDaysResponse,
        birthControlDaysResponse,
        irregularPhysicalDaysResponse,
        normalPhysicalDaysResponse,
      ] = await Promise.all([
        fetch('/api/cycles'),
        fetch('/api/period-days'),
        fetch('/api/birth-control-days'),
        fetch('/api/irregular-physical-days'),
        fetch('/api/normal-physical-days'),
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

      if (birthControlDaysResponse.ok) {
        const birthControlDaysData = await birthControlDaysResponse.json()
        setBirthControlDays(birthControlDaysData)
      }

      if (irregularPhysicalDaysResponse.ok) {
        const irregularPhysicalDaysData = await irregularPhysicalDaysResponse.json()
        setIrregularPhysicalDays(irregularPhysicalDaysData)
      }

      if (normalPhysicalDaysResponse.ok) {
        const normalPhysicalDaysData = await normalPhysicalDaysResponse.json()
        setNormalPhysicalDays(normalPhysicalDaysData)
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

  const getBirthControlDays = (day: Date): BirthControlDayWithType[] => {
    return birthControlDays.filter((bcDay) => {
      const bcDate = new Date(bcDay.date)
      // Use UTC methods to avoid timezone conversion issues
      return (
        bcDate.getUTCFullYear() === day.getFullYear() &&
        bcDate.getUTCMonth() === day.getMonth() &&
        bcDate.getUTCDate() === day.getDate()
      )
    })
  }

  const getIrregularPhysicalDays = (day: Date): IrregularPhysicalDayWithType[] => {
    return irregularPhysicalDays.filter((ipDay) => {
      const ipDate = new Date(ipDay.date)
      // Use UTC methods to avoid timezone conversion issues
      return (
        ipDate.getUTCFullYear() === day.getFullYear() &&
        ipDate.getUTCMonth() === day.getMonth() &&
        ipDate.getUTCDate() === day.getDate()
      )
    })
  }

  const getNormalPhysicalDays = (day: Date): NormalPhysicalDayWithType[] => {
    return normalPhysicalDays.filter((npDay) => {
      const npDate = new Date(npDay.date)
      // Use UTC methods to avoid timezone conversion issues
      return (
        npDate.getUTCFullYear() === day.getFullYear() &&
        npDate.getUTCMonth() === day.getMonth() &&
        npDate.getUTCDate() === day.getDate()
      )
    })
  }

  const getEventsForDate = (selectedDate: Date | undefined, eventType: EventType) => {
    if (!selectedDate) return []

    switch (eventType) {
      case 'period':
        const periodDay = getPeriodDay(selectedDate)
        return periodDay ? [periodDay] : []
      case 'birth-control':
        return getBirthControlDays(selectedDate)
      case 'irregular-physical':
        return getIrregularPhysicalDays(selectedDate)
      case 'normal-physical':
        return getNormalPhysicalDays(selectedDate)
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
      } else if (eventType === 'birth-control') {
        router.push(`/dashboard/edit-birth-control-day?id=${eventId}`)
      } else if (eventType === 'irregular-physical') {
        router.push(`/dashboard/edit-irregular-physical-day?id=${eventId}`)
      } else if (eventType === 'normal-physical') {
        router.push(`/dashboard/edit-normal-physical-day?id=${eventId}`)
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
        let endpoint = ''
        if (config.type === 'period') {
          endpoint = `/api/period-days/${deletingId}`
        } else if (config.type === 'birth-control') {
          endpoint = `/api/birth-control-days/${deletingId}`
        } else if (config.type === 'irregular-physical') {
          endpoint = `/api/irregular-physical-days/${deletingId}`
        } else if (config.type === 'normal-physical') {
          endpoint = `/api/normal-physical-days/${deletingId}`
        }

        const response = await fetch(endpoint, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error(`Failed to delete ${config.label.toLowerCase()}`)
        }

        toast.success(`${config.label} deleted successfully`)
        setDeleteDialogOpen(false)
        fetchData() // Refresh the calendar data
      } catch (error) {
        console.error(`Error deleting ${config.label.toLowerCase()}:`, error)
        toast.error(`Failed to delete ${config.label.toLowerCase()}`)
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
            {config.type === 'birth-control' &&
              events.map((event) => {
                const bcDay = event as BirthControlDayWithType
                return (
                  <Card key={bcDay.id} className="p-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="text-xs">
                          <span className="text-muted-foreground">Type: </span>
                          <span>{bcDay.type.name}</span>
                        </div>
                        {(bcDay.type.vaginalRingInsertion || bcDay.type.vaginalRingRemoval) && (
                          <div className="flex gap-2">
                            {bcDay.type.vaginalRingInsertion && (
                              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                Ring Insertion
                              </span>
                            )}
                            {bcDay.type.vaginalRingRemoval && (
                              <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10">
                                Ring Removal
                              </span>
                            )}
                          </div>
                        )}
                        {bcDay.notes && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">Notes: </span>
                            <span>{bcDay.notes}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleEdit(bcDay.id, config.type)}
                        >
                          <PencilIcon className="h-3 w-3" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleDeleteClick(bcDay.id)}
                        >
                          <Trash2Icon className="h-3 w-3" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            {config.type === 'irregular-physical' &&
              events.map((event) => {
                const ipDay = event as IrregularPhysicalDayWithType
                return (
                  <Card key={ipDay.id} className="p-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="text-xs">
                          <span className="text-muted-foreground">Type: </span>
                          <span>{ipDay.type.name}</span>
                        </div>
                        {ipDay.notes && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">Notes: </span>
                            <span>{ipDay.notes}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleEdit(ipDay.id, config.type)}
                        >
                          <PencilIcon className="h-3 w-3" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleDeleteClick(ipDay.id)}
                        >
                          <Trash2Icon className="h-3 w-3" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            {config.type === 'normal-physical' &&
              events.map((event) => {
                const npDay = event as NormalPhysicalDayWithType
                return (
                  <Card key={npDay.id} className="p-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="text-xs">
                          <span className="text-muted-foreground">Type: </span>
                          <span>{npDay.type.name}</span>
                        </div>
                        {npDay.notes && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">Notes: </span>
                            <span>{npDay.notes}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleEdit(npDay.id, config.type)}
                        >
                          <PencilIcon className="h-3 w-3" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleDeleteClick(npDay.id)}
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
          title={`Delete ${config.label}`}
          description={`Are you sure you want to delete this ${config.label.toLowerCase()}? This action cannot be undone.`}
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
              const bcDays = getBirthControlDays(day.date)
              const ipDays = getIrregularPhysicalDays(day.date)
              const npDays = getNormalPhysicalDays(day.date)
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
                      {!modifiers.outside && bcDays.length > 0 && (
                        <>
                          {/* Desktop: Pill icon */}
                          <Pill className="hidden sm:block h-3 w-3 text-blue-500 fill-blue-500 mb-1" />
                          {/* Mobile: Square icon */}
                          <SquareIcon className="block sm:hidden rounded h-2 w-2 bg-blue-500 mb-1" />
                        </>
                      )}
                      {!modifiers.outside && ipDays.length > 0 && (
                        <>
                          {/* Desktop: Activity icon */}
                          <Activity className="hidden sm:block h-3 w-3 text-orange-500 fill-orange-500 mb-1" />
                          {/* Mobile: Square icon */}
                          <SquareIcon className="block sm:hidden rounded h-2 w-2 bg-orange-500 mb-1" />
                        </>
                      )}
                      {!modifiers.outside && npDays.length > 0 && (
                        <>
                          {/* Desktop: Heart icon */}
                          <Heart className="hidden sm:block h-3 w-3 text-green-500 fill-green-500 mb-1" />
                          {/* Mobile: Square icon */}
                          <SquareIcon className="block sm:hidden rounded h-2 w-2 bg-green-500 mb-1" />
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
