'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface MigrainePrecognitionType {
  id?: string
  userId?: string
  name: string
  createdAt?: string
  updatedAt?: string
}

interface MigrainePrecognitionTypeFormProps {
  migrainePrecognitionType?: MigrainePrecognitionType
  open: boolean
  onClose: () => void
  onSubmit: (
    migrainePrecognitionType: Omit<
      MigrainePrecognitionType,
      'id' | 'userId' | 'createdAt' | 'updatedAt'
    >
  ) => void
}

export function MigrainePrecognitionTypeForm({
  migrainePrecognitionType,
  open,
  onClose,
  onSubmit,
}: MigrainePrecognitionTypeFormProps) {
  const [formData, setFormData] = useState<
    Omit<MigrainePrecognitionType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  >({
    name: '',
  })

  // Update form data when migrainePrecognitionType prop changes
  useEffect(() => {
    if (migrainePrecognitionType) {
      setFormData({
        name: migrainePrecognitionType.name || '',
      })
    } else {
      // Reset form for new migraine precognition type
      setFormData({
        name: '',
      })
    }
  }, [migrainePrecognitionType])

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
            {migrainePrecognitionType
              ? 'Edit Migraine Precognition Type'
              : 'Add New Migraine Precognition Type'}
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
                placeholder="e.g., Aura, Visual Disturbances"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              {migrainePrecognitionType ? 'Update' : 'Create'} Type
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
