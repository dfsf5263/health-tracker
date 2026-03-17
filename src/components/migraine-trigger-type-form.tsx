'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface MigraineTriggerType {
  id?: string
  userId?: string
  name: string
  createdAt?: string
  updatedAt?: string
}

interface MigraineTriggerTypeFormProps {
  migraineTriggerType?: MigraineTriggerType
  open: boolean
  onClose: () => void
  onSubmit: (
    migraineTriggerType: Omit<MigraineTriggerType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => void
}

export function MigraineTriggerTypeForm({
  migraineTriggerType,
  open,
  onClose,
  onSubmit,
}: MigraineTriggerTypeFormProps) {
  const [formData, setFormData] = useState<
    Omit<MigraineTriggerType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  >({
    name: '',
  })

  // Update form data when migraineTriggerType prop changes
  useEffect(() => {
    if (migraineTriggerType) {
      setFormData({
        name: migraineTriggerType.name || '',
      })
    } else {
      // Reset form for new migraine trigger type
      setFormData({
        name: '',
      })
    }
  }, [migraineTriggerType])

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
            {migraineTriggerType ? 'Edit Migraine Trigger Type' : 'Add New Migraine Trigger Type'}
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
                placeholder="e.g., Stress, Lack of Sleep"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              {migraineTriggerType ? 'Update' : 'Create'} Type
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
