'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

export type PeriodStatus = 'Yes' | 'No' | 'Upcoming'

export interface MigraineFormData {
  startDateTime?: Date
  endDateTime?: Date
  isOver?: boolean
  painLevel?: number
  geographicLocation?: string
  periodStatus?: PeriodStatus
  notes?: string
  // Future: arrays for migraine types
  attackTypeIds?: string[]
  symptomTypeIds?: string[]
  triggerTypeIds?: string[]
  precognitionTypeIds?: string[]
  medicationTypeIds?: string[]
  reliefTypeIds?: string[]
  activityTypeIds?: string[]
  locationTypeIds?: string[]
  // Enhanced medication data with dosage modifiers
  medicationData?: Array<{ typeId: string; dosageModifier: number }>
}

interface MigraineFormContextType {
  formData: MigraineFormData
  updateFormData: (data: Partial<MigraineFormData>) => void
  resetForm: () => void
  currentStep: number
  setCurrentStep: (step: number) => void
  totalSteps: number
}

const MigraineFormContext = createContext<MigraineFormContextType | undefined>(undefined)

interface MigraineFormProviderProps {
  children: ReactNode
}

export function MigraineFormProvider({ children }: MigraineFormProviderProps) {
  const [formData, setFormData] = useState<MigraineFormData>({})
  const [currentStep, setCurrentStep] = useState(0)
  const totalSteps = 14 // Now have 14 steps: start time, migraine status, end time, attack types, pain level, symptoms, triggers, period status, medications, precognition, relief methods, activity impact, pain locations, and notes

  const updateFormData = (data: Partial<MigraineFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const resetForm = () => {
    setFormData({})
    setCurrentStep(0)
  }

  const value: MigraineFormContextType = {
    formData,
    updateFormData,
    resetForm,
    currentStep,
    setCurrentStep,
    totalSteps,
  }

  return <MigraineFormContext.Provider value={value}>{children}</MigraineFormContext.Provider>
}

export function useMigraineForm() {
  const context = useContext(MigraineFormContext)
  if (context === undefined) {
    throw new Error('useMigraineForm must be used within a MigraineFormProvider')
  }
  return context
}
