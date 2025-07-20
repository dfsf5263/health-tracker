'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useMigraineForm, type PeriodStatus } from './migraine-form-provider'
import { CheckCircle, X, Clock } from 'lucide-react'

interface MigrainePeriodStatusFormProps {
  onContinue?: () => void
  onBack?: () => void
}

const periodStatusOptions: Array<{
  value: PeriodStatus
  label: string
  description: string
  icon: React.ElementType
}> = [
  {
    value: 'Yes',
    label: 'Yes, I am on my period',
    description: 'Currently menstruating',
    icon: CheckCircle,
  },
  {
    value: 'No',
    label: 'No, I am not on my period',
    description: 'Not currently menstruating',
    icon: X,
  },
  {
    value: 'Upcoming',
    label: 'My period is upcoming',
    description: 'Expected to start soon',
    icon: Clock,
  },
]

export function MigrainePeriodStatusForm({ onContinue, onBack }: MigrainePeriodStatusFormProps) {
  const { formData, updateFormData } = useMigraineForm()
  const [selectedStatus, setSelectedStatus] = useState<PeriodStatus | undefined>(
    formData.periodStatus
  )

  // Initialize from existing form data
  useEffect(() => {
    if (formData.periodStatus) {
      setSelectedStatus(formData.periodStatus)
    }
  }, [formData.periodStatus])

  const handleStatusChange = (value: PeriodStatus) => {
    setSelectedStatus(value)
    updateFormData({ periodStatus: value })
  }

  const handleContinue = () => {
    if (selectedStatus) {
      onContinue?.()
    }
  }

  const isValidSelection = selectedStatus !== undefined

  return (
    <div className="w-full max-w-md space-y-6 py-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">What&apos;s your period status?</h2>
        <p className="text-muted-foreground">
          This helps us understand patterns between migraines and menstrual cycles
        </p>
      </div>

      <div className="space-y-4">
        <RadioGroup value={selectedStatus} onValueChange={handleStatusChange} className="space-y-3">
          {periodStatusOptions.map((option) => {
            const Icon = option.icon
            return (
              <div
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                className={`relative flex items-center space-x-4 p-4 rounded-lg border-2 transition-colors hover:bg-muted/50 cursor-pointer ${
                  selectedStatus === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/20'
                }`}
              >
                <RadioGroupItem value={option.value} id={option.value} />
                <Icon
                  className={`h-5 w-5 ${
                    selectedStatus === option.value ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                <div className="flex-1">
                  <Label htmlFor={option.value} className="text-sm font-medium cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                </div>
              </div>
            )
          })}
        </RadioGroup>

        {/* Selection Summary */}
        {isValidSelection && (
          <div className="text-center text-sm text-muted-foreground p-3 bg-muted rounded-lg">
            Period status: {selectedStatus}
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
