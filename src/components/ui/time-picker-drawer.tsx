'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Clock } from 'lucide-react'

interface TimePickerDrawerProps {
  value?: string // Time in HH:MM format
  onSelect: (time: string) => void
  placeholder?: string
  label?: string
  disabled?: boolean
}

// Generate array of times in 15-minute intervals (96 options total)
const generateTimeOptions = () => {
  const times: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      times.push(timeString)
    }
  }
  return times
}

// Format time for display (e.g., "09:30" -> "9:30 AM")
const formatDisplayTime = (time: string) => {
  if (!time) return ''

  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours, 10)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour

  return `${displayHour}:${minutes} ${period}`
}

export function TimePickerDrawer({
  value,
  onSelect,
  placeholder = 'Select time',
  label,
  disabled = false,
}: TimePickerDrawerProps) {
  const [open, setOpen] = useState(false)
  const timeOptions = generateTimeOptions()

  const handleSelect = (time: string) => {
    onSelect(time)
    setOpen(false)
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
            disabled={disabled}
          >
            <Clock className="mr-2 h-4 w-4" />
            {value ? formatDisplayTime(value) : placeholder}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Select Time</DrawerTitle>
            <DrawerDescription>Choose a time in 15-minute intervals</DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-6">
            <div className="max-h-[60vh] overflow-y-auto">
              <div className="grid gap-2">
                {timeOptions.map((time) => (
                  <Button
                    key={time}
                    variant={value === time ? 'default' : 'ghost'}
                    className="justify-start"
                    onClick={() => handleSelect(time)}
                  >
                    {formatDisplayTime(time)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
