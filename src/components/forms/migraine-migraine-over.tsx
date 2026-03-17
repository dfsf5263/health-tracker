'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock } from 'lucide-react'
import { useMigraineForm } from './migraine-form-provider'

interface MigraineMigraineoverProps {
  onYes?: () => void
  onNo?: () => void
  onBack?: () => void
}

export function MigraineMigraineover({ onYes, onNo, onBack }: MigraineMigraineoverProps) {
  const { updateFormData } = useMigraineForm()

  const handleYes = () => {
    updateFormData({ isOver: true })
    onYes?.()
  }

  const handleNo = () => {
    updateFormData({ isOver: false })
    onNo?.()
  }

  return (
    <div className="w-full max-w-md space-y-6 py-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Is your migraine over?</h2>
      </div>

      <div className="space-y-4">
        {/* Yes Button */}
        <Button
          onClick={handleYes}
          variant="outline"
          size="lg"
          className="w-full h-16 text-lg font-medium flex items-center justify-center gap-3 hover:bg-muted"
        >
          <CheckCircle className="h-6 w-6" />
          Yes, it&apos;s over
        </Button>

        {/* No Button */}
        <Button
          onClick={handleNo}
          variant="outline"
          size="lg"
          className="w-full h-16 text-lg font-medium flex items-center justify-center gap-3 border-2 hover:bg-muted"
        >
          <Clock className="h-6 w-6" />
          No, it&apos;s ongoing
        </Button>
      </div>

      {/* Back Button */}
      {onBack && (
        <div className="pt-4">
          <Button variant="ghost" onClick={onBack} className="w-full">
            Back to start time
          </Button>
        </div>
      )}
    </div>
  )
}
