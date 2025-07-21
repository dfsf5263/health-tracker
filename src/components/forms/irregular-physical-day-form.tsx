'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, Plus, Info } from 'lucide-react'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface IrregularPhysicalType {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface IrregularPhysicalDayFormData {
  date: Date
  typeId: string
  notes?: string
}

interface IrregularPhysicalDayFormProps {
  onSubmit: (data: IrregularPhysicalDayFormData) => Promise<void>
  onCreateNewType: () => void
  irregularPhysicalTypes: IrregularPhysicalType[]
  isLoadingTypes: boolean
  initialData?: Partial<IrregularPhysicalDayFormData>
  submitButtonText?: string
}

export function IrregularPhysicalDayForm({
  onSubmit,
  onCreateNewType,
  irregularPhysicalTypes,
  isLoadingTypes,
  initialData,
  submitButtonText = 'Save Irregular Physical Day',
}: IrregularPhysicalDayFormProps) {
  const [date, setDate] = useState<Date | undefined>(initialData?.date)
  const [typeId, setTypeId] = useState<string | undefined>(initialData?.typeId)
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dateDrawerOpen, setDateDrawerOpen] = useState(false)

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    setDateDrawerOpen(false) // Close drawer immediately after selection
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
        <Drawer open={dateDrawerOpen} onOpenChange={setDateDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              id="date"
              variant="outline"
              className={cn(
                'w-full justify-between font-normal',
                !date && 'text-muted-foreground'
              )}
            >
              {date ? format(date, 'PPP') : 'Select date'}
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="w-auto overflow-hidden p-0">
            <DrawerHeader className="sr-only">
              <DrawerTitle>Select date</DrawerTitle>
              <DrawerDescription>Choose the date for your irregular physical day</DrawerDescription>
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
        <Label htmlFor="type">Irregular Physical Type</Label>
        <div className="flex gap-2">
          <Select value={typeId} onValueChange={setTypeId} disabled={isLoadingTypes}>
            <SelectTrigger id="type" className="flex-1">
              <SelectValue
                placeholder={isLoadingTypes ? 'Loading types...' : 'Select irregular physical type'}
              />
            </SelectTrigger>
            <SelectContent>
              {irregularPhysicalTypes.map((type) => (
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
                  <span className="sr-only">Create new irregular physical type</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  <span>Click to create a new irregular physical type</span>
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
