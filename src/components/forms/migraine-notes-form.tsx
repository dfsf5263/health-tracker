'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useMigraineForm } from './migraine-form-provider'
import { toast } from 'sonner'

interface MigraineNotesFormProps {
  onBack?: () => void
}

export function MigraineNotesForm({ onBack }: MigraineNotesFormProps) {
  const router = useRouter()
  const { formData, updateFormData } = useMigraineForm()
  const [geographicLocation, setGeographicLocation] = useState(formData.geographicLocation || '')
  const [notes, setNotes] = useState(formData.notes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Update form data with current values
      updateFormData({ geographicLocation, notes })

      // Prepare the complete migraine data
      const migraineData = {
        startDateTime: formData.startDateTime?.toISOString(),
        endDateTime: formData.endDateTime?.toISOString(),
        painLevel: formData.painLevel,
        geographicLocation: geographicLocation.trim() || undefined,
        periodStatus: formData.periodStatus,
        notes: notes.trim() || undefined,
        attackTypeIds: formData.attackTypeIds || [],
        symptomTypeIds: formData.symptomTypeIds || [],
        triggerTypeIds: formData.triggerTypeIds || [],
        precognitionTypeIds: formData.precognitionTypeIds || [],
        medicationTypeIds: formData.medicationTypeIds || [],
        reliefTypeIds: formData.reliefTypeIds || [],
        activityTypeIds: formData.activityTypeIds || [],
        locationTypeIds: formData.locationTypeIds || [],
        medicationData: formData.medicationData || [],
      }

      // Validate required fields
      if (!migraineData.startDateTime) {
        toast.error('Start date and time are required')
        return
      }

      if (!migraineData.painLevel) {
        toast.error('Pain level is required')
        return
      }

      const response = await fetch('/api/migraines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(migraineData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save migraine')
      }

      toast.success('Migraine saved successfully')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving migraine:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save migraine')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGeographicLocationChange = (value: string) => {
    setGeographicLocation(value)
    updateFormData({ geographicLocation: value })
  }

  const handleNotesChange = (value: string) => {
    setNotes(value)
    updateFormData({ notes: value })
  }

  return (
    <div className="w-full max-w-md space-y-6 py-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Additional Details</h2>
        <p className="text-muted-foreground">Add any additional information about your migraine</p>
      </div>

      <div className="space-y-6">
        {/* Geographic Location */}
        <div className="space-y-2">
          <Label htmlFor="geographic-location">Where were you when your migraine started?</Label>
          <Textarea
            id="geographic-location"
            placeholder="e.g., At home, at work, in the car, etc."
            value={geographicLocation}
            onChange={(e) => handleGeographicLocationChange(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            placeholder="Any other details about your migraine..."
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="flex-1" disabled={isSubmitting}>
            Back
          </Button>
        )}
        <Button onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Migraine'}
        </Button>
      </div>
    </div>
  )
}
