'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface MigraineReliefType {
  id?: string
  userId?: string
  name: string
  createdAt?: string
  updatedAt?: string
}

interface MigraineReliefTypeFormProps {
  migraineReliefType?: MigraineReliefType
  open: boolean
  onClose: () => void
  onSubmit: (
    migraineReliefType: Omit<MigraineReliefType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => void
}

export function MigraineReliefTypeForm({
  migraineReliefType,
  open,
  onClose,
  onSubmit,
}: MigraineReliefTypeFormProps) {
  const [formData, setFormData] = useState<
    Omit<MigraineReliefType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  >({
    name: '',
  })

  // Update form data when migraineReliefType prop changes
  useEffect(() => {
    if (migraineReliefType) {
      setFormData({
        name: migraineReliefType.name || '',
      })
    } else {
      // Reset form for new migraine relief type
      setFormData({
        name: '',
      })
    }
  }, [migraineReliefType])

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
            {migraineReliefType ? 'Edit Migraine Relief Type' : 'Add New Migraine Relief Type'}
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
                placeholder="e.g., Cold Compress, Rest in Dark Room"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              {migraineReliefType ? 'Update' : 'Create'} Type
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
