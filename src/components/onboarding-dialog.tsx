'use client'

import { useState } from 'react'
import { Activity, Brain, Heart, Mars, Pill, Venus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

interface OnboardingDialogProps {
  open: boolean
  onComplete: () => void
}

export function OnboardingDialog({ open, onComplete }: OnboardingDialogProps) {
  const [sex, setSex] = useState<'Male' | 'Female' | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!sex) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sex }),
      })

      if (!response.ok) {
        setError('Something went wrong. Please try again.')
        return
      }

      onComplete()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Icon header */}
        <div className="flex justify-center gap-3 pb-2 pt-1">
          <div className="rounded-full bg-rose-500/10 p-3">
            <Heart className="h-5 w-5 text-rose-500" />
          </div>
          <div className="rounded-full bg-emerald-500/10 p-3">
            <Activity className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="rounded-full bg-purple-500/10 p-3">
            <Brain className="h-5 w-5 text-purple-500" />
          </div>
          <div className="rounded-full bg-blue-500/10 p-3">
            <Pill className="h-5 w-5 text-blue-500" />
          </div>
        </div>

        <DialogHeader>
          <DialogTitle className="text-center text-xl">Welcome to Health Tracker!</DialogTitle>
          <DialogDescription className="text-center">
            We&apos;re glad you&apos;re here. Before you dive in, we have one quick question.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <p className="text-sm text-foreground font-medium">What is your biological sex?</p>
          <p className="text-xs text-muted-foreground">
            This helps us personalise the features shown to you — period tracking, birth control
            reminders, and cycle predictions are only shown for female users. You can update this
            any time in Profile Settings.
          </p>
          <RadioGroup
            value={sex}
            onValueChange={(value) => setSex(value as 'Male' | 'Female')}
            className="gap-3 pt-1"
          >
            <label
              htmlFor="sex-male"
              className={cn(
                'flex cursor-pointer items-center gap-4 rounded-lg border px-4 py-3 transition-colors hover:bg-accent',
                sex === 'Male' && 'border-primary bg-primary/5'
              )}
            >
              <RadioGroupItem value="Male" id="sex-male" className="sr-only" />
              <div className="rounded-full bg-blue-500/10 p-2">
                <Mars className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Male</p>
              </div>
            </label>

            <label
              htmlFor="sex-female"
              className={cn(
                'flex cursor-pointer items-center gap-4 rounded-lg border px-4 py-3 transition-colors hover:bg-accent',
                sex === 'Female' && 'border-primary bg-primary/5'
              )}
            >
              <RadioGroupItem value="Female" id="sex-female" className="sr-only" />
              <div className="rounded-full bg-rose-500/10 p-2">
                <Venus className="h-4 w-4 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Female</p>
              </div>
            </label>
          </RadioGroup>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!sex || isSubmitting} className="w-full">
            {isSubmitting ? 'Saving...' : 'Get Started'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
