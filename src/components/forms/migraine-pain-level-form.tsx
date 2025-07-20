'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useMigraineForm } from './migraine-form-provider'

interface MigrainePainLevelFormProps {
  onContinue?: () => void
  onBack?: () => void
}

export function MigrainePainLevelForm({ onContinue, onBack }: MigrainePainLevelFormProps) {
  const { formData, updateFormData } = useMigraineForm()
  const [painLevel, setPainLevel] = useState<number>(formData.painLevel || 5)

  // Initialize from existing form data
  useEffect(() => {
    if (formData.painLevel) {
      setPainLevel(formData.painLevel)
    }
  }, [formData.painLevel])

  // Initialize form data with default value if not set
  useEffect(() => {
    if (formData.painLevel === undefined) {
      updateFormData({ painLevel: 5 })
    }
  }, [formData.painLevel, updateFormData])

  const handleSliderChange = (value: number[]) => {
    const newPainLevel = value[0]
    setPainLevel(newPainLevel)
    updateFormData({ painLevel: newPainLevel })
  }

  const handleContinue = () => {
    onContinue?.()
  }

  // Get pain level description
  const getPainDescription = (level: number): string => {
    if (level <= 2) return 'Mild'
    if (level <= 4) return 'Moderate'
    if (level <= 6) return 'Noticeable'
    if (level <= 8) return 'Severe'
    return 'Extreme'
  }

  // Get color based on pain level
  const getPainColor = (level: number): string => {
    if (level <= 2) return 'text-green-600'
    if (level <= 4) return 'text-yellow-600'
    if (level <= 6) return 'text-orange-500'
    if (level <= 8) return 'text-red-500'
    return 'text-red-700'
  }

  return (
    <div className="w-full max-w-md space-y-6 py-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">What&apos;s your pain level?</h2>
        <p className="text-muted-foreground">
          Rate your migraine pain from 1 (minimal) to 10 (extreme)
        </p>
      </div>

      <div className="space-y-6">
        {/* Current Pain Level Display */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-3">
            <span className={`text-4xl font-bold ${getPainColor(painLevel)}`}>{painLevel}</span>
            <span className={`text-lg font-medium ${getPainColor(painLevel)}`}>
              {getPainDescription(painLevel)}
            </span>
          </div>
        </div>

        {/* Custom Gradient Slider */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Pain Level</Label>

          {/* Custom gradient background for slider */}
          <div className="relative">
            <div
              className="absolute inset-0 h-1.5 rounded-full top-1/2 -translate-y-1/2"
              style={{
                background:
                  'linear-gradient(to right, #10b981, #f59e0b, #f97316, #ef4444, #dc2626)',
              }}
            />
            <Slider
              value={[painLevel]}
              onValueChange={handleSliderChange}
              min={1}
              max={10}
              step={1}
              className="relative z-10 [&_[data-slot=slider-track]]:bg-transparent [&_[data-slot=slider-range]]:bg-transparent"
            />
          </div>
        </div>

        {/* Pain Level Descriptions */}
        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div className="space-y-1">
            <div className="text-green-600 font-medium">1-2: Mild</div>
            <div className="text-yellow-600 font-medium">3-4: Moderate</div>
            <div className="text-orange-500 font-medium">5-6: Noticeable</div>
          </div>
          <div className="space-y-1">
            <div className="text-red-500 font-medium">7-8: Severe</div>
            <div className="text-red-700 font-medium">9-10: Extreme</div>
          </div>
        </div>

        {/* Current Selection Summary */}
        <div className="text-center text-sm p-3 bg-muted rounded-lg">
          <span className="text-muted-foreground">Pain level: </span>
          <span className={`font-medium ${getPainColor(painLevel)}`}>
            {painLevel} - {getPainDescription(painLevel)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="flex-1">
            Back
          </Button>
        )}
        <Button onClick={handleContinue} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  )
}
