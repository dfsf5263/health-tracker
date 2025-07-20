'use client'

import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useMigraineForm } from './migraine-form-provider'
import { MigrainePrecognitionTypeForm } from '@/components/migraine-precognition-type-form'
import { toast } from 'sonner'

interface MigrainePrecognitionType {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

interface MigrainePrecognitionTypesFormProps {
  onContinue?: () => void
  onBack?: () => void
}

export function MigrainePrecognitionTypesForm({
  onContinue,
  onBack,
}: MigrainePrecognitionTypesFormProps) {
  const { formData, updateFormData } = useMigraineForm()
  const [precognitionTypes, setPrecognitionTypes] = useState<MigrainePrecognitionType[]>([])
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>(
    formData.precognitionTypeIds || []
  )
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedPrecognitionType, setSelectedPrecognitionType] = useState<
    MigrainePrecognitionType | undefined
  >()

  // Fetch precognition types on component mount
  const fetchPrecognitionTypes = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/migraine-precognition-types')
      if (!response.ok) {
        throw new Error('Failed to fetch precognition types')
      }
      const data = await response.json()
      setPrecognitionTypes(data)
    } catch (error) {
      console.error('Error fetching precognition types:', error)
      toast.error('Failed to fetch precognition types')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrecognitionTypes()
  }, [fetchPrecognitionTypes])

  // Handle toggle selection
  const handleToggle = (typeId: string, checked: boolean) => {
    const newSelectedIds = checked
      ? [...selectedTypeIds, typeId]
      : selectedTypeIds.filter((id) => id !== typeId)

    setSelectedTypeIds(newSelectedIds)
    updateFormData({ precognitionTypeIds: newSelectedIds })
  }

  // Handle creating new precognition type
  const handleCreateNew = () => {
    setSelectedPrecognitionType(undefined)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedPrecognitionType(undefined)
  }

  const handleFormSubmit = async (
    formData: Omit<MigrainePrecognitionType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      const response = await fetch('/api/migraine-precognition-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create precognition type')
      }

      const newType = await response.json()

      // Add new type to the list while preserving toggle states
      setPrecognitionTypes((prev) => [...prev, newType])
      setFormOpen(false)
      setSelectedPrecognitionType(undefined)
      toast.success('Precognition type created successfully')
    } catch (error) {
      console.error('Error creating precognition type:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create precognition type')
      throw error
    }
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
          <h2 className="text-2xl font-semibold">Did you sense it coming?</h2>
          <p className="text-muted-foreground">Loading precognition types...</p>
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
            <h2 className="text-2xl font-semibold">Did you sense it coming?</h2>
            <p className="text-muted-foreground">
              Select any warning signs you experienced before the migraine
            </p>
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
        {precognitionTypes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No precognition types available.</p>
            <Button variant="outline" onClick={handleCreateNew} className="mt-2">
              Create your first precognition type
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {precognitionTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => handleToggle(type.id, !selectedTypeIds.includes(type.id))}
                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <Switch
                  id={`precognition-type-${type.id}`}
                  checked={selectedTypeIds.includes(type.id)}
                  onCheckedChange={(checked) => handleToggle(type.id, checked)}
                />
                <Label
                  htmlFor={`precognition-type-${type.id}`}
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
            {selectedTypeIds.length} warning sign{selectedTypeIds.length !== 1 ? 's' : ''} selected
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

      {/* Create New Precognition Type Form */}
      <MigrainePrecognitionTypeForm
        migrainePrecognitionType={selectedPrecognitionType}
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
