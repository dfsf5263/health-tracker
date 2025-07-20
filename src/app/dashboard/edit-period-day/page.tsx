'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { Progress } from '@/components/ui/progress'
import { PeriodDayForm, PeriodDayFormData } from '@/components/forms/period-day-form'
import { PeriodDay } from '@prisma/client'

function EditPeriodDayContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [periodDayData, setPeriodDayData] = useState<PeriodDayFormData | null>(null)

  const periodDayId = searchParams.get('id')

  // Load period day data
  useEffect(() => {
    if (!periodDayId) {
      toast.error('Invalid period day ID')
      router.push('/dashboard')
      return
    }

    const loadPeriodDay = async () => {
      try {
        const response = await fetch('/api/period-days')
        if (response.ok) {
          const periodDays = await response.json()
          const periodDay = periodDays.find((pd: PeriodDay) => pd.id === periodDayId)

          if (periodDay) {
            // Parse the UTC date correctly to avoid timezone issues
            const periodDate = new Date(periodDay.date)
            const localDate = new Date(
              periodDate.getUTCFullYear(),
              periodDate.getUTCMonth(),
              periodDate.getUTCDate()
            )

            setPeriodDayData({
              date: localDate,
              flow: periodDay.flow,
              color: periodDay.color,
              notes: periodDay.notes || undefined,
            })
          } else {
            toast.error('Period day not found')
            router.push('/dashboard')
          }
        } else {
          throw new Error('Failed to fetch period day')
        }
      } catch (error) {
        console.error('Error loading period day:', error)
        toast.error('Failed to load period day')
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    loadPeriodDay()
  }, [periodDayId, router])

  const handleSubmit = async (data: PeriodDayFormData) => {
    if (!periodDayId) return

    try {
      const response = await fetch(`/api/period-days/${periodDayId}`, {
        method: 'PUT',
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
        throw new Error(error.error || 'Failed to update period day')
      }

      toast.success('Period day updated successfully')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error updating period day:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update period day')
      throw error
    }
  }

  const handleBack = () => {
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center text-muted-foreground">Loading period day...</div>
      </div>
    )
  }

  if (!periodDayData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center text-muted-foreground">Period day not found</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 flex items-center justify-center p-4">
        <Carousel
          className="w-full max-w-2xl"
          opts={{
            watchDrag: false,
          }}
        >
          <CarouselContent className="h-[calc(100vh-12rem)]">
            {/* Period Form */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <div className="w-full max-w-md space-y-6 py-4">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-semibold">Edit Period Day</h2>
                      <p className="text-muted-foreground">
                        Update details about your period for this day
                      </p>
                    </div>
                    <PeriodDayForm
                      onSubmit={handleSubmit}
                      initialData={periodDayData}
                      submitButtonText="Update Period Day"
                    />
                    <Button variant="ghost" className="w-full" onClick={handleBack}>
                      Back to dashboard
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </div>

      <div className="p-4 border-t">
        <Progress value={50} className="w-full" />
      </div>
    </div>
  )
}

export default function EditPeriodDayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">Loading...</div>
      }
    >
      <EditPeriodDayContent />
    </Suspense>
  )
}
