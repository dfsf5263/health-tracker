'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { Progress } from '@/components/ui/progress'
import {
  NormalPhysicalDayForm,
  NormalPhysicalDayFormData,
} from '@/components/forms/normal-physical-day-form'
import { NormalPhysicalTypeForm } from '@/components/normal-physical-type-form'
import { NormalPhysicalDay, NormalPhysicalType } from '@prisma/client'
import { apiFetch, showSuccessToast } from '@/lib/http-utils'

interface NormalPhysicalDayWithType extends NormalPhysicalDay {
  type: NormalPhysicalType
}

// Define type for API response that has dates as strings
interface NormalPhysicalTypeResponse {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

function EditNormalPhysicalDayContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [normalPhysicalDayData, setNormalPhysicalDayData] =
    useState<NormalPhysicalDayFormData | null>(null)
  const [normalPhysicalTypes, setNormalPhysicalTypes] = useState<NormalPhysicalTypeResponse[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [normalPhysicalFormOpen, setNormalPhysicalFormOpen] = useState(false)
  const [selectedNormalPhysicalType, setSelectedNormalPhysicalType] = useState<
    NormalPhysicalTypeResponse | undefined
  >(undefined)

  const normalPhysicalDayId = searchParams.get('id')

  // Load normal physical day data
  useEffect(() => {
    if (!normalPhysicalDayId) {
      toast.error('Invalid normal physical day ID')
      router.push('/dashboard')
      return
    }

    const loadNormalPhysicalDay = async () => {
      try {
        // Fetch both normal physical day and types in parallel
        const [
          { data: normalPhysicalDay, error: dayError },
          { data: typesData, error: typesError },
        ] = await Promise.all([
          apiFetch<NormalPhysicalDayWithType>(`/api/normal-physical-days/${normalPhysicalDayId}`),
          apiFetch<NormalPhysicalTypeResponse[]>('/api/normal-physical-types'),
        ])

        if (dayError || !normalPhysicalDay) {
          // Error toast is automatically shown by apiFetch
          router.push('/dashboard')
          return
        }

        if (!typesError && typesData) {
          setNormalPhysicalTypes(typesData)
        }

        // Parse the UTC date correctly to avoid timezone issues
        const npDate = new Date(normalPhysicalDay.date)
        const localDate = new Date(
          npDate.getUTCFullYear(),
          npDate.getUTCMonth(),
          npDate.getUTCDate()
        )

        setNormalPhysicalDayData({
          date: localDate,
          typeId: normalPhysicalDay.typeId,
          notes: normalPhysicalDay.notes || undefined,
        })
      } catch (error) {
        console.error('Error loading normal physical day:', error)
        toast.error('Failed to load normal physical day')
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
        setLoadingTypes(false)
      }
    }

    loadNormalPhysicalDay()
  }, [normalPhysicalDayId, router])

  const handleSubmit = async (data: NormalPhysicalDayFormData) => {
    if (!normalPhysicalDayId) return

    const { data: updatedDay, error } = await apiFetch(
      `/api/normal-physical-days/${normalPhysicalDayId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: `${data.date.getFullYear()}-${String(data.date.getMonth() + 1).padStart(2, '0')}-${String(data.date.getDate()).padStart(2, '0')}`,
          typeId: data.typeId,
          notes: data.notes,
        }),
      }
    )

    if (error || !updatedDay) {
      // Error toast is automatically shown by apiFetch
      throw new Error(error || 'Failed to update normal physical day')
    }

    showSuccessToast('Normal physical day updated successfully')
    router.push('/dashboard')
  }

  const handleBack = () => {
    router.push('/dashboard')
  }

  const handleCreateNewType = () => {
    setSelectedNormalPhysicalType(undefined)
    setNormalPhysicalFormOpen(true)
  }

  const handleNormalPhysicalTypeFormClose = () => {
    setNormalPhysicalFormOpen(false)
    setSelectedNormalPhysicalType(undefined)
  }

  const handleNormalPhysicalTypeFormSubmit = async (
    formData: Omit<NormalPhysicalTypeResponse, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    const { data: newType, error } = await apiFetch<NormalPhysicalTypeResponse>(
      '/api/normal-physical-types',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      }
    )

    if (error || !newType) {
      // Error toast is automatically shown by apiFetch
      throw new Error(error || 'Failed to create normal physical type')
    }

    setNormalPhysicalTypes((prev) => [...prev, newType])
    setNormalPhysicalFormOpen(false)
    setSelectedNormalPhysicalType(undefined)
    showSuccessToast('Normal physical type created successfully')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center text-muted-foreground">Loading normal physical day...</div>
      </div>
    )
  }

  if (!normalPhysicalDayData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center text-muted-foreground">Normal physical day not found</div>
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
            {/* Normal Physical Form */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <div className="w-full max-w-md space-y-6 py-4">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-semibold">Edit Normal Physical Day</h2>
                      <p className="text-muted-foreground">
                        Update details about your normal physical event for this day
                      </p>
                    </div>
                    <NormalPhysicalDayForm
                      onSubmit={handleSubmit}
                      onCreateNewType={handleCreateNewType}
                      normalPhysicalTypes={normalPhysicalTypes}
                      isLoadingTypes={loadingTypes}
                      initialData={normalPhysicalDayData}
                      submitButtonText="Update Normal Physical Day"
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

      <NormalPhysicalTypeForm
        normalPhysicalType={selectedNormalPhysicalType}
        open={normalPhysicalFormOpen}
        onClose={handleNormalPhysicalTypeFormClose}
        onSubmit={handleNormalPhysicalTypeFormSubmit}
      />
    </div>
  )
}

export default function EditNormalPhysicalDayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">Loading...</div>
      }
    >
      <EditNormalPhysicalDayContent />
    </Suspense>
  )
}
