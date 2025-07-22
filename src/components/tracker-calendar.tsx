'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  PlusIcon,
  Droplet,
  Pill,
  Activity,
  Heart,
  Brain,
  PencilIcon,
  Trash2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  RectangleVertical,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CalendarDayButton, Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiFetch, showSuccessToast } from '@/lib/http-utils'
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
  Migraine,
} from '@prisma/client'
import { PredictionResult } from '@/lib/cycle-prediction'
import { RingPredictionResult } from '@/lib/ring-prediction'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { MigraineWithRelationships } from '@/lib/types'

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

// Separate component for migraine card to properly handle React state
function MigraineCard({
  migraine,
  onEdit,
  onDelete,
}: {
  migraine: MigraineWithRelationships
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  const getPainDescription = (level: number): string => {
    if (level <= 2) return 'Mild'
    if (level <= 4) return 'Moderate'
    if (level <= 6) return 'Noticeable'
    if (level <= 8) return 'Severe'
    return 'Extreme'
  }

  const formatDuration = (start: Date, end?: Date): string => {
    if (!end) return 'Ongoing'
    const startDate = start.toLocaleDateString()
    const endDate = end.toLocaleDateString()
    return startDate === endDate ? 'Single day' : `${startDate} - ${endDate}`
  }

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Card key={migraine.id} className="p-3">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 space-y-2">
          {/* Core Info - Always Visible */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Pain Level: {migraine.painLevel}/10 ({getPainDescription(migraine.painLevel)})
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Duration:{' '}
              {formatDuration(
                new Date(migraine.startDateTime),
                migraine.endDateTime ? new Date(migraine.endDateTime) : undefined
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Started: {formatTime(new Date(migraine.startDateTime))}
              {migraine.endDateTime && ` • Ended: ${formatTime(new Date(migraine.endDateTime))}`}
            </div>
          </div>

          {/* Expandable Details */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 px-2 text-xs"
            >
              {isExpanded ? (
                <>
                  <ChevronDownIcon className="h-3 w-3 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronRightIcon className="h-3 w-3 mr-1" />
                  Show Details
                </>
              )}
            </Button>

            {isExpanded && (
              <div className="mt-2 space-y-3 border-t pt-2">
                {/* Attack Types */}
                {migraine.migraineMigraineAttackTypes.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Attack Types:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {migraine.migraineMigraineAttackTypes.map((rel) => (
                        <Badge
                          key={rel.migraineAttackType.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {rel.migraineAttackType.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Symptoms */}
                {migraine.migraineMigraineSymptomTypes.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Symptoms:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {migraine.migraineMigraineSymptomTypes.map((rel) => (
                        <Badge
                          key={rel.migraineSymptomType.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {rel.migraineSymptomType.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Triggers */}
                {migraine.migraineMigraineTriggerTypes.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Triggers:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {migraine.migraineMigraineTriggerTypes.map((rel) => (
                        <Badge
                          key={rel.migraineTriggerType.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {rel.migraineTriggerType.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Precognitions */}
                {migraine.migraineMigrainePrecognitionTypes.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Early Signs:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {migraine.migraineMigrainePrecognitionTypes.map((rel) => (
                        <Badge
                          key={rel.migrainePrecognitionType.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {rel.migrainePrecognitionType.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medications */}
                {migraine.migraineMigraineMedicationTypes.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Medications:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {migraine.migraineMigraineMedicationTypes.map((rel) => (
                        <Badge
                          key={rel.migraineMedicationType.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {rel.migraineMedicationType.name}
                          {rel.dosageModifier !== 1 && ` (${rel.dosageModifier}x)`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Relief Methods */}
                {migraine.migraineMigraineReliefTypes.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">
                      Relief Methods:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {migraine.migraineMigraineReliefTypes.map((rel) => (
                        <Badge
                          key={rel.migraineReliefType.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {rel.migraineReliefType.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activity Impact */}
                {migraine.migraineMigraineActivityTypes.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">
                      Activity Impact:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {migraine.migraineMigraineActivityTypes.map((rel) => (
                        <Badge
                          key={rel.migraineActivityType.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {rel.migraineActivityType.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pain Locations */}
                {migraine.migraineMigraineLocationTypes.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">
                      Pain Locations:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {migraine.migraineMigraineLocationTypes.map((rel) => (
                        <Badge
                          key={rel.migraineLocationType.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {rel.migraineLocationType.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Period Status */}
                {migraine.periodStatus && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">
                      Period Status:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {migraine.periodStatus}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Geographic Location */}
                {migraine.geographicLocation && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Location:</span>
                    <span className="text-xs ml-2">{migraine.geographicLocation}</span>
                  </div>
                )}

                {/* Notes */}
                {migraine.notes && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Notes:</span>
                    <div className="text-xs mt-1 bg-muted/50 p-2 rounded">{migraine.notes}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onEdit(migraine.id)}
          >
            <PencilIcon className="h-3 w-3" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onDelete(migraine.id)}
          >
            <Trash2Icon className="h-3 w-3" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </div>
    </Card>
  )
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
    implemented: true,
  },
]

interface TrackerCalendarProps {
  refreshTrigger?: number
  onLoadingChange?: (isLoading: boolean) => void
}

export default function TrackerCalendar({ refreshTrigger, onLoadingChange }: TrackerCalendarProps) {
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
  const [migraines, setMigraines] = React.useState<Migraine[]>([])
  const [predictions, setPredictions] = React.useState<PredictionResult | null>(null)
  const [ringPredictions, setRingPredictions] = React.useState<RingPredictionResult | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    onLoadingChange?.(true)
    try {
      // Fetch cycles, period days, birth control days, irregular physical days, normal physical days, and migraines in parallel
      const [
        { data: cyclesData, error: cyclesError },
        { data: periodDaysData, error: periodDaysError },
        { data: birthControlDaysData, error: birthControlDaysError },
        { data: irregularPhysicalDaysData, error: irregularPhysicalDaysError },
        { data: normalPhysicalDaysData, error: normalPhysicalDaysError },
        { data: migrainesData, error: migrainesError },
      ] = await Promise.all([
        apiFetch<Cycle[]>('/api/cycles'),
        apiFetch<PeriodDay[]>('/api/period-days'),
        apiFetch<BirthControlDayWithType[]>('/api/birth-control-days'),
        apiFetch<IrregularPhysicalDayWithType[]>('/api/irregular-physical-days'),
        apiFetch<NormalPhysicalDayWithType[]>('/api/normal-physical-days'),
        apiFetch<MigraineWithRelationships[]>('/api/migraines'),
      ])

      if (!cyclesError && cyclesData) {
        setCycles(cyclesData)

        // Fetch predictions if we have enough cycles
        if (cyclesData.length >= 3) {
          const { data: predictionsData, error: predictionsError } =
            await apiFetch<PredictionResult>('/api/cycles/predictions?count=6')
          if (!predictionsError && predictionsData) {
            setPredictions(predictionsData)
          }
        } else {
          setPredictions(null)
        }
      }

      if (!periodDaysError && periodDaysData) {
        setPeriodDays(periodDaysData)
      }

      if (!birthControlDaysError && birthControlDaysData) {
        setBirthControlDays(birthControlDaysData)

        // Fetch ring predictions if we have birth control data
        const { data: ringPredictionsData, error: ringPredictionsError } =
          await apiFetch<RingPredictionResult>('/api/birth-control/ring-predictions')
        if (!ringPredictionsError && ringPredictionsData) {
          setRingPredictions(ringPredictionsData)
        } else {
          setRingPredictions(null)
        }
      }

      if (!irregularPhysicalDaysError && irregularPhysicalDaysData) {
        setIrregularPhysicalDays(irregularPhysicalDaysData)
      }

      if (!normalPhysicalDaysError && normalPhysicalDaysData) {
        setNormalPhysicalDays(normalPhysicalDaysData)
      }

      if (!migrainesError && migrainesData) {
        setMigraines(migrainesData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      // Individual API errors are already shown by apiFetch, this is for unexpected errors
    } finally {
      setIsLoading(false)
      onLoadingChange?.(false)
    }
  }, [onLoadingChange])

  React.useEffect(() => {
    fetchData()
  }, [refreshTrigger, fetchData])

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

  const getMigraines = (day: Date): Migraine[] => {
    return migraines.filter((migraine) => {
      const startDate = new Date(migraine.startDateTime)

      // If no end date, only show on start date
      if (!migraine.endDateTime) {
        return (
          startDate.getFullYear() === day.getFullYear() &&
          startDate.getMonth() === day.getMonth() &&
          startDate.getDate() === day.getDate()
        )
      }

      // If has end date, show on all days in range
      const endDate = new Date(migraine.endDateTime)

      // Use day-level comparison to handle same-day migraines properly
      const dayYear = day.getFullYear()
      const dayMonth = day.getMonth()
      const dayDate = day.getDate()

      const startYear = startDate.getFullYear()
      const startMonth = startDate.getMonth()
      const startDay = startDate.getDate()

      const endYear = endDate.getFullYear()
      const endMonth = endDate.getMonth()
      const endDay = endDate.getDate()

      // Convert to comparable numbers (YYYYMMDD format)
      const dayNum = dayYear * 10000 + dayMonth * 100 + dayDate
      const startNum = startYear * 10000 + startMonth * 100 + startDay
      const endNum = endYear * 10000 + endMonth * 100 + endDay

      return dayNum >= startNum && dayNum <= endNum
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
        return getMigraines(selectedDate)
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

  const isPredictedPeriodDay = (day: Date) => {
    if (!predictions) return false

    return predictions.predictions.some((prediction) => {
      const predictedStart = new Date(prediction.predictedDate)
      const predictedEnd = new Date(
        predictedStart.getTime() + (prediction.periodLength - 1) * 24 * 60 * 60 * 1000
      )

      // Use day-level comparison for predicted period dates
      const dayYear = day.getFullYear()
      const dayMonth = day.getMonth()
      const dayDate = day.getDate()

      const startYear = predictedStart.getFullYear()
      const startMonth = predictedStart.getMonth()
      const startDay = predictedStart.getDate()

      const endYear = predictedEnd.getFullYear()
      const endMonth = predictedEnd.getMonth()
      const endDay = predictedEnd.getDate()

      // Convert to comparable numbers (YYYYMMDD format)
      const dayNum = dayYear * 10000 + dayMonth * 100 + dayDate
      const startNum = startYear * 10000 + startMonth * 100 + startDay
      const endNum = endYear * 10000 + endMonth * 100 + endDay

      return dayNum >= startNum && dayNum <= endNum
    })
  }

  const isPredictedRingDay = (day: Date) => {
    if (!ringPredictions?.prediction) return false

    const predictedDate = new Date(ringPredictions.prediction.predictedDate)

    // Use day-level comparison for predicted ring dates
    const dayYear = day.getFullYear()
    const dayMonth = day.getMonth()
    const dayDate = day.getDate()

    const predictedYear = predictedDate.getFullYear()
    const predictedMonth = predictedDate.getMonth()
    const predictedDay = predictedDate.getDate()

    return dayYear === predictedYear && dayMonth === predictedMonth && dayDate === predictedDay
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
      console.log('Tracker calendar - handling edit:', { eventId, eventType })

      if (eventType === 'period') {
        router.push(`/dashboard/edit-period-day?id=${eventId}`)
      } else if (eventType === 'birth-control') {
        router.push(`/dashboard/edit-birth-control-day?id=${eventId}`)
      } else if (eventType === 'irregular-physical') {
        router.push(`/dashboard/edit-irregular-physical-day?id=${eventId}`)
      } else if (eventType === 'normal-physical') {
        router.push(`/dashboard/edit-normal-physical-day?id=${eventId}`)
      } else if (eventType === 'migraine') {
        const url = `/dashboard/edit-migraine?id=${eventId}`
        console.log('Navigating to migraine edit:', url)
        router.push(url)
      } else {
        // For future event types, add their specific edit routes here
        console.warn('Edit functionality for this event type is not implemented yet')
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
        } else if (config.type === 'migraine') {
          endpoint = `/api/migraines/${deletingId}`
        }

        const { data: deletedItem, error } = await apiFetch(endpoint, {
          method: 'DELETE',
        })

        if (error || !deletedItem) {
          // Error toast is automatically shown by apiFetch
          throw new Error(error || `Failed to delete ${config.label.toLowerCase()}`)
        }

        showSuccessToast(`${config.label} deleted successfully`)
        setDeleteDialogOpen(false)
        fetchData() // Refresh the calendar data
      } catch (error) {
        console.error(`Error deleting ${config.label.toLowerCase()}:`, error)
        // Error toast is already shown by apiFetch or our custom error above
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
            {config.type === 'migraine' &&
              events.map((event) => (
                <MigraineCard
                  key={event.id}
                  migraine={event as MigraineWithRelationships}
                  onEdit={(id) => handleEdit(id, config.type)}
                  onDelete={handleDeleteClick}
                />
              ))}
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
    <Card className="w-fit">
      <CardContent className="px-4 py-4">
        <CalendarComponent
          mode="single"
          selected={date}
          onSelect={setDate}
          numberOfMonths={1}
          captionLayout="dropdown"
          className="w-full bg-transparent p-0 [--cell-size:--spacing(12)] sm:[--cell-size:--spacing(13)] md:[--cell-size:--spacing(15)] lg:[--cell-size:--spacing(24)] xl:[--cell-size:--spacing(33)] 2xl:[--cell-size:--spacing(35)]"
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
              const migraineDays = getMigraines(day.date)
              const isPredicted = !periodDay && isPredictedPeriodDay(day.date)
              const isPredictedRing = isPredictedRingDay(day.date)

              return (
                <CalendarDayButton
                  day={day}
                  modifiers={modifiers}
                  className={`${isPredicted ? 'ring-1 ring-red-200 ring-dashed' : ''} ${isPredictedRing ? 'ring-1 ring-blue-200 ring-dashed' : ''}`}
                  {...props}
                >
                  {children}
                  <div className="flex items-center justify-center">
                    {!modifiers.outside && periodDay && (
                      <>
                        {/* Desktop: Droplet icons */}
                        <Droplet
                          className={`hidden sm:block h-3 w-3 ${getDropletColor(periodDay.color)}`}
                        />
                        {/* Mobile: Rectangle icons */}
                        <RectangleVertical
                          className={`block sm:hidden size-1.5 ${getDropletColor(periodDay.color)}`}
                        />
                      </>
                    )}
                    {!modifiers.outside && isPredicted && (
                      <>
                        {/* Desktop: Droplet icons */}
                        <Droplet className="hidden sm:block h-3 w-3 text-red-300 opacity-60" />
                        {/* Mobile: Rectangle icons */}
                        <RectangleVertical className="block sm:hidden size-1.5 text-red-300 fill-red-300 opacity-60" />
                      </>
                    )}
                    {!modifiers.outside && isPredictedRing && (
                      <>
                        {/* Desktop: Pill icon for predicted ring events */}
                        <Pill className="hidden sm:block h-3 w-3 text-blue-300 opacity-60" />
                        {/* Mobile: Rectangle icon for predicted ring events */}
                        <RectangleVertical className="block sm:hidden size-1.5 text-blue-300 fill-blue-300 opacity-60" />
                      </>
                    )}
                    {!modifiers.outside && bcDays.length > 0 && (
                      <>
                        {/* Desktop: Pill icon */}
                        <Pill className="hidden sm:block h-3 w-3 text-blue-500 fill-blue-500" />
                        {/* Mobile: Rectangle icon */}
                        <RectangleVertical className="block sm:hidden size-1.5 text-blue-500 fill-blue-500" />
                      </>
                    )}
                    {!modifiers.outside && ipDays.length > 0 && (
                      <>
                        {/* Desktop: Activity icon */}
                        <Activity className="hidden sm:block h-3 w-3 text-orange-500 fill-orange-500" />
                        {/* Mobile: Rectangle icon */}
                        <RectangleVertical className="block sm:hidden size-1.5 text-orange-500 fill-orange-500" />
                      </>
                    )}
                    {!modifiers.outside && npDays.length > 0 && (
                      <>
                        {/* Desktop: Heart icon */}
                        <Heart className="hidden sm:block h-3 w-3 text-green-500 fill-green-500" />
                        {/* Mobile: Rectangle icon */}
                        <RectangleVertical className="block sm:hidden size-1.5 text-green-500 fill-green-500" />
                      </>
                    )}
                    {!modifiers.outside && migraineDays.length > 0 && (
                      <>
                        {/* Desktop: Brain icon */}
                        <Brain className="hidden sm:block h-3 w-3 text-purple-500 fill-purple-500" />
                        {/* Mobile: Rectangle icon */}
                        <RectangleVertical className="block sm:hidden size-1.5 text-purple-500 fill-purple-500" />
                      </>
                    )}
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
                {ringPredictions?.prediction && (
                  <div className="flex items-center gap-1 text-xs">
                    <Pill className="h-3 w-3 text-blue-300 opacity-60" />
                    <span className="text-muted-foreground">
                      Predicted ring {ringPredictions.prediction.eventType} shown on calendar
                    </span>
                  </div>
                )}
                {cycles.length < 3 && (
                  <div className="text-xs text-muted-foreground p-2 bg-muted rounded-md">
                    Add {3 - cycles.length} more cycle{3 - cycles.length !== 1 ? 's' : ''} to see
                    predictions
                  </div>
                )}
                {ringPredictions && ringPredictions.basedOnEvents === 0 && (
                  <div className="text-xs text-muted-foreground p-2 bg-muted rounded-md">
                    Add birth control ring events to see ring predictions
                  </div>
                )}
                {ringPredictions &&
                  ringPredictions.basedOnEvents > 0 &&
                  !ringPredictions.prediction && (
                    <div className="text-xs text-muted-foreground p-2 bg-muted rounded-md">
                      Configure ring schedule in settings to see ring predictions
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
