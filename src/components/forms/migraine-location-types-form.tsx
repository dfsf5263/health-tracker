'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useMigraineForm } from './migraine-form-provider'
import { toast } from 'sonner'

interface MigraineLocationType {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

interface MigraineLocationTypesFormProps {
  onContinue?: () => void
  onBack?: () => void
}

export function MigraineLocationTypesForm({ onContinue, onBack }: MigraineLocationTypesFormProps) {
  const { formData, updateFormData } = useMigraineForm()
  const [locationTypes, setLocationTypes] = useState<MigraineLocationType[]>([])
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>(formData.locationTypeIds || [])
  const [loading, setLoading] = useState(true)

  // Fetch location types on component mount
  const fetchLocationTypes = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/migraine-location-types')
      if (!response.ok) {
        throw new Error('Failed to fetch location types')
      }
      const data = await response.json()
      setLocationTypes(data)
    } catch (error) {
      console.error('Error fetching location types:', error)
      toast.error('Failed to fetch location types')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLocationTypes()
  }, [fetchLocationTypes])

  // Handle toggle selection
  const handleToggle = (typeId: string, checked: boolean) => {
    const newSelectedIds = checked
      ? [...selectedTypeIds, typeId]
      : selectedTypeIds.filter((id) => id !== typeId)

    setSelectedTypeIds(newSelectedIds)
    updateFormData({ locationTypeIds: newSelectedIds })
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
          <h2 className="text-2xl font-semibold">Where did you feel pain?</h2>
          <p className="text-muted-foreground">Loading pain locations...</p>
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
        <h2 className="text-2xl font-semibold">Where did you feel pain?</h2>
        <p className="text-muted-foreground">
          Select all locations where you experienced migraine pain
        </p>
      </div>

      <div className="space-y-4">
        {locationTypes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No pain locations available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {locationTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => handleToggle(type.id, !selectedTypeIds.includes(type.id))}
                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <Switch
                  id={`location-type-${type.id}`}
                  checked={selectedTypeIds.includes(type.id)}
                  onCheckedChange={(checked) => handleToggle(type.id, checked)}
                />
                <Label
                  htmlFor={`location-type-${type.id}`}
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
            {selectedTypeIds.length} {selectedTypeIds.length === 1 ? 'location' : 'locations'}{' '}
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
    </div>
  )
}
