'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface MigraineActivityType {
  id?: string
  userId?: string
  name: string
  createdAt?: string
  updatedAt?: string
}

interface MigraineActivityTypeFormProps {
  migraineActivityType?: MigraineActivityType
  open: boolean
  onClose: () => void
  onSubmit: (
    migraineActivityType: Omit<MigraineActivityType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => void
}

export function MigraineActivityTypeForm({
  migraineActivityType,
  open,
  onClose,
  onSubmit,
}: MigraineActivityTypeFormProps) {
  const [formData, setFormData] = useState<
    Omit<MigraineActivityType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  >({
    name: '',
  })

  // Update form data when migraineActivityType prop changes
  useEffect(() => {
    if (migraineActivityType) {
      setFormData({
        name: migraineActivityType.name || '',
      })
    } else {
      // Reset form for new migraine activity type
      setFormData({
        name: '',
      })
    }
  }, [migraineActivityType])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    onSubmit({
      name: formData.name.trim(),
    })
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {migraineActivityType
              ? 'Edit Migraine Activity Type'
              : 'Add New Migraine Activity Type'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Type Name</Label>
            <div className="mt-2">
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Exercise, Work, Sleep"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              {migraineActivityType ? 'Update' : 'Create'} Type
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
