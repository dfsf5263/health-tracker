'use client'

import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useMigraineForm } from './migraine-form-provider'
import { MigraineTriggerTypeForm } from '@/components/migraine-trigger-type-form'
import { toast } from 'sonner'

interface MigraineTriggerType {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

interface MigraineTriggerTypesFormProps {
  onContinue?: () => void
  onBack?: () => void
}

export function MigraineTriggerTypesForm({ onContinue, onBack }: MigraineTriggerTypesFormProps) {
  const { formData, updateFormData } = useMigraineForm()
  const [triggerTypes, setTriggerTypes] = useState<MigraineTriggerType[]>([])
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>(formData.triggerTypeIds || [])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedTriggerType, setSelectedTriggerType] = useState<MigraineTriggerType | undefined>()

  // Fetch trigger types on component mount
  const fetchTriggerTypes = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/migraine-trigger-types')
      if (!response.ok) {
        throw new Error('Failed to fetch trigger types')
      }
      const data = await response.json()
      setTriggerTypes(data)
    } catch (error) {
      console.error('Error fetching trigger types:', error)
      toast.error('Failed to fetch trigger types')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTriggerTypes()
  }, [fetchTriggerTypes])

  // Sync selected trigger types when form data changes (for edit mode)
  useEffect(() => {
    if (formData.triggerTypeIds) {
      setSelectedTypeIds(formData.triggerTypeIds)
    }
  }, [formData.triggerTypeIds])

  // Handle toggle selection
  const handleToggle = (typeId: string, checked: boolean) => {
    const newSelectedIds = checked
      ? [...selectedTypeIds, typeId]
      : selectedTypeIds.filter((id) => id !== typeId)

    setSelectedTypeIds(newSelectedIds)
    updateFormData({ triggerTypeIds: newSelectedIds })
  }

  // Handle creating new trigger type
  const handleCreateNew = () => {
    setSelectedTriggerType(undefined)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedTriggerType(undefined)
  }

  const handleFormSubmit = async (
    formData: Omit<MigraineTriggerType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      const response = await fetch('/api/migraine-trigger-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create trigger type')
      }

      const newType = await response.json()

      // Add new type to the list while preserving toggle states
      setTriggerTypes((prev) => [...prev, newType])
      setFormOpen(false)
      setSelectedTriggerType(undefined)
      toast.success('Trigger type created successfully')
    } catch (error) {
      console.error('Error creating trigger type:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create trigger type')
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
          <h2 className="text-2xl font-semibold">What triggered your migraine?</h2>
          <p className="text-muted-foreground">Loading trigger types...</p>
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
            <h2 className="text-2xl font-semibold">What triggered your migraine?</h2>
            <p className="text-muted-foreground">
              Select all that apply to identify potential triggers
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
        {triggerTypes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No trigger types available.</p>
            <Button variant="outline" onClick={handleCreateNew} className="mt-2">
              Create your first trigger type
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {triggerTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => handleToggle(type.id, !selectedTypeIds.includes(type.id))}
                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <Switch
                  id={`trigger-type-${type.id}`}
                  checked={selectedTypeIds.includes(type.id)}
                  onCheckedChange={(checked) => handleToggle(type.id, checked)}
                />
                <Label
                  htmlFor={`trigger-type-${type.id}`}
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
            {selectedTypeIds.length} trigger type{selectedTypeIds.length !== 1 ? 's' : ''} selected
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

      {/* Create New Trigger Type Form */}
      <MigraineTriggerTypeForm
        migraineTriggerType={selectedTriggerType}
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
