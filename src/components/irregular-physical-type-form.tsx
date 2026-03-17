'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface IrregularPhysicalType {
  id?: string
  userId?: string
  name: string
  createdAt?: string
  updatedAt?: string
}

interface IrregularPhysicalTypeFormProps {
  irregularPhysicalType?: IrregularPhysicalType
  open: boolean
  onClose: () => void
  onSubmit: (
    irregularPhysicalType: Omit<IrregularPhysicalType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => void
}

export function IrregularPhysicalTypeForm({
  irregularPhysicalType,
  open,
  onClose,
  onSubmit,
}: IrregularPhysicalTypeFormProps) {
  const [formData, setFormData] = useState<
    Omit<IrregularPhysicalType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  >({
    name: '',
  })

  // Update form data when irregularPhysicalType prop changes
  useEffect(() => {
    if (irregularPhysicalType) {
      setFormData({
        name: irregularPhysicalType.name || '',
      })
    } else {
      // Reset form for new irregular physical type
      setFormData({
        name: '',
      })
    }
  }, [irregularPhysicalType])

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
            {irregularPhysicalType
              ? 'Edit Irregular Physical Type'
              : 'Add New Irregular Physical Type'}
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
                placeholder="e.g., Breast Tenderness, Cramps"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              {irregularPhysicalType ? 'Update' : 'Create'} Type
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
