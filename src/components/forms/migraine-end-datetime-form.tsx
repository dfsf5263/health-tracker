'use client'

import React, { useState, useEffect } from 'react'
import { CalendarIcon, ClockIcon, AlertTriangle } from 'lucide-react'
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

interface MigraineEndDateTimeFormProps {
  onContinue?: () => void
  onBack?: () => void
}

export function MigraineEndDateTimeForm({ onContinue, onBack }: MigraineEndDateTimeFormProps) {
  const { formData, updateFormData } = useMigraineForm()
  const [date, setDate] = useState<Date | undefined>(formData.endDateTime)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [dateDrawerOpen, setDateDrawerOpen] = useState(false)
  const [timeDrawerOpen, setTimeDrawerOpen] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

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

  // Initialize with smart defaults
  useEffect(() => {
    if (formData.endDateTime) {
      const time = formData.endDateTime.toTimeString().slice(0, 5)
      setSelectedTime(time)
      setDate(formData.endDateTime) // Also sync the date state
    } else if (formData.startDateTime && !date) {
      // Default to start date if no end date selected yet
      setDate(formData.startDateTime)

      // Default to 2 hours after start time
      const defaultEndTime = new Date(formData.startDateTime)
      defaultEndTime.setHours(defaultEndTime.getHours() + 2)
      const defaultTimeString = defaultEndTime.toTimeString().slice(0, 5)
      setSelectedTime(defaultTimeString)
    }
  }, [formData.startDateTime, formData.endDateTime, date])

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate)
    setDateDrawerOpen(false)
    setValidationError(null)
    
    // Update form context immediately if both date and time are available
    if (newDate && selectedTime) {
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const dateTime = new Date(newDate)
      dateTime.setHours(hours, minutes, 0, 0)
      updateFormData({ endDateTime: dateTime })
    }
  }

  const handleTimeSelect = (timeValue: string) => {
    setSelectedTime(timeValue)
    setTimeDrawerOpen(false)
    setValidationError(null)
    
    // Update form context immediately if both date and time are available
    if (date && timeValue) {
      const [hours, minutes] = timeValue.split(':').map(Number)
      const dateTime = new Date(date)
      dateTime.setHours(hours, minutes, 0, 0)
      updateFormData({ endDateTime: dateTime })
    }
  }

  const validateDateTime = (endDate: Date, endTime: string): string | null => {
    if (!formData.startDateTime) {
      return 'Start date and time must be set first'
    }

    const [hours, minutes] = endTime.split(':').map(Number)
    const endDateTime = new Date(endDate)
    endDateTime.setHours(hours, minutes, 0, 0)

    if (endDateTime <= formData.startDateTime) {
      return 'End time must be after the start time'
    }

    return null
  }

  const handleContinue = () => {
    if (date && selectedTime) {
      const error = validateDateTime(date, selectedTime)
      if (error) {
        setValidationError(error)
        return
      }

      // Combine date and time into a single DateTime
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const dateTime = new Date(date)
      dateTime.setHours(hours, minutes, 0, 0)

      updateFormData({ endDateTime: dateTime })
      onContinue?.()
    }
  }

  const isValidSelection = date && selectedTime

  return (
    <div className="w-full max-w-md space-y-6 py-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">When did your migraine end?</h2>
        <p className="text-muted-foreground">Select the date and time when your migraine ended</p>
      </div>

      <div className="space-y-4">
        {/* Date Picker */}
        <div className="space-y-2">
          <Label htmlFor="end-date" className="text-sm font-medium">
            Date
          </Label>
          <Drawer open={dateDrawerOpen} onOpenChange={setDateDrawerOpen}>
            <DrawerTrigger asChild>
              <Button
                variant="outline"
                id="end-date"
                className="w-full justify-between font-normal"
              >
                {date ? date.toLocaleDateString() : 'Select date'}
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="w-auto overflow-hidden p-0">
              <DrawerHeader className="sr-only">
                <DrawerTitle>Select end date</DrawerTitle>
                <DrawerDescription>Choose when your migraine ended</DrawerDescription>
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
          <Label htmlFor="end-time" className="text-sm font-medium">
            Time
          </Label>
          <Drawer open={timeDrawerOpen} onOpenChange={setTimeDrawerOpen}>
            <DrawerTrigger asChild>
              <Button
                variant="outline"
                id="end-time"
                className="w-full justify-between font-normal"
              >
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
                <DrawerTitle>Select end time</DrawerTitle>
                <DrawerDescription>Choose the time your migraine ended</DrawerDescription>
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

        {/* Validation Error */}
        {validationError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {validationError}
          </div>
        )}

        {/* Status Message */}
        {isValidSelection && !validationError && (
          <div className="text-center text-sm text-muted-foreground p-4 bg-muted rounded-lg">
            Migraine ended on{' '}
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
          Complete
        </Button>
      </div>
    </div>
  )
}
