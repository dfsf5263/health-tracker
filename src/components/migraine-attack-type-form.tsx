'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface MigraineAttackType {
  id?: string
  userId?: string
  name: string
  createdAt?: string
  updatedAt?: string
}

interface MigraineAttackTypeFormProps {
  migraineAttackType?: MigraineAttackType
  open: boolean
  onClose: () => void
  onSubmit: (
    migraineAttackType: Omit<MigraineAttackType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => void
}

export function MigraineAttackTypeForm({
  migraineAttackType,
  open,
  onClose,
  onSubmit,
}: MigraineAttackTypeFormProps) {
  const [formData, setFormData] = useState<
    Omit<MigraineAttackType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  >({
    name: '',
  })

  // Update form data when migraineAttackType prop changes
  useEffect(() => {
    if (migraineAttackType) {
      setFormData({
        name: migraineAttackType.name || '',
      })
    } else {
      // Reset form for new migraine attack type
      setFormData({
        name: '',
      })
    }
  }, [migraineAttackType])

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
            {migraineAttackType ? 'Edit Migraine Attack Type' : 'Add New Migraine Attack Type'}
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
                placeholder="e.g., Migraine, Tension Type Headache"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              {migraineAttackType ? 'Update' : 'Create'} Type
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
