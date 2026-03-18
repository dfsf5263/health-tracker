'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel'
import { Progress } from '@/components/ui/progress'
import { PeriodDayForm, PeriodDayFormData } from '@/components/forms/period-day-form'
import {
  BirthControlDayForm,
  BirthControlDayFormData,
} from '@/components/forms/birth-control-day-form'
import {
  IrregularPhysicalDayForm,
  IrregularPhysicalDayFormData,
} from '@/components/forms/irregular-physical-day-form'
import {
  NormalPhysicalDayForm,
  NormalPhysicalDayFormData,
} from '@/components/forms/normal-physical-day-form'
import { BirthControlTypeForm } from '@/components/birth-control-type-form'
import { IrregularPhysicalTypeForm } from '@/components/irregular-physical-type-form'
import { NormalPhysicalTypeForm } from '@/components/normal-physical-type-form'
import { Droplet, Pill, Activity, Heart, Brain } from 'lucide-react'
import { MigraineFormProvider, useMigraineForm } from '@/components/forms/migraine-form-provider'
import { MigraineStartDateTimeForm } from '@/components/forms/migraine-start-datetime-form'
import { MigraineMigraineover } from '@/components/forms/migraine-migraine-over'
import { MigraineEndDateTimeForm } from '@/components/forms/migraine-end-datetime-form'
import { MigraineAttackTypesForm } from '@/components/forms/migraine-attack-types-form'
import { MigrainePainLevelForm } from '@/components/forms/migraine-pain-level-form'
import { MigraineSymptomTypesForm } from '@/components/forms/migraine-symptom-types-form'
import { MigraineTriggerTypesForm } from '@/components/forms/migraine-trigger-types-form'
import { MigrainePeriodStatusForm } from '@/components/forms/migraine-period-status-form'
import { MigraineMedicationTypesForm } from '@/components/forms/migraine-medication-types-form'
import { MigrainePrecognitionTypesForm } from '@/components/forms/migraine-precognition-types-form'
import { MigraineReliefTypesForm } from '@/components/forms/migraine-relief-types-form'
import { MigraineActivityTypesForm } from '@/components/forms/migraine-activity-types-form'
import { MigraineLocationTypesForm } from '@/components/forms/migraine-location-types-form'
import { MigraineNotesForm } from '@/components/forms/migraine-notes-form'
import { apiFetch, showSuccessToast } from '@/lib/http-utils'

type EventType = 'period' | 'birth-control' | 'irregular-physical' | 'normal-physical' | 'migraine'

interface FlowState {
  currentFlow: EventType | null
  flowStep: number
  flowHistory: number[]
}

interface BirthControlType {
  id: string
  userId: string
  name: string
  vaginalRingInsertion: boolean
  vaginalRingRemoval: boolean
  createdAt: string
  updatedAt: string
}

interface IrregularPhysicalType {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

interface NormalPhysicalType {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

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
  migraine: 5, // First migraine step (start date/time)
}

// Mapping between migraine steps (0-based) and carousel indices
const migraineStepToCarouselIndex: Record<number, number> = {
  0: 5, // Start Date/Time
  1: 6, // Is Migraine Over?
  2: 7, // End Date/Time (conditional)
  3: 8, // Attack Types
  4: 9, // Pain Level
  5: 10, // Symptoms
  6: 11, // Triggers
  7: 12, // Period Status
  8: 13, // Medications
  9: 14, // Precognition
  10: 15, // Relief Methods
  11: 16, // Activity Impact
  12: 17, // Pain Locations
  13: 18, // Notes and Save
}

// Helper component to access migraine form context for conditional navigation
function MigraineAttackTypesFormWrapper({ api }: { api: CarouselApi | undefined }) {
  const migraineContext = useMigraineForm()
  const { navigateToStep } = migraineContext

  const handleBack = () => {
    const previousStep = migraineContext.goBackOneStep()
    if (previousStep !== null) {
      const carouselIndex = migraineStepToCarouselIndex[previousStep]
      if (carouselIndex !== undefined) {
        api?.scrollTo(carouselIndex)
      }
    }
  }

  const handleContinue = () => {
    // Continue to pain level step
    navigateToStep(4)
    api?.scrollTo(9) // Index 9 is the pain level step
  }

  return <MigraineAttackTypesForm onBack={handleBack} onContinue={handleContinue} />
}

// Helper component to provide migraine-aware navigation functions
function AddEventContent() {
  const migraineContext = useMigraineForm()

  return <AddEventPageInner migraineContext={migraineContext} />
}

// Main component logic extracted to access migraine context
function AddEventPageInner({
  migraineContext,
}: {
  migraineContext: ReturnType<typeof useMigraineForm>
}) {
  const router = useRouter()
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [flowState, setFlowState] = useState<FlowState>({
    currentFlow: null,
    flowStep: 0,
    flowHistory: [0],
  })

  // Sex state — used to filter event types and skip period status in migraine wizard
  const [sex, setSex] = useState('')

  React.useEffect(() => {
    const loadProfile = async () => {
      const { data } = await apiFetch<{ sex: string }>('/api/user/profile')
      if (data) {
        setSex(data.sex)
      }
    }
    loadProfile()
  }, [])

  const visibleEventTypes = React.useMemo(
    () =>
      sex === 'Male'
        ? eventTypes.filter((t) => t.id !== 'period' && t.id !== 'birth-control')
        : eventTypes,
    [sex]
  )

  // Birth control state
  const [birthControlTypes, setBirthControlTypes] = useState<BirthControlType[]>([])
  const [loadingBirthControlTypes, setLoadingBirthControlTypes] = useState(false)
  const [birthControlFormOpen, setBirthControlFormOpen] = useState(false)
  const [selectedBirthControlType, setSelectedBirthControlType] = useState<
    BirthControlType | undefined
  >(undefined)

  // Irregular physical state
  const [irregularPhysicalTypes, setIrregularPhysicalTypes] = useState<IrregularPhysicalType[]>([])
  const [loadingIrregularPhysicalTypes, setLoadingIrregularPhysicalTypes] = useState(false)
  const [irregularPhysicalFormOpen, setIrregularPhysicalFormOpen] = useState(false)
  const [selectedIrregularPhysicalType, setSelectedIrregularPhysicalType] = useState<
    IrregularPhysicalType | undefined
  >(undefined)

  // Normal physical state
  const [normalPhysicalTypes, setNormalPhysicalTypes] = useState<NormalPhysicalType[]>([])
  const [loadingNormalPhysicalTypes, setLoadingNormalPhysicalTypes] = useState(false)
  const [normalPhysicalFormOpen, setNormalPhysicalFormOpen] = useState(false)
  const [selectedNormalPhysicalType, setSelectedNormalPhysicalType] = useState<
    NormalPhysicalType | undefined
  >(undefined)

  const resetFlow = React.useCallback(() => {
    setFlowState({
      currentFlow: null,
      flowStep: 0,
      flowHistory: [0],
    })
  }, [])

  // Fetch birth control types when needed
  const fetchBirthControlTypes = React.useCallback(async () => {
    setLoadingBirthControlTypes(true)
    try {
      const { data, error } = await apiFetch<BirthControlType[]>('/api/birth-control-types')
      if (error || !data) {
        // Error toast is automatically shown by apiFetch
        return
      }
      setBirthControlTypes(data)
    } finally {
      setLoadingBirthControlTypes(false)
    }
  }, [])

  // Fetch irregular physical types when needed
  const fetchIrregularPhysicalTypes = React.useCallback(async () => {
    setLoadingIrregularPhysicalTypes(true)
    try {
      const { data, error } = await apiFetch<IrregularPhysicalType[]>(
        '/api/irregular-physical-types'
      )
      if (error || !data) {
        // Error toast is automatically shown by apiFetch
        return
      }
      setIrregularPhysicalTypes(data)
    } finally {
      setLoadingIrregularPhysicalTypes(false)
    }
  }, [])

  // Fetch normal physical types when needed
  const fetchNormalPhysicalTypes = React.useCallback(async () => {
    setLoadingNormalPhysicalTypes(true)
    try {
      const { data, error } = await apiFetch<NormalPhysicalType[]>('/api/normal-physical-types')
      if (error || !data) {
        // Error toast is automatically shown by apiFetch
        return
      }
      setNormalPhysicalTypes(data)
    } finally {
      setLoadingNormalPhysicalTypes(false)
    }
  }, [])

  const handleFlowBack = React.useCallback(() => {
    if (current === 0) {
      // From event selection, go back to dashboard
      router.push('/dashboard')
    } else if (flowState.currentFlow === 'migraine' && current >= 5 && current <= 18) {
      // Handle migraine flow step-by-step navigation
      const previousStep = migraineContext.goBackOneStep()

      if (previousStep !== null) {
        // Navigate to the previous step in the migraine flow
        const carouselIndex = migraineStepToCarouselIndex[previousStep]
        if (carouselIndex !== undefined) {
          api?.scrollTo(carouselIndex)
        } else {
          // Fallback: go back to event selection if mapping is broken
          api?.scrollTo(0)
          setFlowState((prev) => ({
            ...prev,
            flowStep: 0,
            flowHistory: [0],
          }))
          migraineContext.resetForm()
        }
      } else {
        // No more steps to go back, return to event selection
        api?.scrollTo(0)
        setFlowState((prev) => ({
          ...prev,
          flowStep: 0,
          flowHistory: [0],
        }))
        migraineContext.resetForm()
      }
    } else {
      // From any other form, go back to event selection
      api?.scrollTo(0)
      setFlowState((prev) => ({
        ...prev,
        flowStep: 0,
        flowHistory: [0],
      }))
    }
  }, [current, api, router, flowState.currentFlow, migraineContext])

  React.useEffect(() => {
    if (!api) {
      return
    }

    setCurrent(api.selectedScrollSnap())

    api.on('select', () => {
      const newCurrent = api.selectedScrollSnap()
      setCurrent(newCurrent)

      // Reset flow when returning to event selection
      if (newCurrent === 0) {
        resetFlow()
      }
    })
  }, [api, resetFlow])

  // Browser back button handler
  React.useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault()
      handleFlowBack()
    }

    // Push current state to enable back navigation capture
    window.history.pushState({}, '', window.location.pathname)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [current, flowState, handleFlowBack])

  const setCurrentFlow = (eventType: EventType, targetIndex: number) => {
    setFlowState({
      currentFlow: eventType,
      flowStep: 1,
      flowHistory: [0, targetIndex],
    })
  }

  const calculateFlowProgress = (): number => {
    if (current === 0) {
      return 0 // Event selection shows no progress
    }

    // For migraine flow, calculate based on logical step position from migraine context
    if (flowState.currentFlow === 'migraine') {
      const migraineStep = migraineContext.currentStep ?? 0
      const totalMigraineSteps = sex === 'Male' ? 13 : 14
      // Male users skip step 7 (Period Status), so steps 8-13 are logically positions 7-12
      const adjustedStep = sex === 'Male' && migraineStep >= 8 ? migraineStep - 1 : migraineStep
      return Math.round(((adjustedStep + 1) / totalMigraineSteps) * 100)
    }

    // For other single-step flows, show 50%
    return 50
  }

  const handleEventTypeSelect = (eventType: EventType) => {
    const index = eventTypeToCarouselIndex[eventType]
    setCurrentFlow(eventType, index)
    api?.scrollTo(index)

    // Initialize migraine step tracking when entering migraine flow
    if (eventType === 'migraine') {
      migraineContext.navigateToStep(0) // Start at step 0
    }

    // Fetch types when event type is selected
    if (eventType === 'birth-control') {
      fetchBirthControlTypes()
    } else if (eventType === 'irregular-physical') {
      fetchIrregularPhysicalTypes()
    } else if (eventType === 'normal-physical') {
      fetchNormalPhysicalTypes()
    }
  }

  const handlePeriodDaySubmit = async (data: PeriodDayFormData) => {
    const { data: savedDay, error } = await apiFetch('/api/period-days', {
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

    if (error || !savedDay) {
      // Error toast is automatically shown by apiFetch
      throw new Error(error || 'Failed to save period day')
    }

    showSuccessToast('Period day saved successfully')
    router.push('/dashboard')
  }

  const handleBirthControlDaySubmit = async (data: BirthControlDayFormData) => {
    const { data: savedDay, error } = await apiFetch('/api/birth-control-days', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: `${data.date.getFullYear()}-${String(data.date.getMonth() + 1).padStart(2, '0')}-${String(data.date.getDate()).padStart(2, '0')}`,
        typeId: data.typeId,
        notes: data.notes,
      }),
    })

    if (error || !savedDay) {
      // Error toast is automatically shown by apiFetch
      throw new Error(error || 'Failed to save birth control day')
    }

    showSuccessToast('Birth control day saved successfully')
    router.push('/dashboard')
  }

  const handleCreateNewBirthControlType = () => {
    setSelectedBirthControlType(undefined)
    setBirthControlFormOpen(true)
  }

  const handleCreateNewIrregularPhysicalType = () => {
    setSelectedIrregularPhysicalType(undefined)
    setIrregularPhysicalFormOpen(true)
  }

  const handleCreateNewNormalPhysicalType = () => {
    setSelectedNormalPhysicalType(undefined)
    setNormalPhysicalFormOpen(true)
  }

  const handleBirthControlTypeFormClose = () => {
    setBirthControlFormOpen(false)
    setSelectedBirthControlType(undefined)
  }

  const handleIrregularPhysicalTypeFormClose = () => {
    setIrregularPhysicalFormOpen(false)
    setSelectedIrregularPhysicalType(undefined)
  }

  const handleNormalPhysicalTypeFormClose = () => {
    setNormalPhysicalFormOpen(false)
    setSelectedNormalPhysicalType(undefined)
  }

  const handleBirthControlTypeFormSubmit = async (
    formData: Omit<BirthControlType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    const { data: newType, error } = await apiFetch<BirthControlType>('/api/birth-control-types', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    if (error || !newType) {
      // Error toast is automatically shown by apiFetch
      throw new Error(error || 'Failed to create birth control type')
    }

    setBirthControlTypes((prev) => [...prev, newType])
    setBirthControlFormOpen(false)
    setSelectedBirthControlType(undefined)
    showSuccessToast('Birth control type created successfully')
  }

  const handleIrregularPhysicalTypeFormSubmit = async (
    formData: Omit<IrregularPhysicalType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    const { data: newType, error } = await apiFetch<IrregularPhysicalType>(
      '/api/irregular-physical-types',
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
      throw new Error(error || 'Failed to create irregular physical type')
    }

    setIrregularPhysicalTypes((prev) => [...prev, newType])
    setIrregularPhysicalFormOpen(false)
    setSelectedIrregularPhysicalType(undefined)
    showSuccessToast('Irregular physical type created successfully')
  }

  const handleNormalPhysicalTypeFormSubmit = async (
    formData: Omit<NormalPhysicalType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    const { data: newType, error } = await apiFetch<NormalPhysicalType>(
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

  const handleIrregularPhysicalDaySubmit = async (data: IrregularPhysicalDayFormData) => {
    const { data: savedDay, error } = await apiFetch('/api/irregular-physical-days', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: `${data.date.getFullYear()}-${String(data.date.getMonth() + 1).padStart(2, '0')}-${String(data.date.getDate()).padStart(2, '0')}`,
        typeId: data.typeId,
        notes: data.notes,
      }),
    })

    if (error || !savedDay) {
      // Error toast is automatically shown by apiFetch
      throw new Error(error || 'Failed to save irregular physical day')
    }

    showSuccessToast('Irregular physical day saved successfully')
    router.push('/dashboard')
  }

  const handleNormalPhysicalDaySubmit = async (data: NormalPhysicalDayFormData) => {
    const { data: savedDay, error } = await apiFetch('/api/normal-physical-days', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: `${data.date.getFullYear()}-${String(data.date.getMonth() + 1).padStart(2, '0')}-${String(data.date.getDate()).padStart(2, '0')}`,
        typeId: data.typeId,
        notes: data.notes,
      }),
    })

    if (error || !savedDay) {
      // Error toast is automatically shown by apiFetch
      throw new Error(error || 'Failed to save normal physical day')
    }

    showSuccessToast('Normal physical day saved successfully')
    router.push('/dashboard')
  }

  const progress = calculateFlowProgress()

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
                      {visibleEventTypes.map((type) => {
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
                    <Button variant="ghost" className="w-full" onClick={handleFlowBack}>
                      Back to event types
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>

            {/* Birth Control Form */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <div className="w-full max-w-md space-y-6 py-4">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-semibold">Track Birth Control</h2>
                      <p className="text-muted-foreground">
                        Record details about your birth control for this day
                      </p>
                    </div>
                    <BirthControlDayForm
                      onSubmit={handleBirthControlDaySubmit}
                      onCreateNewType={handleCreateNewBirthControlType}
                      birthControlTypes={birthControlTypes}
                      isLoadingTypes={loadingBirthControlTypes}
                      submitButtonText="Save Birth Control Day"
                    />
                    <Button variant="ghost" className="w-full" onClick={handleFlowBack}>
                      Back to event types
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>

            {/* Irregular Physical Event Form */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <div className="w-full max-w-md space-y-6 py-4">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-semibold">Track Irregular Physical Event</h2>
                      <p className="text-muted-foreground">
                        Record details about your irregular physical event for this day
                      </p>
                    </div>
                    <IrregularPhysicalDayForm
                      onSubmit={handleIrregularPhysicalDaySubmit}
                      onCreateNewType={handleCreateNewIrregularPhysicalType}
                      irregularPhysicalTypes={irregularPhysicalTypes}
                      isLoadingTypes={loadingIrregularPhysicalTypes}
                      submitButtonText="Save Irregular Physical Day"
                    />
                    <Button variant="ghost" className="w-full" onClick={handleFlowBack}>
                      Back to event types
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>

            {/* Normal Physical Event Form */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <div className="w-full max-w-md space-y-6 py-4">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-semibold">Track Normal Physical Event</h2>
                      <p className="text-muted-foreground">
                        Record details about your normal physical event for this day
                      </p>
                    </div>
                    <NormalPhysicalDayForm
                      onSubmit={handleNormalPhysicalDaySubmit}
                      onCreateNewType={handleCreateNewNormalPhysicalType}
                      normalPhysicalTypes={normalPhysicalTypes}
                      isLoadingTypes={loadingNormalPhysicalTypes}
                      submitButtonText="Save Normal Physical Day"
                    />
                    <Button variant="ghost" className="w-full" onClick={handleFlowBack}>
                      Back to event types
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>

            {/* Migraine Step 1: Start Date/Time */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <MigraineStartDateTimeForm
                    onBack={handleFlowBack}
                    onContinue={() => {
                      // Advance to next migraine step
                      migraineContext.navigateToStep(1)
                      api?.scrollTo(6) // Index 6 will be the "Is migraine over?" step
                    }}
                  />
                </div>
              </div>
            </CarouselItem>

            {/* Migraine Step 2: Is Migraine Over? */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <MigraineMigraineover
                    onBack={() => {
                      // Go back to previous step
                      const previousStep = migraineContext.goBackOneStep()
                      if (previousStep !== null) {
                        const carouselIndex = migraineStepToCarouselIndex[previousStep]
                        if (carouselIndex !== undefined) {
                          api?.scrollTo(carouselIndex)
                        }
                      }
                    }}
                    onYes={() => {
                      // Migraine is over - go to end date/time collection
                      migraineContext.navigateToStep(2)
                      api?.scrollTo(7) // Index 7 is the end date/time step
                    }}
                    onNo={() => {
                      // Migraine is ongoing - skip end time and go to attack types
                      migraineContext.navigateToStep(3)
                      api?.scrollTo(8) // Index 8 is the attack types step
                    }}
                  />
                </div>
              </div>
            </CarouselItem>

            {/* Migraine Step 3: End Date/Time */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <MigraineEndDateTimeForm
                    onBack={() => {
                      // Go back to previous step
                      const previousStep = migraineContext.goBackOneStep()
                      if (previousStep !== null) {
                        const carouselIndex = migraineStepToCarouselIndex[previousStep]
                        if (carouselIndex !== undefined) {
                          api?.scrollTo(carouselIndex)
                        }
                      }
                    }}
                    onContinue={() => {
                      // Continue to attack types selection
                      migraineContext.navigateToStep(3)
                      api?.scrollTo(8) // Index 8 is the attack types step
                    }}
                  />
                </div>
              </div>
            </CarouselItem>

            {/* Migraine Step 4: Attack Types */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <MigraineAttackTypesFormWrapper api={api} />
                </div>
              </div>
            </CarouselItem>

            {/* Migraine Step 5: Pain Level */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <MigrainePainLevelForm
                    onBack={() => {
                      // Go back to previous step
                      const previousStep = migraineContext.goBackOneStep()
                      if (previousStep !== null) {
                        const carouselIndex = migraineStepToCarouselIndex[previousStep]
                        if (carouselIndex !== undefined) {
                          api?.scrollTo(carouselIndex)
                        }
                      }
                    }}
                    onContinue={() => {
                      // Continue to symptoms step
                      migraineContext.navigateToStep(5)
                      api?.scrollTo(10) // Index 10 is the symptoms step
                    }}
                  />
                </div>
              </div>
            </CarouselItem>

            {/* Migraine Step 6: Symptoms */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <MigraineSymptomTypesForm
                    onBack={() => {
                      // Go back to previous step
                      const previousStep = migraineContext.goBackOneStep()
                      if (previousStep !== null) {
                        const carouselIndex = migraineStepToCarouselIndex[previousStep]
                        if (carouselIndex !== undefined) {
                          api?.scrollTo(carouselIndex)
                        }
                      }
                    }}
                    onContinue={() => {
                      // Continue to triggers step
                      migraineContext.navigateToStep(6)
                      api?.scrollTo(11) // Index 11 is the triggers step
                    }}
                  />
                </div>
              </div>
            </CarouselItem>

            {/* Migraine Step 7: Triggers */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <MigraineTriggerTypesForm
                    onBack={() => {
                      // Go back to previous step
                      const previousStep = migraineContext.goBackOneStep()
                      if (previousStep !== null) {
                        const carouselIndex = migraineStepToCarouselIndex[previousStep]
                        if (carouselIndex !== undefined) {
                          api?.scrollTo(carouselIndex)
                        }
                      }
                    }}
                    onContinue={() => {
                      if (sex === 'Male') {
                        // Skip period status step for Male users
                        migraineContext.navigateToStep(8)
                        api?.scrollTo(13) // Index 13 is the medications step
                      } else {
                        // Continue to period status step
                        migraineContext.navigateToStep(7)
                        api?.scrollTo(12) // Index 12 is the period status step
                      }
                    }}
                  />
                </div>
              </div>
            </CarouselItem>

            {/* Migraine Step 8: Period Status */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <MigrainePeriodStatusForm
                    onBack={() => {
                      // Go back to previous step
                      const previousStep = migraineContext.goBackOneStep()
                      if (previousStep !== null) {
                        const carouselIndex = migraineStepToCarouselIndex[previousStep]
                        if (carouselIndex !== undefined) {
                          api?.scrollTo(carouselIndex)
                        }
                      }
                    }}
                    onContinue={() => {
                      // Continue to medications step
                      migraineContext.navigateToStep(8)
                      api?.scrollTo(13) // Index 13 is the medications step
                    }}
                  />
                </div>
              </div>
            </CarouselItem>

            {/* Migraine Step 9: Medications */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <MigraineMedicationTypesForm
                    onBack={() => {
                      // Go back to previous step
                      const previousStep = migraineContext.goBackOneStep()
                      if (previousStep !== null) {
                        const carouselIndex = migraineStepToCarouselIndex[previousStep]
                        if (carouselIndex !== undefined) {
                          api?.scrollTo(carouselIndex)
                        }
                      }
                    }}
                    onContinue={() => {
                      // Continue to precognition step
                      migraineContext.navigateToStep(9)
                      api?.scrollTo(14) // Index 14 is the precognition step
                    }}
                  />
                </div>
              </div>
            </CarouselItem>

            {/* Migraine Step 10: Precognition */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <MigrainePrecognitionTypesForm
                    onBack={() => {
                      // Go back to previous step
                      const previousStep = migraineContext.goBackOneStep()
                      if (previousStep !== null) {
                        const carouselIndex = migraineStepToCarouselIndex[previousStep]
                        if (carouselIndex !== undefined) {
                          api?.scrollTo(carouselIndex)
                        }
                      }
                    }}
                    onContinue={() => {
                      // Continue to relief methods step
                      migraineContext.navigateToStep(10)
                      api?.scrollTo(15) // Index 15 is the relief methods step
                    }}
                  />
                </div>
              </div>
            </CarouselItem>

            {/* Migraine Step 11: Relief Methods */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <MigraineReliefTypesForm
                    onBack={() => {
                      // Go back to previous step
                      const previousStep = migraineContext.goBackOneStep()
                      if (previousStep !== null) {
                        const carouselIndex = migraineStepToCarouselIndex[previousStep]
                        if (carouselIndex !== undefined) {
                          api?.scrollTo(carouselIndex)
                        }
                      }
                    }}
                    onContinue={() => {
                      // Continue to activity impact step
                      migraineContext.navigateToStep(11)
                      api?.scrollTo(16) // Index 16 is the activity impact step
                    }}
                  />
                </div>
              </div>
            </CarouselItem>

            {/* Migraine Step 12: Activity Impact */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <MigraineActivityTypesForm
                    onBack={() => {
                      // Go back to previous step
                      const previousStep = migraineContext.goBackOneStep()
                      if (previousStep !== null) {
                        const carouselIndex = migraineStepToCarouselIndex[previousStep]
                        if (carouselIndex !== undefined) {
                          api?.scrollTo(carouselIndex)
                        }
                      }
                    }}
                    onContinue={() => {
                      // Continue to pain locations step
                      migraineContext.navigateToStep(12)
                      api?.scrollTo(17) // Index 17 is the pain locations step
                    }}
                  />
                </div>
              </div>
            </CarouselItem>

            {/* Migraine Step 13: Pain Locations */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <MigraineLocationTypesForm
                    onBack={() => {
                      // Go back to previous step
                      const previousStep = migraineContext.goBackOneStep()
                      if (previousStep !== null) {
                        const carouselIndex = migraineStepToCarouselIndex[previousStep]
                        if (carouselIndex !== undefined) {
                          api?.scrollTo(carouselIndex)
                        }
                      }
                    }}
                    onContinue={() => {
                      // Continue to notes step
                      migraineContext.navigateToStep(13)
                      api?.scrollTo(18) // Index 18 is the notes step
                    }}
                  />
                </div>
              </div>
            </CarouselItem>

            {/* Migraine Step 14: Notes and Save */}
            <CarouselItem className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="min-h-full flex items-center justify-center">
                  <MigraineNotesForm
                    onBack={() => {
                      // Go back to previous step
                      const previousStep = migraineContext.goBackOneStep()
                      if (previousStep !== null) {
                        const carouselIndex = migraineStepToCarouselIndex[previousStep]
                        if (carouselIndex !== undefined) {
                          api?.scrollTo(carouselIndex)
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </div>

      <div className="p-4 border-t">
        <Progress value={progress} className="w-full" />
      </div>

      <BirthControlTypeForm
        birthControlType={selectedBirthControlType}
        open={birthControlFormOpen}
        onClose={handleBirthControlTypeFormClose}
        onSubmit={handleBirthControlTypeFormSubmit}
      />

      <IrregularPhysicalTypeForm
        irregularPhysicalType={selectedIrregularPhysicalType}
        open={irregularPhysicalFormOpen}
        onClose={handleIrregularPhysicalTypeFormClose}
        onSubmit={handleIrregularPhysicalTypeFormSubmit}
      />

      <NormalPhysicalTypeForm
        normalPhysicalType={selectedNormalPhysicalType}
        open={normalPhysicalFormOpen}
        onClose={handleNormalPhysicalTypeFormClose}
        onSubmit={handleNormalPhysicalTypeFormSubmit}
      />
    </div>
  )
}

export default function AddEventPage() {
  return (
    <MigraineFormProvider>
      <AddEventContent />
    </MigraineFormProvider>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
