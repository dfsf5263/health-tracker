'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { Progress } from '@/components/ui/progress'
import {
  BirthControlDayForm,
  BirthControlDayFormData,
} from '@/components/forms/birth-control-day-form'
import { BirthControlTypeForm } from '@/components/birth-control-type-form'
import { BirthControlDay, BirthControlType } from '@prisma/client'
import { apiFetch, showSuccessToast } from '@/lib/http-utils'

interface BirthControlDayWithType extends BirthControlDay {
  type: BirthControlType
}

// Define type for API response that has dates as strings
interface BirthControlTypeResponse {
  id: string
  userId: string
  name: string
  vaginalRingInsertion: boolean
  vaginalRingRemoval: boolean
  createdAt: string
  updatedAt: string
}

function EditBirthControlDayContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [birthControlDayData, setBirthControlDayData] = useState<BirthControlDayFormData | null>(
    null
  )
  const [birthControlTypes, setBirthControlTypes] = useState<BirthControlTypeResponse[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [birthControlFormOpen, setBirthControlFormOpen] = useState(false)
  const [selectedBirthControlType, setSelectedBirthControlType] = useState<
    BirthControlTypeResponse | undefined
  >(undefined)

  const birthControlDayId = searchParams.get('id')

  // Load birth control day data
  useEffect(() => {
    if (!birthControlDayId) {
      toast.error('Invalid birth control day ID')
      router.push('/dashboard')
      return
    }

    const loadBirthControlDay = async () => {
      try {
        // Fetch both birth control day and types in parallel
        const [{ data: birthControlDay, error: dayError }, { data: typesData, error: typesError }] =
          await Promise.all([
            apiFetch<BirthControlDayWithType>(`/api/birth-control-days/${birthControlDayId}`),
            apiFetch<BirthControlTypeResponse[]>('/api/birth-control-types'),
          ])

        if (dayError || !birthControlDay) {
          // Error toast is automatically shown by apiFetch
          router.push('/dashboard')
          return
        }

        if (!typesError && typesData) {
          setBirthControlTypes(typesData)
        }

        // Parse the UTC date correctly to avoid timezone issues
        const bcDate = new Date(birthControlDay.date)
        const localDate = new Date(
          bcDate.getUTCFullYear(),
          bcDate.getUTCMonth(),
          bcDate.getUTCDate()
        )

        setBirthControlDayData({
          date: localDate,
          typeId: birthControlDay.typeId,
          notes: birthControlDay.notes || undefined,
        })
      } catch (error) {
        console.error('Error loading birth control day:', error)
        toast.error('Failed to load birth control day')
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
        setLoadingTypes(false)
      }
    }

    loadBirthControlDay()
  }, [birthControlDayId, router])

  const handleSubmit = async (data: BirthControlDayFormData) => {
    if (!birthControlDayId) return

    const { data: updatedDay, error } = await apiFetch(
      `/api/birth-control-days/${birthControlDayId}`,
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
      throw new Error(error || 'Failed to update birth control day')
    }

    showSuccessToast('Birth control day updated successfully')
    router.push('/dashboard')
  }

  const handleBack = () => {
    router.push('/dashboard')
  }

  const handleCreateNewType = () => {
    setSelectedBirthControlType(undefined)
    setBirthControlFormOpen(true)
  }

  const handleBirthControlTypeFormClose = () => {
    setBirthControlFormOpen(false)
    setSelectedBirthControlType(undefined)
  }

  const handleBirthControlTypeFormSubmit = async (
    formData: Omit<BirthControlTypeResponse, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    const { data: newType, error } = await apiFetch<BirthControlTypeResponse>(
      '/api/birth-control-types',
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
      throw new Error(error || 'Failed to create birth control type')
    }

    setBirthControlTypes((prev) => [...prev, newType])
    setBirthControlFormOpen(false)
    setSelectedBirthControlType(undefined)
    showSuccessToast('Birth control type created successfully')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center text-muted-foreground">Loading birth control day...</div>
      </div>
    )
  }

  if (!birthControlDayData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center text-muted-foreground">Birth control day not found</div>
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
            {/* Birth Control Form */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <div className="w-full max-w-md space-y-6 py-4">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-semibold">Edit Birth Control Day</h2>
                      <p className="text-muted-foreground">
                        Update details about your birth control for this day
                      </p>
                    </div>
                    <BirthControlDayForm
                      onSubmit={handleSubmit}
                      onCreateNewType={handleCreateNewType}
                      birthControlTypes={birthControlTypes}
                      isLoadingTypes={loadingTypes}
                      initialData={birthControlDayData}
                      submitButtonText="Update Birth Control Day"
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

      <BirthControlTypeForm
        birthControlType={selectedBirthControlType}
        open={birthControlFormOpen}
        onClose={handleBirthControlTypeFormClose}
        onSubmit={handleBirthControlTypeFormSubmit}
      />
    </div>
  )
}

export default function EditBirthControlDayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">Loading...</div>
      }
    >
      <EditBirthControlDayContent />
    </Suspense>
  )
}
