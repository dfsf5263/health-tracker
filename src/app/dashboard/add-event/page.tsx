'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel'
import { Progress } from '@/components/ui/progress'
import { PeriodDayForm, PeriodDayFormData } from '@/components/forms/period-day-form'
import { Droplet, Pill, Activity, Heart, Brain } from 'lucide-react'

type EventType = 'period' | 'birth-control' | 'irregular-physical' | 'normal-physical' | 'migraine'

const eventTypes = [
  { id: 'period' as EventType, label: 'Period', icon: Droplet, color: 'text-red-500' },
  { id: 'birth-control' as EventType, label: 'Birth Control', icon: Pill, color: 'text-blue-500' },
  {
    id: 'irregular-physical' as EventType,
    label: 'Irregular Physical Event',
    icon: Activity,
    color: 'text-orange-500',
  },
  {
    id: 'normal-physical' as EventType,
    label: 'Normal Physical Event',
    icon: Heart,
    color: 'text-green-500',
  },
  { id: 'migraine' as EventType, label: 'Migraine', icon: Brain, color: 'text-purple-500' },
]

const eventTypeToCarouselIndex: Record<EventType, number> = {
  period: 1,
  'birth-control': 2,
  'irregular-physical': 3,
  'normal-physical': 4,
  migraine: 5,
}

export default function AddEventPage() {
  const router = useRouter()
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  React.useEffect(() => {
    if (!api) {
      return
    }

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap())

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  const handleEventTypeSelect = (eventType: EventType) => {
    const index = eventTypeToCarouselIndex[eventType]
    api?.scrollTo(index)
  }

  const handlePeriodDaySubmit = async (data: PeriodDayFormData) => {
    try {
      const response = await fetch('/api/period-days', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: `${data.date.getFullYear()}-${String(data.date.getMonth() + 1).padStart(2, '0')}-${String(data.date.getDate()).padStart(2, '0')}`,
          flow: data.flow,
          color: data.color,
          notes: data.notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save period day')
      }

      toast.success('Period day saved successfully')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving period day:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save period day')
      throw error
    }
  }

  const progress = count > 0 ? ((current + 1) / count) * 100 : 0

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 flex items-center justify-center p-4">
        <Carousel
          setApi={setApi}
          className="w-full max-w-2xl"
          opts={{
            watchDrag: false,
          }}
        >
          <CarouselContent className="h-[calc(100vh-12rem)]">
            {/* Event Type Selection */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <div className="text-center space-y-6 py-4">
                    <h2 className="text-2xl font-semibold">What would you like to track?</h2>
                    <div className="grid gap-4 max-w-md mx-auto">
                      {eventTypes.map((type) => {
                        const Icon = type.icon
                        return (
                          <Button
                            key={type.id}
                            variant="outline"
                            size="lg"
                            className="w-full justify-start gap-3 h-auto py-4"
                            onClick={() => handleEventTypeSelect(type.id)}
                          >
                            <Icon className={cn('h-5 w-5', type.color)} />
                            <span className="text-left">{type.label}</span>
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>

            {/* Period Form */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <div className="w-full max-w-md space-y-6 py-4">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-semibold">Track Period Day</h2>
                      <p className="text-muted-foreground">
                        Record details about your period for this day
                      </p>
                    </div>
                    <PeriodDayForm
                      onSubmit={handlePeriodDaySubmit}
                      submitButtonText="Save Period Day"
                    />
                    <Button variant="ghost" className="w-full" onClick={() => api?.scrollTo(0)}>
                      Back to event types
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>

            {/* Birth Control Placeholder */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <div className="text-center space-y-4 py-4">
                    <Pill className="h-16 w-16 mx-auto text-blue-500" />
                    <h2 className="text-2xl font-semibold">Birth Control Tracking</h2>
                    <p className="text-muted-foreground">Coming soon!</p>
                    <Button variant="ghost" onClick={() => api?.scrollTo(0)}>
                      Back to event types
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>

            {/* Irregular Physical Event Placeholder */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <div className="text-center space-y-4 py-4">
                    <Activity className="h-16 w-16 mx-auto text-orange-500" />
                    <h2 className="text-2xl font-semibold">Irregular Physical Event</h2>
                    <p className="text-muted-foreground">Coming soon!</p>
                    <Button variant="ghost" onClick={() => api?.scrollTo(0)}>
                      Back to event types
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>

            {/* Normal Physical Event Placeholder */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <div className="text-center space-y-4 py-4">
                    <Heart className="h-16 w-16 mx-auto text-green-500" />
                    <h2 className="text-2xl font-semibold">Normal Physical Event</h2>
                    <p className="text-muted-foreground">Coming soon!</p>
                    <Button variant="ghost" onClick={() => api?.scrollTo(0)}>
                      Back to event types
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>

            {/* Migraine Placeholder */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <div className="text-center space-y-4 py-4">
                    <Brain className="h-16 w-16 mx-auto text-purple-500" />
                    <h2 className="text-2xl font-semibold">Migraine Tracking</h2>
                    <p className="text-muted-foreground">Coming soon!</p>
                    <Button variant="ghost" onClick={() => api?.scrollTo(0)}>
                      Back to event types
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </div>

      <div className="p-4 border-t">
        <Progress value={progress} className="w-full" />
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
