'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BirthControlTypeCard } from '@/components/birth-control-type-card'
import { BirthControlTypeForm } from '@/components/birth-control-type-form'
import { toast } from 'sonner'

interface BirthControlType {
  id: string
  userId: string
  name: string
  vaginalRingInsertion: boolean
  vaginalRingRemoval: boolean
  createdAt: string
  updatedAt: string
}

const eventTypeOptions = [
  { value: 'birth-control', label: 'Birth Control' },
  { value: 'irregular-physical', label: 'Irregular Physical' },
  { value: 'normal-physical', label: 'Normal Physical' },
  { value: 'migraine-attack-type', label: 'Migraine - Attack Type' },
  { value: 'migraine-symptom', label: 'Migraine - Symptom' },
  { value: 'migraine-potential-trigger', label: 'Migraine - Potential Trigger' },
  { value: 'migraine-precognition-type', label: 'Migraine - Precognition Type' },
  { value: 'migraine-medication', label: 'Migraine - Medication' },
  { value: 'migraine-relief-method', label: 'Migraine - Relief Method' },
  { value: 'migraine-activity-impact', label: 'Migraine - Activity Impact' },
]

export default function ManageEventTypesPage() {
  const [selectedEventType, setSelectedEventType] = useState('birth-control')
  const [birthControlTypes, setBirthControlTypes] = useState<BirthControlType[]>([])
  const [loading, setLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedBirthControlType, setSelectedBirthControlType] = useState<
    BirthControlType | undefined
  >(undefined)

  useEffect(() => {
    if (selectedEventType === 'birth-control') {
      fetchBirthControlTypes()
    }
  }, [selectedEventType])

  const fetchBirthControlTypes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/birth-control-types')
      if (!response.ok) {
        throw new Error('Failed to fetch birth control types')
      }
      const data = await response.json()
      setBirthControlTypes(data)
    } catch (error) {
      console.error('Error fetching birth control types:', error)
      toast.error('Failed to fetch birth control types')
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = async (
    formData: Omit<BirthControlType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      if (selectedBirthControlType) {
        // Edit existing type
        const response = await fetch(`/api/birth-control-types/${selectedBirthControlType.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update birth control type')
        }

        const updatedType = await response.json()
        setBirthControlTypes((prev) =>
          prev.map((type) => (type.id === selectedBirthControlType.id ? updatedType : type))
        )
        toast.success('Birth control type updated successfully')
      } else {
        // Create new type
        const response = await fetch('/api/birth-control-types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create birth control type')
        }

        const newType = await response.json()
        setBirthControlTypes((prev) => [...prev, newType])
        toast.success('Birth control type created successfully')
      }

      // Close form and reset selection
      setFormOpen(false)
      setSelectedBirthControlType(undefined)
    } catch (error) {
      console.error('Error with birth control type:', error)
      toast.error(error instanceof Error ? error.message : 'Operation failed')
      // Don't close form on error - let user retry
    }
  }

  const handleDelete = async () => {
    if (!selectedBirthControlType) return

    try {
      const response = await fetch(`/api/birth-control-types/${selectedBirthControlType.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete birth control type')
      }

      setBirthControlTypes((prev) => prev.filter((type) => type.id !== selectedBirthControlType.id))
      setDeleteDialogOpen(false)
      setSelectedBirthControlType(undefined)
      toast.success('Birth control type deleted successfully')
    } catch (error) {
      console.error('Error deleting birth control type:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete birth control type')
    }
  }

  const handleAddNew = () => {
    setSelectedBirthControlType(undefined)
    setFormOpen(true)
  }

  const handleEditClick = (birthControlType: BirthControlType) => {
    setSelectedBirthControlType(birthControlType)
    setFormOpen(true)
  }

  const handleDeleteClick = (birthControlType: BirthControlType) => {
    setSelectedBirthControlType(birthControlType)
    setDeleteDialogOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedBirthControlType(undefined)
  }

  const renderContent = () => {
    if (selectedEventType === 'birth-control') {
      if (loading) {
        return (
          <div className="flex justify-center items-center py-12">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        )
      }

      if (birthControlTypes.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-muted-foreground mb-4">No birth control types found</div>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Type
            </Button>
          </div>
        )
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {birthControlTypes.map((type) => (
            <BirthControlTypeCard
              key={type.id}
              birthControlType={type}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )
    }

    // Placeholder for other event types
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground mb-2">Coming Soon</div>
        <div className="text-sm text-muted-foreground">
          Management for {eventTypeOptions.find((opt) => opt.value === selectedEventType)?.label}{' '}
          will be available in a future update.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Label htmlFor="event-type-filter">Event Type</Label>
          <Select value={selectedEventType} onValueChange={setSelectedEventType}>
            <SelectTrigger id="event-type-filter" className="w-full sm:w-64">
              <SelectValue placeholder="Select event type" />
            </SelectTrigger>
            <SelectContent>
              {eventTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedEventType === 'birth-control' && (
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Type
          </Button>
        )}
      </div>

      {renderContent()}

      <BirthControlTypeForm
        birthControlType={selectedBirthControlType}
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Birth Control Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedBirthControlType?.name}&quot;?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
              <p className="text-sm text-destructive font-medium mb-2">Warning</p>
              <p className="text-sm text-destructive">
                This action cannot be undone. All birth control days associated with this type will
                also be deleted.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Delete Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
