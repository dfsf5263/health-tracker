'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, Plus, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface BirthControlType {
  id: string
  userId: string
  name: string
  vaginalRingInsertion: boolean
  vaginalRingRemoval: boolean
  createdAt: string
  updatedAt: string
}

export interface BirthControlDayFormData {
  date: Date
  typeId: string
  notes?: string
}

interface BirthControlDayFormProps {
  onSubmit: (data: BirthControlDayFormData) => Promise<void>
  onCreateNewType: () => void
  birthControlTypes: BirthControlType[]
  isLoadingTypes: boolean
  initialData?: Partial<BirthControlDayFormData>
  submitButtonText?: string
}

export function BirthControlDayForm({
  onSubmit,
  onCreateNewType,
  birthControlTypes,
  isLoadingTypes,
  initialData,
  submitButtonText = 'Save Birth Control Day',
}: BirthControlDayFormProps) {
  const [date, setDate] = useState<Date | undefined>(initialData?.date)
  const [typeId, setTypeId] = useState<string | undefined>(initialData?.typeId)
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    setDatePickerOpen(false) // Close popover immediately after selection
  }

  const handleSubmit = async () => {
    if (!date || !typeId) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        date,
        typeId,
        notes: notes.trim() || undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = date && typeId

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'PPP') : 'Select date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
              disabled={(date) => date > new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Birth Control Type</Label>
        <div className="flex gap-2">
          <Select value={typeId} onValueChange={setTypeId} disabled={isLoadingTypes}>
            <SelectTrigger id="type" className="flex-1">
              <SelectValue
                placeholder={isLoadingTypes ? 'Loading types...' : 'Select birth control type'}
              />
            </SelectTrigger>
            <SelectContent>
              {birthControlTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onCreateNewType}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Create new birth control type</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  <span>Click to create a new birth control type</span>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
