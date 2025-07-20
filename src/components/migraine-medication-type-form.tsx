'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface MigraineMedicationType {
  id?: string
  userId?: string
  name: string
  createdAt?: string
  updatedAt?: string
}

interface MigraineMedicationTypeFormProps {
  migraineMedicationType?: MigraineMedicationType
  open: boolean
  onClose: () => void
  onSubmit: (
    migraineMedicationType: Omit<
      MigraineMedicationType,
      'id' | 'userId' | 'createdAt' | 'updatedAt'
    >
  ) => void
}

export function MigraineMedicationTypeForm({
  migraineMedicationType,
  open,
  onClose,
  onSubmit,
}: MigraineMedicationTypeFormProps) {
  const [formData, setFormData] = useState<
    Omit<MigraineMedicationType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  >({
    name: '',
  })

  // Update form data when migraineMedicationType prop changes
  useEffect(() => {
    if (migraineMedicationType) {
      setFormData({
        name: migraineMedicationType.name || '',
      })
    } else {
      // Reset form for new migraine medication type
      setFormData({
        name: '',
      })
    }
  }, [migraineMedicationType])

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
            {migraineMedicationType
              ? 'Edit Migraine Medication Type'
              : 'Add New Migraine Medication Type'}
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
                placeholder="e.g., Ibuprofen, Sumatriptan"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              {migraineMedicationType ? 'Update' : 'Create'} Type
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
