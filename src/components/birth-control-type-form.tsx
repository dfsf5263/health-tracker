'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface BirthControlType {
  id?: string
  userId?: string
  name: string
  vaginalRingInsertion: boolean
  vaginalRingRemoval: boolean
  createdAt?: string
  updatedAt?: string
}

interface BirthControlTypeFormProps {
  birthControlType?: BirthControlType
  open: boolean
  onClose: () => void
  onSubmit: (
    birthControlType: Omit<BirthControlType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => void
}

export function BirthControlTypeForm({
  birthControlType,
  open,
  onClose,
  onSubmit,
}: BirthControlTypeFormProps) {
  const [formData, setFormData] = useState<
    Omit<BirthControlType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  >({
    name: '',
    vaginalRingInsertion: false,
    vaginalRingRemoval: false,
  })

  // Update form data when birthControlType prop changes
  useEffect(() => {
    if (birthControlType) {
      setFormData({
        name: birthControlType.name || '',
        vaginalRingInsertion: birthControlType.vaginalRingInsertion || false,
        vaginalRingRemoval: birthControlType.vaginalRingRemoval || false,
      })
    } else {
      // Reset form for new birth control type
      setFormData({
        name: '',
        vaginalRingInsertion: false,
        vaginalRingRemoval: false,
      })
    }
  }, [birthControlType])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    onSubmit({
      name: formData.name.trim(),
      vaginalRingInsertion: formData.vaginalRingInsertion,
      vaginalRingRemoval: formData.vaginalRingRemoval,
    })
  }

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {birthControlType ? 'Edit Birth Control Type' : 'Add New Birth Control Type'}
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
                placeholder="e.g., Birth Control Pills"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="vaginal-ring-insertion">Vaginal Ring Insertion</Label>
                <p className="text-sm text-muted-foreground">
                  Designate this type for vaginal ring insertion tracking
                </p>
              </div>
              <Switch
                id="vaginal-ring-insertion"
                checked={formData.vaginalRingInsertion}
                onCheckedChange={(checked) => handleInputChange('vaginalRingInsertion', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="vaginal-ring-removal">Vaginal Ring Removal</Label>
                <p className="text-sm text-muted-foreground">
                  Designate this type for vaginal ring removal tracking
                </p>
              </div>
              <Switch
                id="vaginal-ring-removal"
                checked={formData.vaginalRingRemoval}
                onCheckedChange={(checked) => handleInputChange('vaginalRingRemoval', checked)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              {birthControlType ? 'Update' : 'Create'} Type
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
