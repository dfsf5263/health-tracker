'use client'

import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useMigraineForm } from './migraine-form-provider'
import { MigraineSymptomTypeForm } from '@/components/migraine-symptom-type-form'
import { apiFetch, showSuccessToast } from '@/lib/http-utils'

interface MigraineSymptomType {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

interface MigraineSymptomTypesFormProps {
  onContinue?: () => void
  onBack?: () => void
}

export function MigraineSymptomTypesForm({ onContinue, onBack }: MigraineSymptomTypesFormProps) {
  const { formData, updateFormData } = useMigraineForm()
  const [symptomTypes, setSymptomTypes] = useState<MigraineSymptomType[]>([])
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>(formData.symptomTypeIds || [])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedSymptomType, setSelectedSymptomType] = useState<MigraineSymptomType | undefined>()

  // Fetch symptom types on component mount
  const fetchSymptomTypes = React.useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await apiFetch<MigraineSymptomType[]>('/api/migraine-symptom-types')
      if (error || !data) {
        // Error toast is automatically shown by apiFetch
        return
      }
      setSymptomTypes(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSymptomTypes()
  }, [fetchSymptomTypes])

  // Sync selected symptom types when form data changes (for edit mode)
  useEffect(() => {
    if (formData.symptomTypeIds) {
      setSelectedTypeIds(formData.symptomTypeIds)
    }
  }, [formData.symptomTypeIds])

  // Handle toggle selection
  const handleToggle = (typeId: string, checked: boolean) => {
    const newSelectedIds = checked
      ? [...selectedTypeIds, typeId]
      : selectedTypeIds.filter((id) => id !== typeId)

    setSelectedTypeIds(newSelectedIds)
    updateFormData({ symptomTypeIds: newSelectedIds })
  }

  // Handle creating new symptom type
  const handleCreateNew = () => {
    setSelectedSymptomType(undefined)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedSymptomType(undefined)
  }

  const handleFormSubmit = async (
    formData: Omit<MigraineSymptomType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    const { data: newType, error } = await apiFetch<MigraineSymptomType>(
      '/api/migraine-symptom-types',
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
      throw new Error(error || 'Failed to create symptom type')
    }

    // Add new type to the list while preserving toggle states
    setSymptomTypes((prev) => [...prev, newType])
    setFormOpen(false)
    setSelectedSymptomType(undefined)
    showSuccessToast('Symptom type created successfully')
  }

  const handleContinue = () => {
    if (selectedTypeIds.length > 0) {
      onContinue?.()
    }
  }

  const isValidSelection = selectedTypeIds.length > 0

  if (loading) {
    return (
      <div className="w-full max-w-md space-y-6 py-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">What symptoms are you experiencing?</h2>
          <p className="text-muted-foreground">Loading symptom types...</p>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
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
            <h2 className="text-2xl font-semibold">What symptoms are you experiencing?</h2>
            <p className="text-muted-foreground">Select all that apply to describe your symptoms</p>
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
        {symptomTypes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No symptom types available.</p>
            <Button variant="outline" onClick={handleCreateNew} className="mt-2">
              Create your first symptom type
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {symptomTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => handleToggle(type.id, !selectedTypeIds.includes(type.id))}
                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <Switch
                  id={`symptom-type-${type.id}`}
                  checked={selectedTypeIds.includes(type.id)}
                  onCheckedChange={(checked) => handleToggle(type.id, checked)}
                />
                <Label
                  htmlFor={`symptom-type-${type.id}`}
                  className="flex-1 text-sm font-medium cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {type.name}
                </Label>
              </div>
            ))}
          </div>
        )}

        {/* Selection Summary */}
        {isValidSelection && (
          <div className="text-center text-sm text-muted-foreground p-3 bg-muted rounded-lg">
            {selectedTypeIds.length} symptom type{selectedTypeIds.length !== 1 ? 's' : ''} selected
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

      {/* Create New Symptom Type Form */}
      <MigraineSymptomTypeForm
        migraineSymptomType={selectedSymptomType}
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
