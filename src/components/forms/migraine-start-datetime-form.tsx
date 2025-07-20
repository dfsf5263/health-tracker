'use client'

import React, { useState, useEffect } from 'react'
import { CalendarIcon, ClockIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import { useMigraineForm } from './migraine-form-provider'

interface MigraineStartDateTimeFormProps {
  onContinue?: () => void
  onBack?: () => void
}

export function MigraineStartDateTimeForm({ onContinue, onBack }: MigraineStartDateTimeFormProps) {
  const { formData, updateFormData } = useMigraineForm()
  const [date, setDate] = useState<Date | undefined>(formData.startDateTime)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [dateDrawerOpen, setDateDrawerOpen] = useState(false)
  const [timeDrawerOpen, setTimeDrawerOpen] = useState(false)

  // Helper function to format time in 12-hour format
  const formatTime12Hour = (hour: number, minute: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
  }

  // Generate time slots from 12:00 AM to 11:45 PM in 15-minute intervals
  const timeSlots = Array.from({ length: 96 }, (_, i) => {
    const totalMinutes = i * 15 // Start from 12:00 AM (0 minutes)
    const hour = Math.floor(totalMinutes / 60)
    const minute = totalMinutes % 60
    const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    const display = formatTime12Hour(hour, minute)
    return { value, display }
  })

  // Initialize selectedTime from existing formData
  useEffect(() => {
    if (formData.startDateTime) {
      const time = formData.startDateTime.toTimeString().slice(0, 5)
      setSelectedTime(time)
    }
  }, [formData.startDateTime])

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate)
    setDateDrawerOpen(false)
  }

  const handleTimeSelect = (timeValue: string) => {
    setSelectedTime(timeValue)
    setTimeDrawerOpen(false)
  }

  const handleContinue = () => {
    if (date && selectedTime) {
      // Combine date and time into a single DateTime
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const dateTime = new Date(date)
      dateTime.setHours(hours, minutes, 0, 0)

      updateFormData({ startDateTime: dateTime })
      onContinue?.()
    }
  }

  const isValidSelection = date && selectedTime

  return (
    <div className="w-full max-w-md space-y-6 py-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">When did your migraine start?</h2>
        <p className="text-muted-foreground">Select the date and time when your migraine began</p>
      </div>

      <div className="space-y-4">
        {/* Date Picker */}
        <div className="space-y-2">
          <Label htmlFor="date" className="text-sm font-medium">
            Date
          </Label>
          <Drawer open={dateDrawerOpen} onOpenChange={setDateDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" id="date" className="w-full justify-between font-normal">
                {date ? date.toLocaleDateString() : 'Select date'}
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="w-auto overflow-hidden p-0">
              <DrawerHeader className="sr-only">
                <DrawerTitle>Select date</DrawerTitle>
                <DrawerDescription>Choose when your migraine started</DrawerDescription>
              </DrawerHeader>
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                className="mx-auto [--cell-size:clamp(0px,calc(100vw/7.5),52px)]"
              />
            </DrawerContent>
          </Drawer>
        </div>

        {/* Time Picker */}
        <div className="space-y-2">
          <Label htmlFor="time" className="text-sm font-medium">
            Time
          </Label>
          <Drawer open={timeDrawerOpen} onOpenChange={setTimeDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" id="time" className="w-full justify-between font-normal">
                {selectedTime
                  ? (() => {
                      const [hours, minutes] = selectedTime.split(':').map(Number)
                      return formatTime12Hour(hours, minutes)
                    })()
                  : 'Select time'}
                <ClockIcon className="h-4 w-4" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[80vh] overflow-hidden">
              <DrawerHeader className="sr-only">
                <DrawerTitle>Select time</DrawerTitle>
                <DrawerDescription>Choose the time your migraine started</DrawerDescription>
              </DrawerHeader>
              <div className="max-h-96 overflow-y-auto p-4">
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((timeSlot) => (
                    <Button
                      key={timeSlot.value}
                      variant={selectedTime === timeSlot.value ? 'default' : 'outline'}
                      onClick={() => handleTimeSelect(timeSlot.value)}
                      className="w-full text-sm"
                    >
                      {timeSlot.display}
                    </Button>
                  ))}
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Status Message */}
        {isValidSelection && (
          <div className="text-center text-sm text-muted-foreground p-4 bg-muted rounded-lg">
            Migraine started on{' '}
            <span className="font-medium">
              {date?.toLocaleDateString('en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </span>{' '}
            at{' '}
            <span className="font-medium">
              {selectedTime &&
                (() => {
                  const [hours, minutes] = selectedTime.split(':').map(Number)
                  return formatTime12Hour(hours, minutes)
                })()}
            </span>
            .
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
