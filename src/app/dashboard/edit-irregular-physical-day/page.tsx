'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { Progress } from '@/components/ui/progress'
import {
  IrregularPhysicalDayForm,
  IrregularPhysicalDayFormData,
} from '@/components/forms/irregular-physical-day-form'
import { IrregularPhysicalTypeForm } from '@/components/irregular-physical-type-form'
import { IrregularPhysicalDay, IrregularPhysicalType } from '@prisma/client'

interface IrregularPhysicalDayWithType extends IrregularPhysicalDay {
  type: IrregularPhysicalType
}

// Define type for API response that has dates as strings
interface IrregularPhysicalTypeResponse {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

function EditIrregularPhysicalDayContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [irregularPhysicalDayData, setIrregularPhysicalDayData] =
    useState<IrregularPhysicalDayFormData | null>(null)
  const [irregularPhysicalTypes, setIrregularPhysicalTypes] = useState<
    IrregularPhysicalTypeResponse[]
  >([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [irregularPhysicalFormOpen, setIrregularPhysicalFormOpen] = useState(false)
  const [selectedIrregularPhysicalType, setSelectedIrregularPhysicalType] = useState<
    IrregularPhysicalTypeResponse | undefined
  >(undefined)

  const irregularPhysicalDayId = searchParams.get('id')

  // Load irregular physical day data
  useEffect(() => {
    if (!irregularPhysicalDayId) {
      toast.error('Invalid irregular physical day ID')
      router.push('/dashboard')
      return
    }

    const loadIrregularPhysicalDay = async () => {
      try {
        // Fetch both irregular physical day and types in parallel
        const [dayResponse, typesResponse] = await Promise.all([
          fetch(`/api/irregular-physical-days/${irregularPhysicalDayId}`),
          fetch('/api/irregular-physical-types'),
        ])

        if (!dayResponse.ok) {
          if (dayResponse.status === 404) {
            toast.error('Irregular physical day not found')
          } else {
            throw new Error('Failed to fetch irregular physical day')
          }
          router.push('/dashboard')
          return
        }

        if (typesResponse.ok) {
          const typesData = await typesResponse.json()
          setIrregularPhysicalTypes(typesData)
        }

        const irregularPhysicalDay: IrregularPhysicalDayWithType = await dayResponse.json()

        // Parse the UTC date correctly to avoid timezone issues
        const ipDate = new Date(irregularPhysicalDay.date)
        const localDate = new Date(
          ipDate.getUTCFullYear(),
          ipDate.getUTCMonth(),
          ipDate.getUTCDate()
        )

        setIrregularPhysicalDayData({
          date: localDate,
          typeId: irregularPhysicalDay.typeId,
          notes: irregularPhysicalDay.notes || undefined,
        })
      } catch (error) {
        console.error('Error loading irregular physical day:', error)
        toast.error('Failed to load irregular physical day')
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
        setLoadingTypes(false)
      }
    }

    loadIrregularPhysicalDay()
  }, [irregularPhysicalDayId, router])

  const handleSubmit = async (data: IrregularPhysicalDayFormData) => {
    if (!irregularPhysicalDayId) return

    try {
      const response = await fetch(`/api/irregular-physical-days/${irregularPhysicalDayId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: `${data.date.getFullYear()}-${String(data.date.getMonth() + 1).padStart(2, '0')}-${String(data.date.getDate()).padStart(2, '0')}`,
          typeId: data.typeId,
          notes: data.notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update irregular physical day')
      }

      toast.success('Irregular physical day updated successfully')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error updating irregular physical day:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to update irregular physical day'
      )
      throw error
    }
  }

  const handleBack = () => {
    router.push('/dashboard')
  }

  const handleCreateNewType = () => {
    setSelectedIrregularPhysicalType(undefined)
    setIrregularPhysicalFormOpen(true)
  }

  const handleIrregularPhysicalTypeFormClose = () => {
    setIrregularPhysicalFormOpen(false)
    setSelectedIrregularPhysicalType(undefined)
  }

  const handleIrregularPhysicalTypeFormSubmit = async (
    formData: Omit<IrregularPhysicalTypeResponse, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      const response = await fetch('/api/irregular-physical-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create irregular physical type')
      }

      const newType = await response.json()
      setIrregularPhysicalTypes((prev) => [...prev, newType])
      setIrregularPhysicalFormOpen(false)
      setSelectedIrregularPhysicalType(undefined)
      toast.success('Irregular physical type created successfully')
    } catch (error) {
      console.error('Error creating irregular physical type:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to create irregular physical type'
      )
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center text-muted-foreground">Loading irregular physical day...</div>
      </div>
    )
  }

  if (!irregularPhysicalDayData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center text-muted-foreground">Irregular physical day not found</div>
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
            {/* Irregular Physical Form */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <div className="w-full max-w-md space-y-6 py-4">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-semibold">Edit Irregular Physical Day</h2>
                      <p className="text-muted-foreground">
                        Update details about your irregular physical event for this day
                      </p>
                    </div>
                    <IrregularPhysicalDayForm
                      onSubmit={handleSubmit}
                      onCreateNewType={handleCreateNewType}
                      irregularPhysicalTypes={irregularPhysicalTypes}
                      isLoadingTypes={loadingTypes}
                      initialData={irregularPhysicalDayData}
                      submitButtonText="Update Irregular Physical Day"
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

      <IrregularPhysicalTypeForm
        irregularPhysicalType={selectedIrregularPhysicalType}
        open={irregularPhysicalFormOpen}
        onClose={handleIrregularPhysicalTypeFormClose}
        onSubmit={handleIrregularPhysicalTypeFormSubmit}
      />
    </div>
  )
}

export default function EditIrregularPhysicalDayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">Loading...</div>
      }
    >
      <EditIrregularPhysicalDayContent />
    </Suspense>
  )
}
