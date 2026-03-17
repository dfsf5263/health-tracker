'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiFetch } from '@/lib/http-utils'
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel'
import { Progress } from '@/components/ui/progress'
import {
  MigraineFormProvider,
  useMigraineForm,
  MigraineFormData,
} from '@/components/forms/migraine-form-provider'
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
import { MigraineWithRelationships } from '@/lib/types'

// UUID validation helper
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Helper component to access migraine form context for conditional navigation
function MigraineAttackTypesFormWrapper({ api }: { api: CarouselApi | undefined }) {
  const migraineContext = useMigraineForm()
  const { navigateToStep } = migraineContext

  const handleBack = () => {
    const previousStep = migraineContext.goBackOneStep()
    if (previousStep !== null) {
      const carouselIndex = previousStep + 5 // Convert to carousel index
      api?.scrollTo(carouselIndex)
    }
  }

  const handleContinue = () => {
    // Continue to pain level step
    navigateToStep(4)
    api?.scrollTo(9) // Index 9 is the pain level step
  }

  return <MigraineAttackTypesForm onBack={handleBack} onContinue={handleContinue} />
}

function EditMigraineContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const migraineContext = useMigraineForm()
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(5) // Start on first migraine step
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [migraineData, setMigraineData] = useState<MigraineWithRelationships | null>(null)
  const fetchedRef = React.useRef(false)

  const migraineId = searchParams.get('id')

  // Transform database migraine to form data
  const transformToFormData = (migraine: MigraineWithRelationships): MigraineFormData => {
    return {
      startDateTime: new Date(migraine.startDateTime),
      endDateTime: migraine.endDateTime ? new Date(migraine.endDateTime) : undefined,
      isOver: !!migraine.endDateTime,
      painLevel: migraine.painLevel,
      geographicLocation: migraine.geographicLocation || undefined,
      periodStatus: migraine.periodStatus || undefined,
      notes: migraine.notes || undefined,
      attackTypeIds: migraine.migraineMigraineAttackTypes.map((rel) => rel.migraineAttackType.id),
      symptomTypeIds: migraine.migraineMigraineSymptomTypes.map(
        (rel) => rel.migraineSymptomType.id
      ),
      triggerTypeIds: migraine.migraineMigraineTriggerTypes.map(
        (rel) => rel.migraineTriggerType.id
      ),
      precognitionTypeIds: migraine.migraineMigrainePrecognitionTypes.map(
        (rel) => rel.migrainePrecognitionType.id
      ),
      medicationTypeIds: migraine.migraineMigraineMedicationTypes.map(
        (rel) => rel.migraineMedicationType.id
      ),
      reliefTypeIds: migraine.migraineMigraineReliefTypes.map((rel) => rel.migraineReliefType.id),
      activityTypeIds: migraine.migraineMigraineActivityTypes.map(
        (rel) => rel.migraineActivityType.id
      ),
      locationTypeIds: migraine.migraineMigraineLocationTypes.map(
        (rel) => rel.migraineLocationType.id
      ),
      medicationData: migraine.migraineMigraineMedicationTypes.map((rel) => ({
        typeId: rel.migraineMedicationType.id,
        dosageModifier: rel.dosageModifier,
      })),
    }
  }

  // Fetch migraine data (only once per migraine ID)
  React.useEffect(() => {
    console.log('Fetch effect triggered:', {
      migraineId,
      allParams: searchParams.toString(),
      searchParamsAvailable: !!searchParams,
      alreadyFetched: fetchedRef.current,
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'SSR',
    })

    // Handle case where search params are not yet available
    if (!searchParams) {
      console.log('Search params not yet available, waiting...')
      return
    }

    // Check if we have a migraine ID
    if (!migraineId) {
      console.error('No migraine ID provided in search params')
      console.log('Available search params:', Array.from(searchParams.entries()))
      setError('No migraine ID provided. Please select a migraine from the calendar.')
      setIsLoading(false)
      return
    }

    if (!isValidUUID(migraineId)) {
      console.error('Invalid migraine ID format:', migraineId)
      setError('Invalid migraine ID format. Please select a valid migraine from the calendar.')
      setIsLoading(false)
      return
    }

    // Prevent duplicate fetches
    if (fetchedRef.current) {
      console.log('Already fetched, skipping...')
      return
    }

    const fetchMigraine = async () => {
      fetchedRef.current = true
      try {
        console.log('Fetching migraine:', migraineId)
        const { data: migraine, error } = await apiFetch<MigraineWithRelationships>(
          `/api/migraines/${migraineId}`
        )

        if (error) {
          if (error.includes('404') || error.includes('not found')) {
            setError('Migraine not found. It may have been deleted.')
          } else {
            setError('Failed to load migraine data. Please try again.')
          }
          setIsLoading(false)
          return
        }

        if (!migraine) {
          setError('Migraine not found. It may have been deleted.')
          setIsLoading(false)
          return
        }

        console.log('Successfully loaded migraine:', migraine.id)

        setMigraineData(migraine)
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching migraine:', error)
        setError('Failed to load migraine data. Please try again.')
        setIsLoading(false)
      }
    }

    fetchMigraine()
  }, [migraineId, searchParams])

  // Update form context when migraine data is available
  React.useEffect(() => {
    if (migraineData) {
      console.log('Updating form context with migraine data:', migraineData.id)
      const formData = transformToFormData(migraineData)
      migraineContext.updateFormData(formData)
      migraineContext.navigateToStep(0) // Start at first step
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [migraineData])

  // Redirect on error
  React.useEffect(() => {
    if (error) {
      console.error(error)
      router.push('/dashboard')
    }
  }, [error, router])

  const handleFlowBack = React.useCallback(() => {
    if (current <= 5) {
      // From first migraine step, go back to dashboard
      router.push('/dashboard')
    } else {
      // Handle migraine flow step-by-step navigation
      const previousStep = migraineContext.goBackOneStep()

      if (previousStep !== null) {
        // Navigate to the previous step in the migraine flow
        const carouselIndex = previousStep + 5 // Convert to carousel index
        api?.scrollTo(carouselIndex)
      } else {
        // No more steps to go back, return to dashboard
        router.push('/dashboard')
      }
    }
  }, [current, api, router, migraineContext])

  React.useEffect(() => {
    if (!api) {
      return
    }

    setCurrent(api.selectedScrollSnap())

    api.on('select', () => {
      const newCurrent = api.selectedScrollSnap()
      setCurrent(newCurrent)
    })
  }, [api])

  // Browser back button handler
  React.useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault()
      handleFlowBack()
    }

    // Push current state to enable back navigation capture (preserve query params)
    window.history.pushState({}, '', window.location.pathname + window.location.search)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [current, handleFlowBack])

  const calculateEditProgress = (): number => {
    if (current < 5) return 0

    const migraineStep = current - 5 // Convert to 0-based migraine step (0-13)
    const totalMigraineSteps = 14
    return Math.round(((migraineStep + 1) / totalMigraineSteps) * 100)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-sm text-muted-foreground">Loading migraine...</div>
      </div>
    )
  }

  const progress = calculateEditProgress()

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 flex items-center justify-center p-4">
        <Carousel
          setApi={setApi}
          className="w-full max-w-2xl"
          opts={{
            watchDrag: false,
            startIndex: 5, // Start on first migraine step
          }}
        >
          <CarouselContent className="h-[calc(100vh-12rem)]">
            {/* Skip indices 0-4 as they're not used in edit mode */}
            {Array.from({ length: 5 }, (_, i) => (
              <CarouselItem key={i} className="flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="min-h-full flex items-center justify-center">
                    <div className="text-sm text-muted-foreground">Not used in edit mode</div>
                  </div>
                </div>
              </CarouselItem>
            ))}

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
                        const carouselIndex = previousStep + 5
                        api?.scrollTo(carouselIndex)
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
                        const carouselIndex = previousStep + 5
                        api?.scrollTo(carouselIndex)
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
                        const carouselIndex = previousStep + 5
                        api?.scrollTo(carouselIndex)
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
                        const carouselIndex = previousStep + 5
                        api?.scrollTo(carouselIndex)
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
                        const carouselIndex = previousStep + 5
                        api?.scrollTo(carouselIndex)
                      }
                    }}
                    onContinue={() => {
                      // Continue to period status step
                      migraineContext.navigateToStep(7)
                      api?.scrollTo(12) // Index 12 is the period status step
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
                        const carouselIndex = previousStep + 5
                        api?.scrollTo(carouselIndex)
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
                        const carouselIndex = previousStep + 5
                        api?.scrollTo(carouselIndex)
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
                        const carouselIndex = previousStep + 5
                        api?.scrollTo(carouselIndex)
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
                        const carouselIndex = previousStep + 5
                        api?.scrollTo(carouselIndex)
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
                        const carouselIndex = previousStep + 5
                        api?.scrollTo(carouselIndex)
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
                        const carouselIndex = previousStep + 5
                        api?.scrollTo(carouselIndex)
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
                    isEditMode={true}
                    migraineId={migraineId || ''}
                    onBack={() => {
                      // Go back to previous step
                      const previousStep = migraineContext.goBackOneStep()
                      if (previousStep !== null) {
                        const carouselIndex = previousStep + 5
                        api?.scrollTo(carouselIndex)
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
    </div>
  )
}

export default function EditMigrainePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-sm text-muted-foreground">Loading migraine...</div>
        </div>
      }
    >
      <MigraineFormProvider>
        <EditMigraineContent />
      </MigraineFormProvider>
    </Suspense>
  )
}
