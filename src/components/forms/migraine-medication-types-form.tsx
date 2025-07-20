'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useMigraineForm } from './migraine-form-provider'
import { MigraineMedicationTypeForm } from '@/components/migraine-medication-type-form'
import { toast } from 'sonner'

interface MigraineMedicationType {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

interface MigraineMedicationTypesFormProps {
  onContinue?: () => void
  onBack?: () => void
}

interface SelectedMedication {
  typeId: string
  dosageModifier: number
}

export function MigraineMedicationTypesForm({
  onContinue,
  onBack,
}: MigraineMedicationTypesFormProps) {
  const { formData, updateFormData } = useMigraineForm()
  const [medicationTypes, setMedicationTypes] = useState<MigraineMedicationType[]>([])
  const [selectedMedications, setSelectedMedications] = useState<SelectedMedication[]>(
    formData.medicationData || []
  )
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedMedicationType, setSelectedMedicationType] = useState<
    MigraineMedicationType | undefined
  >()

  // Fetch medication types on component mount
  const fetchMedicationTypes = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/migraine-medication-types')
      if (!response.ok) {
        throw new Error('Failed to fetch medication types')
      }
      const data = await response.json()
      setMedicationTypes(data)
    } catch (error) {
      console.error('Error fetching medication types:', error)
      toast.error('Failed to fetch medication types')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMedicationTypes()
  }, [fetchMedicationTypes])

  // Initialize from existing form data
  useEffect(() => {
    if (formData.medicationData) {
      setSelectedMedications(formData.medicationData)
    }
  }, [formData.medicationData])

  // Handle toggle selection
  const handleToggle = (typeId: string, checked: boolean) => {
    let newSelectedMedications: SelectedMedication[]

    if (checked) {
      // Add medication with default dosage of 1
      newSelectedMedications = [...selectedMedications, { typeId, dosageModifier: 1 }]
    } else {
      // Remove medication
      newSelectedMedications = selectedMedications.filter((med) => med.typeId !== typeId)
    }

    setSelectedMedications(newSelectedMedications)
    updateFormData({ medicationData: newSelectedMedications })
  }

  // Handle dosage modifier changes
  const handleDosageChange = (typeId: string, change: number) => {
    const newSelectedMedications = selectedMedications.map((med) => {
      if (med.typeId === typeId) {
        const newDosage = Math.max(0.5, Math.min(5.0, med.dosageModifier + change))
        return { ...med, dosageModifier: newDosage }
      }
      return med
    })

    setSelectedMedications(newSelectedMedications)
    updateFormData({ medicationData: newSelectedMedications })
  }

  // Get dosage modifier for a specific medication
  const getDosageModifier = (typeId: string): number => {
    const medication = selectedMedications.find((med) => med.typeId === typeId)
    return medication?.dosageModifier || 1
  }

  // Check if medication is selected
  const isMedicationSelected = (typeId: string): boolean => {
    return selectedMedications.some((med) => med.typeId === typeId)
  }

  // Handle creating new medication type
  const handleCreateNew = () => {
    setSelectedMedicationType(undefined)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedMedicationType(undefined)
  }

  const handleFormSubmit = async (
    formData: Omit<MigraineMedicationType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      const response = await fetch('/api/migraine-medication-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create medication type')
      }

      const newType = await response.json()

      // Add new type to the list while preserving selection states
      setMedicationTypes((prev) => [...prev, newType])
      setFormOpen(false)
      setSelectedMedicationType(undefined)
      toast.success('Medication type created successfully')
    } catch (error) {
      console.error('Error creating medication type:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create medication type')
      throw error
    }
  }

  const handleContinue = () => {
    if (selectedMedications.length > 0) {
      onContinue?.()
    }
  }

  const isValidSelection = selectedMedications.length > 0

  if (loading) {
    return (
      <div className="w-full max-w-md space-y-6 py-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">What medications did you take?</h2>
          <p className="text-muted-foreground">Loading medication types...</p>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-6 py-4">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold">What medications did you take?</h2>
            <p className="text-muted-foreground">Select medications and adjust dosage as needed</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateNew}
            className="ml-4 h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {medicationTypes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No medication types available.</p>
            <Button variant="outline" onClick={handleCreateNew} className="mt-2">
              Create your first medication type
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {medicationTypes.map((type) => {
              const isSelected = isMedicationSelected(type.id)
              const dosage = getDosageModifier(type.id)

              return (
                <div
                  key={type.id}
                  onClick={() => handleToggle(type.id, !isSelected)}
                  className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <Switch
                    id={`medication-type-${type.id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => handleToggle(type.id, checked)}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`medication-type-${type.id}`}
                      className="text-sm font-medium cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {type.name}
                    </Label>
                    {isSelected && (
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs text-muted-foreground">Dosage:</span>
                        <span className="text-sm font-medium">{dosage.toFixed(1)}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDosageChange(type.id, -0.5)
                          }}
                          disabled={dosage <= 0.5}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDosageChange(type.id, 0.5)
                          }}
                          disabled={dosage >= 5.0}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Selection Summary */}
        {isValidSelection && (
          <div className="text-center text-sm text-muted-foreground p-3 bg-muted rounded-lg">
            {selectedMedications.length} medication{selectedMedications.length !== 1 ? 's' : ''}{' '}
            selected
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="flex-1">
            Back
          </Button>
        )}
        <Button disabled={!isValidSelection} onClick={handleContinue} className="flex-1">
          Continue
        </Button>
      </div>

      {/* Create New Medication Type Form */}
      <MigraineMedicationTypeForm
        migraineMedicationType={selectedMedicationType}
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
