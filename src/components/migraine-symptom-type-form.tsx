'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface MigraineSymptomType {
  id?: string
  userId?: string
  name: string
  createdAt?: string
  updatedAt?: string
}

interface MigraineSymptomTypeFormProps {
  migraineSymptomType?: MigraineSymptomType
  open: boolean
  onClose: () => void
  onSubmit: (
    migraineSymptomType: Omit<MigraineSymptomType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => void
}

export function MigraineSymptomTypeForm({
  migraineSymptomType,
  open,
  onClose,
  onSubmit,
}: MigraineSymptomTypeFormProps) {
  const [formData, setFormData] = useState<
    Omit<MigraineSymptomType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  >({
    name: '',
  })

  // Update form data when migraineSymptomType prop changes
  useEffect(() => {
    if (migraineSymptomType) {
      setFormData({
        name: migraineSymptomType.name || '',
      })
    } else {
      // Reset form for new migraine symptom type
      setFormData({
        name: '',
      })
    }
  }, [migraineSymptomType])

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
            {migraineSymptomType ? 'Edit Migraine Symptom Type' : 'Add New Migraine Symptom Type'}
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
                placeholder="e.g., Nausea, Sensitivity to Light"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              {migraineSymptomType ? 'Update' : 'Create'} Type
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
