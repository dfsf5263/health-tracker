'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface NormalPhysicalType {
  id?: string
  userId?: string
  name: string
  createdAt?: string
  updatedAt?: string
}

interface NormalPhysicalTypeFormProps {
  normalPhysicalType?: NormalPhysicalType
  open: boolean
  onClose: () => void
  onSubmit: (
    normalPhysicalType: Omit<NormalPhysicalType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => void
}

export function NormalPhysicalTypeForm({
  normalPhysicalType,
  open,
  onClose,
  onSubmit,
}: NormalPhysicalTypeFormProps) {
  const [formData, setFormData] = useState<
    Omit<NormalPhysicalType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  >({
    name: '',
  })

  // Update form data when normalPhysicalType prop changes
  useEffect(() => {
    if (normalPhysicalType) {
      setFormData({
        name: normalPhysicalType.name || '',
      })
    } else {
      // Reset form for new normal physical type
      setFormData({
        name: '',
      })
    }
  }, [normalPhysicalType])

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
            {normalPhysicalType ? 'Edit Normal Physical Type' : 'Add New Normal Physical Type'}
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
                placeholder="e.g., Exercise, Hydration, Sex"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              {normalPhysicalType ? 'Update' : 'Create'} Type
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
