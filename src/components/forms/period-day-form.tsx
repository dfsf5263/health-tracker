'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Flow, Color } from '@prisma/client'

export interface PeriodDayFormData {
  date: Date
  flow: Flow
  color: Color
  notes?: string
}

interface PeriodDayFormProps {
  onSubmit: (data: PeriodDayFormData) => Promise<void>
  initialData?: Partial<PeriodDayFormData>
  submitButtonText?: string
}

export function PeriodDayForm({
  onSubmit,
  initialData,
  submitButtonText = 'Save Period Day',
}: PeriodDayFormProps) {
  const [date, setDate] = useState<Date | undefined>(initialData?.date)
  const [flow, setFlow] = useState<Flow | undefined>(initialData?.flow)
  const [color, setColor] = useState<Color | undefined>(initialData?.color)
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dateDrawerOpen, setDateDrawerOpen] = useState(false)

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    setDateDrawerOpen(false) // Close drawer immediately after selection
  }

  const handleSubmit = async () => {
    if (!date || !flow || !color) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        date,
        flow,
        color,
        notes: notes.trim() || undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = date && flow && color

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Drawer open={dateDrawerOpen} onOpenChange={setDateDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              id="date"
              variant="outline"
              className={cn('w-full justify-between font-normal', !date && 'text-muted-foreground')}
            >
              {date ? format(date, 'PPP') : 'Select date'}
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="w-auto overflow-hidden p-0">
            <DrawerHeader className="sr-only">
              <DrawerTitle>Select date</DrawerTitle>
              <DrawerDescription>Choose the date for your period day</DrawerDescription>
            </DrawerHeader>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              className="mx-auto [--cell-size:clamp(0px,calc(100vw/7.5),52px)]"
              disabled={(date) => date > new Date()}
            />
          </DrawerContent>
        </Drawer>
      </div>

      <div className="space-y-2">
        <Label htmlFor="flow">Flow</Label>
        <Select value={flow} onValueChange={(value) => setFlow(value as Flow)}>
          <SelectTrigger id="flow">
            <SelectValue placeholder="Select flow level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={Flow.Spotting}>Spotting</SelectItem>
            <SelectItem value={Flow.Light}>Light</SelectItem>
            <SelectItem value={Flow.Medium}>Medium</SelectItem>
            <SelectItem value={Flow.Heavy}>Heavy</SelectItem>
            <SelectItem value={Flow.SuperHeavy}>Super Heavy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <Select value={color} onValueChange={(value) => setColor(value as Color)}>
          <SelectTrigger id="color">
            <SelectValue placeholder="Select color" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={Color.Red}>Red</SelectItem>
            <SelectItem value={Color.Brown}>Brown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes..."
          className="resize-none"
          rows={3}
        />
      </div>

      <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting} className="w-full">
        {isSubmitting ? 'Saving...' : submitButtonText}
      </Button>
    </div>
  )
}
