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
import { IrregularPhysicalTypeCard } from '@/components/irregular-physical-type-card'
import { IrregularPhysicalTypeForm } from '@/components/irregular-physical-type-form'
import { NormalPhysicalTypeCard } from '@/components/normal-physical-type-card'
import { NormalPhysicalTypeForm } from '@/components/normal-physical-type-form'
import { MigraineAttackTypeCard } from '@/components/migraine-attack-type-card'
import { MigraineAttackTypeForm } from '@/components/migraine-attack-type-form'
import { MigraineSymptomTypeCard } from '@/components/migraine-symptom-type-card'
import { MigraineSymptomTypeForm } from '@/components/migraine-symptom-type-form'
import { MigraineTriggerTypeCard } from '@/components/migraine-trigger-type-card'
import { MigraineTriggerTypeForm } from '@/components/migraine-trigger-type-form'
import { MigrainePrecognitionTypeCard } from '@/components/migraine-precognition-type-card'
import { MigrainePrecognitionTypeForm } from '@/components/migraine-precognition-type-form'
import { MigraineMedicationTypeCard } from '@/components/migraine-medication-type-card'
import { MigraineMedicationTypeForm } from '@/components/migraine-medication-type-form'
import { MigraineReliefTypeCard } from '@/components/migraine-relief-type-card'
import { MigraineReliefTypeForm } from '@/components/migraine-relief-type-form'
import { MigraineActivityTypeCard } from '@/components/migraine-activity-type-card'
import { MigraineActivityTypeForm } from '@/components/migraine-activity-type-form'
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

interface IrregularPhysicalType {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

interface NormalPhysicalType {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

interface MigraineAttackType {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

interface MigraineSymptomType {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

interface MigraineTriggerType {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

interface MigrainePrecognitionType {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

interface MigraineMedicationType {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

interface MigraineReliefType {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

interface MigraineActivityType {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

const eventTypeOptions = [
  { value: 'birth-control', label: 'Birth Control' },
  { value: 'irregular-physical', label: 'Irregular Physical' },
  { value: 'normal-physical', label: 'Normal Physical' },
  { value: 'migraine-attack-types', label: 'Migraine - Attack' },
  { value: 'migraine-symptom-types', label: 'Migraine - Symptom' },
  { value: 'migraine-trigger-types', label: 'Migraine - Trigger' },
  { value: 'migraine-precognition-types', label: 'Migraine - Precognition' },
  { value: 'migraine-medication-types', label: 'Migraine - Medication' },
  { value: 'migraine-relief-types', label: 'Migraine - Relief' },
  { value: 'migraine-activity-types', label: 'Migraine - Activity Impact' },
]

export default function ManageEventTypesPage() {
  const [selectedEventType, setSelectedEventType] = useState('birth-control')
  const [birthControlTypes, setBirthControlTypes] = useState<BirthControlType[]>([])
  const [irregularPhysicalTypes, setIrregularPhysicalTypes] = useState<IrregularPhysicalType[]>([])
  const [normalPhysicalTypes, setNormalPhysicalTypes] = useState<NormalPhysicalType[]>([])
  const [migraineAttackTypes, setMigraineAttackTypes] = useState<MigraineAttackType[]>([])
  const [migraineSymptomTypes, setMigraineSymptomTypes] = useState<MigraineSymptomType[]>([])
  const [migraineTriggerTypes, setMigraineTriggerTypes] = useState<MigraineTriggerType[]>([])
  const [migrainePrecognitionTypes, setMigrainePrecognitionTypes] = useState<
    MigrainePrecognitionType[]
  >([])
  const [migraineMedicationTypes, setMigraineMedicationTypes] = useState<MigraineMedicationType[]>(
    []
  )
  const [migraineReliefTypes, setMigraineReliefTypes] = useState<MigraineReliefType[]>([])
  const [migraineActivityTypes, setMigraineActivityTypes] = useState<MigraineActivityType[]>([])
  const [loading, setLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedBirthControlType, setSelectedBirthControlType] = useState<
    BirthControlType | undefined
  >(undefined)
  const [selectedIrregularPhysicalType, setSelectedIrregularPhysicalType] = useState<
    IrregularPhysicalType | undefined
  >(undefined)
  const [selectedNormalPhysicalType, setSelectedNormalPhysicalType] = useState<
    NormalPhysicalType | undefined
  >(undefined)
  const [selectedMigraineAttackType, setSelectedMigraineAttackType] = useState<
    MigraineAttackType | undefined
  >(undefined)
  const [selectedMigraineSymptomType, setSelectedMigraineSymptomType] = useState<
    MigraineSymptomType | undefined
  >(undefined)
  const [selectedMigraineTriggerType, setSelectedMigraineTriggerType] = useState<
    MigraineTriggerType | undefined
  >(undefined)
  const [selectedMigrainePrecognitionType, setSelectedMigrainePrecognitionType] = useState<
    MigrainePrecognitionType | undefined
  >(undefined)
  const [selectedMigraineMedicationType, setSelectedMigraineMedicationType] = useState<
    MigraineMedicationType | undefined
  >(undefined)
  const [selectedMigraineReliefType, setSelectedMigraineReliefType] = useState<
    MigraineReliefType | undefined
  >(undefined)
  const [selectedMigraineActivityType, setSelectedMigraineActivityType] = useState<
    MigraineActivityType | undefined
  >(undefined)

  useEffect(() => {
    if (selectedEventType === 'birth-control') {
      fetchBirthControlTypes()
    } else if (selectedEventType === 'irregular-physical') {
      fetchIrregularPhysicalTypes()
    } else if (selectedEventType === 'normal-physical') {
      fetchNormalPhysicalTypes()
    } else if (selectedEventType === 'migraine-attack-types') {
      fetchMigraineAttackTypes()
    } else if (selectedEventType === 'migraine-symptom-types') {
      fetchMigraineSymptomTypes()
    } else if (selectedEventType === 'migraine-trigger-types') {
      fetchMigraineTriggerTypes()
    } else if (selectedEventType === 'migraine-precognition-types') {
      fetchMigrainePrecognitionTypes()
    } else if (selectedEventType === 'migraine-medication-types') {
      fetchMigraineMedicationTypes()
    } else if (selectedEventType === 'migraine-relief-types') {
      fetchMigraineReliefTypes()
    } else if (selectedEventType === 'migraine-activity-types') {
      fetchMigraineActivityTypes()
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

  const fetchIrregularPhysicalTypes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/irregular-physical-types')
      if (!response.ok) {
        throw new Error('Failed to fetch irregular physical types')
      }
      const data = await response.json()
      setIrregularPhysicalTypes(data)
    } catch (error) {
      console.error('Error fetching irregular physical types:', error)
      toast.error('Failed to fetch irregular physical types')
    } finally {
      setLoading(false)
    }
  }

  const fetchNormalPhysicalTypes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/normal-physical-types')
      if (!response.ok) {
        throw new Error('Failed to fetch normal physical types')
      }
      const data = await response.json()
      setNormalPhysicalTypes(data)
    } catch (error) {
      console.error('Error fetching normal physical types:', error)
      toast.error('Failed to fetch normal physical types')
    } finally {
      setLoading(false)
    }
  }

  const fetchMigraineAttackTypes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/migraine-attack-types')
      if (!response.ok) {
        throw new Error('Failed to fetch migraine attack types')
      }
      const data = await response.json()
      setMigraineAttackTypes(data)
    } catch (error) {
      console.error('Error fetching migraine attack types:', error)
      toast.error('Failed to fetch migraine attack types')
    } finally {
      setLoading(false)
    }
  }

  const fetchMigraineSymptomTypes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/migraine-symptom-types')
      if (!response.ok) {
        throw new Error('Failed to fetch migraine symptom types')
      }
      const data = await response.json()
      setMigraineSymptomTypes(data)
    } catch (error) {
      console.error('Error fetching migraine symptom types:', error)
      toast.error('Failed to fetch migraine symptom types')
    } finally {
      setLoading(false)
    }
  }

  const fetchMigraineTriggerTypes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/migraine-trigger-types')
      if (!response.ok) {
        throw new Error('Failed to fetch migraine trigger types')
      }
      const data = await response.json()
      setMigraineTriggerTypes(data)
    } catch (error) {
      console.error('Error fetching migraine trigger types:', error)
      toast.error('Failed to fetch migraine trigger types')
    } finally {
      setLoading(false)
    }
  }

  const fetchMigrainePrecognitionTypes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/migraine-precognition-types')
      if (!response.ok) {
        throw new Error('Failed to fetch migraine precognition types')
      }
      const data = await response.json()
      setMigrainePrecognitionTypes(data)
    } catch (error) {
      console.error('Error fetching migraine precognition types:', error)
      toast.error('Failed to fetch migraine precognition types')
    } finally {
      setLoading(false)
    }
  }

  const fetchMigraineMedicationTypes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/migraine-medication-types')
      if (!response.ok) {
        throw new Error('Failed to fetch migraine medication types')
      }
      const data = await response.json()
      setMigraineMedicationTypes(data)
    } catch (error) {
      console.error('Error fetching migraine medication types:', error)
      toast.error('Failed to fetch migraine medication types')
    } finally {
      setLoading(false)
    }
  }

  const fetchMigraineReliefTypes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/migraine-relief-types')
      if (!response.ok) {
        throw new Error('Failed to fetch migraine relief types')
      }
      const data = await response.json()
      setMigraineReliefTypes(data)
    } catch (error) {
      console.error('Error fetching migraine relief types:', error)
      toast.error('Failed to fetch migraine relief types')
    } finally {
      setLoading(false)
    }
  }

  const fetchMigraineActivityTypes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/migraine-activity-types')
      if (!response.ok) {
        throw new Error('Failed to fetch migraine activity types')
      }
      const data = await response.json()
      setMigraineActivityTypes(data)
    } catch (error) {
      console.error('Error fetching migraine activity types:', error)
      toast.error('Failed to fetch migraine activity types')
    } finally {
      setLoading(false)
    }
  }

  const handleBirthControlFormSubmit = async (
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

  const handleIrregularPhysicalFormSubmit = async (
    formData: Omit<IrregularPhysicalType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      if (selectedIrregularPhysicalType) {
        // Edit existing type
        const response = await fetch(
          `/api/irregular-physical-types/${selectedIrregularPhysicalType.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update irregular physical type')
        }

        const updatedType = await response.json()
        setIrregularPhysicalTypes((prev) =>
          prev.map((type) => (type.id === selectedIrregularPhysicalType.id ? updatedType : type))
        )
        toast.success('Irregular physical type updated successfully')
      } else {
        // Create new type
        const response = await fetch('/api/irregular-physical-types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create irregular physical type')
        }

        const newType = await response.json()
        setIrregularPhysicalTypes((prev) => [...prev, newType])
        toast.success('Irregular physical type created successfully')
      }

      // Close form and reset selection
      setFormOpen(false)
      setSelectedIrregularPhysicalType(undefined)
    } catch (error) {
      console.error('Error with irregular physical type:', error)
      toast.error(error instanceof Error ? error.message : 'Operation failed')
      // Don't close form on error - let user retry
    }
  }

  const handleNormalPhysicalFormSubmit = async (
    formData: Omit<NormalPhysicalType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      if (selectedNormalPhysicalType) {
        // Edit existing type
        const response = await fetch(
          `/api/normal-physical-types/${selectedNormalPhysicalType.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update normal physical type')
        }

        const updatedType = await response.json()
        setNormalPhysicalTypes((prev) =>
          prev.map((type) => (type.id === selectedNormalPhysicalType.id ? updatedType : type))
        )
        toast.success('Normal physical type updated successfully')
      } else {
        // Create new type
        const response = await fetch('/api/normal-physical-types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create normal physical type')
        }

        const newType = await response.json()
        setNormalPhysicalTypes((prev) => [...prev, newType])
        toast.success('Normal physical type created successfully')
      }

      // Close form and reset selection
      setFormOpen(false)
      setSelectedNormalPhysicalType(undefined)
    } catch (error) {
      console.error('Error with normal physical type:', error)
      toast.error(error instanceof Error ? error.message : 'Operation failed')
      // Don't close form on error - let user retry
    }
  }

  const handleMigraineAttackFormSubmit = async (
    formData: Omit<MigraineAttackType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      if (selectedMigraineAttackType) {
        // Edit existing type
        const response = await fetch(
          `/api/migraine-attack-types/${selectedMigraineAttackType.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update migraine attack type')
        }

        const updatedType = await response.json()
        setMigraineAttackTypes((prev) =>
          prev.map((type) => (type.id === selectedMigraineAttackType.id ? updatedType : type))
        )
        toast.success('Migraine attack type updated successfully')
      } else {
        // Create new type
        const response = await fetch('/api/migraine-attack-types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create migraine attack type')
        }

        const newType = await response.json()
        setMigraineAttackTypes((prev) => [...prev, newType])
        toast.success('Migraine attack type created successfully')
      }

      // Close form and reset selection
      setFormOpen(false)
      setSelectedMigraineAttackType(undefined)
    } catch (error) {
      console.error('Error with migraine attack type:', error)
      toast.error(error instanceof Error ? error.message : 'Operation failed')
      // Don't close form on error - let user retry
    }
  }

  const handleMigraineSymptomFormSubmit = async (
    formData: Omit<MigraineSymptomType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      if (selectedMigraineSymptomType) {
        // Edit existing type
        const response = await fetch(
          `/api/migraine-symptom-types/${selectedMigraineSymptomType.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update migraine symptom type')
        }

        const updatedType = await response.json()
        setMigraineSymptomTypes((prev) =>
          prev.map((type) => (type.id === selectedMigraineSymptomType.id ? updatedType : type))
        )
        toast.success('Migraine symptom type updated successfully')
      } else {
        // Create new type
        const response = await fetch('/api/migraine-symptom-types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create migraine symptom type')
        }

        const newType = await response.json()
        setMigraineSymptomTypes((prev) => [...prev, newType])
        toast.success('Migraine symptom type created successfully')
      }

      // Close form and reset selection
      setFormOpen(false)
      setSelectedMigraineSymptomType(undefined)
    } catch (error) {
      console.error('Error with migraine symptom type:', error)
      toast.error(error instanceof Error ? error.message : 'Operation failed')
      // Don't close form on error - let user retry
    }
  }

  const handleMigraineTriggerFormSubmit = async (
    formData: Omit<MigraineTriggerType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      if (selectedMigraineTriggerType) {
        // Edit existing type
        const response = await fetch(
          `/api/migraine-trigger-types/${selectedMigraineTriggerType.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update migraine trigger type')
        }

        const updatedType = await response.json()
        setMigraineTriggerTypes((prev) =>
          prev.map((type) => (type.id === selectedMigraineTriggerType.id ? updatedType : type))
        )
        toast.success('Migraine trigger type updated successfully')
      } else {
        // Create new type
        const response = await fetch('/api/migraine-trigger-types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create migraine trigger type')
        }

        const newType = await response.json()
        setMigraineTriggerTypes((prev) => [...prev, newType])
        toast.success('Migraine trigger type created successfully')
      }

      // Close form and reset selection
      setFormOpen(false)
      setSelectedMigraineTriggerType(undefined)
    } catch (error) {
      console.error('Error with migraine trigger type:', error)
      toast.error(error instanceof Error ? error.message : 'Operation failed')
      // Don't close form on error - let user retry
    }
  }

  const handleMigrainePrecognitionFormSubmit = async (
    formData: Omit<MigrainePrecognitionType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      if (selectedMigrainePrecognitionType) {
        // Edit existing type
        const response = await fetch(
          `/api/migraine-precognition-types/${selectedMigrainePrecognitionType.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update migraine precognition type')
        }

        const updatedType = await response.json()
        setMigrainePrecognitionTypes((prev) =>
          prev.map((type) => (type.id === selectedMigrainePrecognitionType.id ? updatedType : type))
        )
        toast.success('Migraine precognition type updated successfully')
      } else {
        // Create new type
        const response = await fetch('/api/migraine-precognition-types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create migraine precognition type')
        }

        const newType = await response.json()
        setMigrainePrecognitionTypes((prev) => [...prev, newType])
        toast.success('Migraine precognition type created successfully')
      }

      // Close form and reset selection
      setFormOpen(false)
      setSelectedMigrainePrecognitionType(undefined)
    } catch (error) {
      console.error('Error with migraine precognition type:', error)
      toast.error(error instanceof Error ? error.message : 'Operation failed')
      // Don't close form on error - let user retry
    }
  }

  const handleMigraineMedicationFormSubmit = async (
    formData: Omit<MigraineMedicationType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      if (selectedMigraineMedicationType) {
        // Edit existing type
        const response = await fetch(
          `/api/migraine-medication-types/${selectedMigraineMedicationType.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update migraine medication type')
        }

        const updatedType = await response.json()
        setMigraineMedicationTypes((prev) =>
          prev.map((type) => (type.id === selectedMigraineMedicationType.id ? updatedType : type))
        )
        toast.success('Migraine medication type updated successfully')
      } else {
        // Create new type
        const response = await fetch('/api/migraine-medication-types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create migraine medication type')
        }

        const newType = await response.json()
        setMigraineMedicationTypes((prev) => [...prev, newType])
        toast.success('Migraine medication type created successfully')
      }

      // Close form and reset selection
      setFormOpen(false)
      setSelectedMigraineMedicationType(undefined)
    } catch (error) {
      console.error('Error with migraine medication type:', error)
      toast.error(error instanceof Error ? error.message : 'Operation failed')
      // Don't close form on error - let user retry
    }
  }

  const handleMigraineReliefFormSubmit = async (
    formData: Omit<MigraineReliefType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      if (selectedMigraineReliefType) {
        // Edit existing type
        const response = await fetch(
          `/api/migraine-relief-types/${selectedMigraineReliefType.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update migraine relief type')
        }

        const updatedType = await response.json()
        setMigraineReliefTypes((prev) =>
          prev.map((type) => (type.id === selectedMigraineReliefType.id ? updatedType : type))
        )
        toast.success('Migraine relief type updated successfully')
      } else {
        // Create new type
        const response = await fetch('/api/migraine-relief-types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create migraine relief type')
        }

        const newType = await response.json()
        setMigraineReliefTypes((prev) => [...prev, newType])
        toast.success('Migraine relief type created successfully')
      }

      // Close form and reset selection
      setFormOpen(false)
      setSelectedMigraineReliefType(undefined)
    } catch (error) {
      console.error('Error with migraine relief type:', error)
      toast.error(error instanceof Error ? error.message : 'Operation failed')
      // Don't close form on error - let user retry
    }
  }

  const handleMigraineActivityFormSubmit = async (
    formData: Omit<MigraineActivityType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      if (selectedMigraineActivityType) {
        // Edit existing type
        const response = await fetch(
          `/api/migraine-activity-types/${selectedMigraineActivityType.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update migraine activity type')
        }

        const updatedType = await response.json()
        setMigraineActivityTypes((prev) =>
          prev.map((type) => (type.id === selectedMigraineActivityType.id ? updatedType : type))
        )
        toast.success('Migraine activity type updated successfully')
      } else {
        // Create new type
        const response = await fetch('/api/migraine-activity-types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create migraine activity type')
        }

        const newType = await response.json()
        setMigraineActivityTypes((prev) => [...prev, newType])
        toast.success('Migraine activity type created successfully')
      }

      // Close form and reset selection
      setFormOpen(false)
      setSelectedMigraineActivityType(undefined)
    } catch (error) {
      console.error('Error with migraine activity type:', error)
      toast.error(error instanceof Error ? error.message : 'Operation failed')
      // Don't close form on error - let user retry
    }
  }

  const handleDelete = async () => {
    if (selectedEventType === 'birth-control' && selectedBirthControlType) {
      try {
        const response = await fetch(`/api/birth-control-types/${selectedBirthControlType.id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete birth control type')
        }

        setBirthControlTypes((prev) =>
          prev.filter((type) => type.id !== selectedBirthControlType.id)
        )
        setDeleteDialogOpen(false)
        setSelectedBirthControlType(undefined)
        toast.success('Birth control type deleted successfully')
      } catch (error) {
        console.error('Error deleting birth control type:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to delete birth control type')
      }
    } else if (selectedEventType === 'irregular-physical' && selectedIrregularPhysicalType) {
      try {
        const response = await fetch(
          `/api/irregular-physical-types/${selectedIrregularPhysicalType.id}`,
          {
            method: 'DELETE',
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete irregular physical type')
        }

        setIrregularPhysicalTypes((prev) =>
          prev.filter((type) => type.id !== selectedIrregularPhysicalType.id)
        )
        setDeleteDialogOpen(false)
        setSelectedIrregularPhysicalType(undefined)
        toast.success('Irregular physical type deleted successfully')
      } catch (error) {
        console.error('Error deleting irregular physical type:', error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete irregular physical type'
        )
      }
    } else if (selectedEventType === 'normal-physical' && selectedNormalPhysicalType) {
      try {
        const response = await fetch(
          `/api/normal-physical-types/${selectedNormalPhysicalType.id}`,
          {
            method: 'DELETE',
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete normal physical type')
        }

        setNormalPhysicalTypes((prev) =>
          prev.filter((type) => type.id !== selectedNormalPhysicalType.id)
        )
        setDeleteDialogOpen(false)
        setSelectedNormalPhysicalType(undefined)
        toast.success('Normal physical type deleted successfully')
      } catch (error) {
        console.error('Error deleting normal physical type:', error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete normal physical type'
        )
      }
    } else if (selectedEventType === 'migraine-attack-types' && selectedMigraineAttackType) {
      try {
        const response = await fetch(
          `/api/migraine-attack-types/${selectedMigraineAttackType.id}`,
          {
            method: 'DELETE',
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete migraine attack type')
        }

        setMigraineAttackTypes((prev) =>
          prev.filter((type) => type.id !== selectedMigraineAttackType.id)
        )
        setDeleteDialogOpen(false)
        setSelectedMigraineAttackType(undefined)
        toast.success('Migraine attack type deleted successfully')
      } catch (error) {
        console.error('Error deleting migraine attack type:', error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete migraine attack type'
        )
      }
    } else if (selectedEventType === 'migraine-symptom-types' && selectedMigraineSymptomType) {
      try {
        const response = await fetch(
          `/api/migraine-symptom-types/${selectedMigraineSymptomType.id}`,
          {
            method: 'DELETE',
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete migraine symptom type')
        }

        setMigraineSymptomTypes((prev) =>
          prev.filter((type) => type.id !== selectedMigraineSymptomType.id)
        )
        setDeleteDialogOpen(false)
        setSelectedMigraineSymptomType(undefined)
        toast.success('Migraine symptom type deleted successfully')
      } catch (error) {
        console.error('Error deleting migraine symptom type:', error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete migraine symptom type'
        )
      }
    } else if (selectedEventType === 'migraine-trigger-types' && selectedMigraineTriggerType) {
      try {
        const response = await fetch(
          `/api/migraine-trigger-types/${selectedMigraineTriggerType.id}`,
          {
            method: 'DELETE',
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete migraine trigger type')
        }

        setMigraineTriggerTypes((prev) =>
          prev.filter((type) => type.id !== selectedMigraineTriggerType.id)
        )
        setDeleteDialogOpen(false)
        setSelectedMigraineTriggerType(undefined)
        toast.success('Migraine trigger type deleted successfully')
      } catch (error) {
        console.error('Error deleting migraine trigger type:', error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete migraine trigger type'
        )
      }
    } else if (
      selectedEventType === 'migraine-precognition-types' &&
      selectedMigrainePrecognitionType
    ) {
      try {
        const response = await fetch(
          `/api/migraine-precognition-types/${selectedMigrainePrecognitionType.id}`,
          {
            method: 'DELETE',
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete migraine precognition type')
        }

        setMigrainePrecognitionTypes((prev) =>
          prev.filter((type) => type.id !== selectedMigrainePrecognitionType.id)
        )
        setDeleteDialogOpen(false)
        setSelectedMigrainePrecognitionType(undefined)
        toast.success('Migraine precognition type deleted successfully')
      } catch (error) {
        console.error('Error deleting migraine precognition type:', error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete migraine precognition type'
        )
      }
    } else if (
      selectedEventType === 'migraine-medication-types' &&
      selectedMigraineMedicationType
    ) {
      try {
        const response = await fetch(
          `/api/migraine-medication-types/${selectedMigraineMedicationType.id}`,
          {
            method: 'DELETE',
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete migraine medication type')
        }

        setMigraineMedicationTypes((prev) =>
          prev.filter((type) => type.id !== selectedMigraineMedicationType.id)
        )
        setDeleteDialogOpen(false)
        setSelectedMigraineMedicationType(undefined)
        toast.success('Migraine medication type deleted successfully')
      } catch (error) {
        console.error('Error deleting migraine medication type:', error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete migraine medication type'
        )
      }
    } else if (selectedEventType === 'migraine-relief-types' && selectedMigraineReliefType) {
      try {
        const response = await fetch(
          `/api/migraine-relief-types/${selectedMigraineReliefType.id}`,
          {
            method: 'DELETE',
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete migraine relief type')
        }

        setMigraineReliefTypes((prev) =>
          prev.filter((type) => type.id !== selectedMigraineReliefType.id)
        )
        setDeleteDialogOpen(false)
        setSelectedMigraineReliefType(undefined)
        toast.success('Migraine relief type deleted successfully')
      } catch (error) {
        console.error('Error deleting migraine relief type:', error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete migraine relief type'
        )
      }
    } else if (selectedEventType === 'migraine-activity-types' && selectedMigraineActivityType) {
      try {
        const response = await fetch(
          `/api/migraine-activity-types/${selectedMigraineActivityType.id}`,
          {
            method: 'DELETE',
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete migraine activity type')
        }

        setMigraineActivityTypes((prev) =>
          prev.filter((type) => type.id !== selectedMigraineActivityType.id)
        )
        setDeleteDialogOpen(false)
        setSelectedMigraineActivityType(undefined)
        toast.success('Migraine activity type deleted successfully')
      } catch (error) {
        console.error('Error deleting migraine activity type:', error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete migraine activity type'
        )
      }
    }
  }

  const handleAddNew = () => {
    if (selectedEventType === 'birth-control') {
      setSelectedBirthControlType(undefined)
    } else if (selectedEventType === 'irregular-physical') {
      setSelectedIrregularPhysicalType(undefined)
    } else if (selectedEventType === 'normal-physical') {
      setSelectedNormalPhysicalType(undefined)
    } else if (selectedEventType === 'migraine-attack-types') {
      setSelectedMigraineAttackType(undefined)
    } else if (selectedEventType === 'migraine-symptom-types') {
      setSelectedMigraineSymptomType(undefined)
    } else if (selectedEventType === 'migraine-trigger-types') {
      setSelectedMigraineTriggerType(undefined)
    } else if (selectedEventType === 'migraine-precognition-types') {
      setSelectedMigrainePrecognitionType(undefined)
    } else if (selectedEventType === 'migraine-medication-types') {
      setSelectedMigraineMedicationType(undefined)
    } else if (selectedEventType === 'migraine-relief-types') {
      setSelectedMigraineReliefType(undefined)
    } else if (selectedEventType === 'migraine-activity-types') {
      setSelectedMigraineActivityType(undefined)
    }
    setFormOpen(true)
  }

  const handleBirthControlEditClick = (birthControlType: BirthControlType) => {
    setSelectedBirthControlType(birthControlType)
    setFormOpen(true)
  }

  const handleBirthControlDeleteClick = (birthControlType: BirthControlType) => {
    setSelectedBirthControlType(birthControlType)
    setDeleteDialogOpen(true)
  }

  const handleIrregularPhysicalEditClick = (irregularPhysicalType: IrregularPhysicalType) => {
    setSelectedIrregularPhysicalType(irregularPhysicalType)
    setFormOpen(true)
  }

  const handleIrregularPhysicalDeleteClick = (irregularPhysicalType: IrregularPhysicalType) => {
    setSelectedIrregularPhysicalType(irregularPhysicalType)
    setDeleteDialogOpen(true)
  }

  const handleNormalPhysicalEditClick = (normalPhysicalType: NormalPhysicalType) => {
    setSelectedNormalPhysicalType(normalPhysicalType)
    setFormOpen(true)
  }

  const handleNormalPhysicalDeleteClick = (normalPhysicalType: NormalPhysicalType) => {
    setSelectedNormalPhysicalType(normalPhysicalType)
    setDeleteDialogOpen(true)
  }

  const handleMigraineAttackEditClick = (migraineAttackType: MigraineAttackType) => {
    setSelectedMigraineAttackType(migraineAttackType)
    setFormOpen(true)
  }

  const handleMigraineAttackDeleteClick = (migraineAttackType: MigraineAttackType) => {
    setSelectedMigraineAttackType(migraineAttackType)
    setDeleteDialogOpen(true)
  }

  const handleMigraineSymptomEditClick = (migraineSymptomType: MigraineSymptomType) => {
    setSelectedMigraineSymptomType(migraineSymptomType)
    setFormOpen(true)
  }

  const handleMigraineSymptomDeleteClick = (migraineSymptomType: MigraineSymptomType) => {
    setSelectedMigraineSymptomType(migraineSymptomType)
    setDeleteDialogOpen(true)
  }

  const handleMigraineTriggerEditClick = (migraineTriggerType: MigraineTriggerType) => {
    setSelectedMigraineTriggerType(migraineTriggerType)
    setFormOpen(true)
  }

  const handleMigraineTriggerDeleteClick = (migraineTriggerType: MigraineTriggerType) => {
    setSelectedMigraineTriggerType(migraineTriggerType)
    setDeleteDialogOpen(true)
  }

  const handleMigrainePrecognitionEditClick = (
    migrainePrecognitionType: MigrainePrecognitionType
  ) => {
    setSelectedMigrainePrecognitionType(migrainePrecognitionType)
    setFormOpen(true)
  }

  const handleMigrainePrecognitionDeleteClick = (
    migrainePrecognitionType: MigrainePrecognitionType
  ) => {
    setSelectedMigrainePrecognitionType(migrainePrecognitionType)
    setDeleteDialogOpen(true)
  }

  const handleMigraineMedicationEditClick = (migraineMedicationType: MigraineMedicationType) => {
    setSelectedMigraineMedicationType(migraineMedicationType)
    setFormOpen(true)
  }

  const handleMigraineMedicationDeleteClick = (migraineMedicationType: MigraineMedicationType) => {
    setSelectedMigraineMedicationType(migraineMedicationType)
    setDeleteDialogOpen(true)
  }

  const handleMigraineReliefEditClick = (migraineReliefType: MigraineReliefType) => {
    setSelectedMigraineReliefType(migraineReliefType)
    setFormOpen(true)
  }

  const handleMigraineReliefDeleteClick = (migraineReliefType: MigraineReliefType) => {
    setSelectedMigraineReliefType(migraineReliefType)
    setDeleteDialogOpen(true)
  }

  const handleMigraineActivityEditClick = (migraineActivityType: MigraineActivityType) => {
    setSelectedMigraineActivityType(migraineActivityType)
    setFormOpen(true)
  }

  const handleMigraineActivityDeleteClick = (migraineActivityType: MigraineActivityType) => {
    setSelectedMigraineActivityType(migraineActivityType)
    setDeleteDialogOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedBirthControlType(undefined)
    setSelectedIrregularPhysicalType(undefined)
    setSelectedNormalPhysicalType(undefined)
    setSelectedMigraineAttackType(undefined)
    setSelectedMigraineSymptomType(undefined)
    setSelectedMigraineTriggerType(undefined)
    setSelectedMigrainePrecognitionType(undefined)
    setSelectedMigraineMedicationType(undefined)
    setSelectedMigraineReliefType(undefined)
    setSelectedMigraineActivityType(undefined)
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
              onEdit={handleBirthControlEditClick}
              onDelete={handleBirthControlDeleteClick}
            />
          ))}
        </div>
      )
    }

    if (selectedEventType === 'irregular-physical') {
      if (loading) {
        return (
          <div className="flex justify-center items-center py-12">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        )
      }

      if (irregularPhysicalTypes.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-muted-foreground mb-4">No irregular physical types found</div>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Type
            </Button>
          </div>
        )
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {irregularPhysicalTypes.map((type) => (
            <IrregularPhysicalTypeCard
              key={type.id}
              irregularPhysicalType={type}
              onEdit={handleIrregularPhysicalEditClick}
              onDelete={handleIrregularPhysicalDeleteClick}
            />
          ))}
        </div>
      )
    }

    if (selectedEventType === 'normal-physical') {
      if (loading) {
        return (
          <div className="flex justify-center items-center py-12">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        )
      }

      if (normalPhysicalTypes.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-muted-foreground mb-4">No normal physical types found</div>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Type
            </Button>
          </div>
        )
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {normalPhysicalTypes.map((type) => (
            <NormalPhysicalTypeCard
              key={type.id}
              normalPhysicalType={type}
              onEdit={handleNormalPhysicalEditClick}
              onDelete={handleNormalPhysicalDeleteClick}
            />
          ))}
        </div>
      )
    }

    if (selectedEventType === 'migraine-attack-types') {
      if (loading) {
        return (
          <div className="flex justify-center items-center py-12">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        )
      }

      if (migraineAttackTypes.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-muted-foreground mb-4">No migraine attack types found</div>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Type
            </Button>
          </div>
        )
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {migraineAttackTypes.map((type) => (
            <MigraineAttackTypeCard
              key={type.id}
              migraineAttackType={type}
              onEdit={handleMigraineAttackEditClick}
              onDelete={handleMigraineAttackDeleteClick}
            />
          ))}
        </div>
      )
    }

    if (selectedEventType === 'migraine-symptom-types') {
      if (loading) {
        return (
          <div className="flex justify-center items-center py-12">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        )
      }

      if (migraineSymptomTypes.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-muted-foreground mb-4">No migraine symptom types found</div>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Type
            </Button>
          </div>
        )
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {migraineSymptomTypes.map((type) => (
            <MigraineSymptomTypeCard
              key={type.id}
              migraineSymptomType={type}
              onEdit={handleMigraineSymptomEditClick}
              onDelete={handleMigraineSymptomDeleteClick}
            />
          ))}
        </div>
      )
    }

    if (selectedEventType === 'migraine-trigger-types') {
      if (loading) {
        return (
          <div className="flex justify-center items-center py-12">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        )
      }

      if (migraineTriggerTypes.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-muted-foreground mb-4">No migraine trigger types found</div>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Type
            </Button>
          </div>
        )
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {migraineTriggerTypes.map((type) => (
            <MigraineTriggerTypeCard
              key={type.id}
              migraineTriggerType={type}
              onEdit={handleMigraineTriggerEditClick}
              onDelete={handleMigraineTriggerDeleteClick}
            />
          ))}
        </div>
      )
    }

    if (selectedEventType === 'migraine-precognition-types') {
      if (loading) {
        return (
          <div className="flex justify-center items-center py-12">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        )
      }

      if (migrainePrecognitionTypes.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-muted-foreground mb-4">No migraine precognition types found</div>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Type
            </Button>
          </div>
        )
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {migrainePrecognitionTypes.map((type) => (
            <MigrainePrecognitionTypeCard
              key={type.id}
              migrainePrecognitionType={type}
              onEdit={handleMigrainePrecognitionEditClick}
              onDelete={handleMigrainePrecognitionDeleteClick}
            />
          ))}
        </div>
      )
    }

    if (selectedEventType === 'migraine-medication-types') {
      if (loading) {
        return (
          <div className="flex justify-center items-center py-12">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        )
      }

      if (migraineMedicationTypes.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-muted-foreground mb-4">No migraine medication types found</div>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Type
            </Button>
          </div>
        )
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {migraineMedicationTypes.map((type) => (
            <MigraineMedicationTypeCard
              key={type.id}
              migraineMedicationType={type}
              onEdit={handleMigraineMedicationEditClick}
              onDelete={handleMigraineMedicationDeleteClick}
            />
          ))}
        </div>
      )
    }

    if (selectedEventType === 'migraine-relief-types') {
      if (loading) {
        return (
          <div className="flex justify-center items-center py-12">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        )
      }

      if (migraineReliefTypes.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-muted-foreground mb-4">No migraine relief types found</div>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Type
            </Button>
          </div>
        )
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {migraineReliefTypes.map((type) => (
            <MigraineReliefTypeCard
              key={type.id}
              migraineReliefType={type}
              onEdit={handleMigraineReliefEditClick}
              onDelete={handleMigraineReliefDeleteClick}
            />
          ))}
        </div>
      )
    }

    if (selectedEventType === 'migraine-activity-types') {
      if (loading) {
        return (
          <div className="flex justify-center items-center py-12">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        )
      }

      if (migraineActivityTypes.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-muted-foreground mb-4">No migraine activity types found</div>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Type
            </Button>
          </div>
        )
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {migraineActivityTypes.map((type) => (
            <MigraineActivityTypeCard
              key={type.id}
              migraineActivityType={type}
              onEdit={handleMigraineActivityEditClick}
              onDelete={handleMigraineActivityDeleteClick}
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
        {(selectedEventType === 'birth-control' ||
          selectedEventType === 'irregular-physical' ||
          selectedEventType === 'normal-physical' ||
          selectedEventType === 'migraine-attack-types' ||
          selectedEventType === 'migraine-symptom-types' ||
          selectedEventType === 'migraine-trigger-types' ||
          selectedEventType === 'migraine-precognition-types' ||
          selectedEventType === 'migraine-medication-types' ||
          selectedEventType === 'migraine-relief-types' ||
          selectedEventType === 'migraine-activity-types') && (
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Type
          </Button>
        )}
      </div>

      {renderContent()}

      {selectedEventType === 'birth-control' && (
        <BirthControlTypeForm
          birthControlType={selectedBirthControlType}
          open={formOpen}
          onClose={handleFormClose}
          onSubmit={handleBirthControlFormSubmit}
        />
      )}

      {selectedEventType === 'irregular-physical' && (
        <IrregularPhysicalTypeForm
          irregularPhysicalType={selectedIrregularPhysicalType}
          open={formOpen}
          onClose={handleFormClose}
          onSubmit={handleIrregularPhysicalFormSubmit}
        />
      )}

      {selectedEventType === 'normal-physical' && (
        <NormalPhysicalTypeForm
          normalPhysicalType={selectedNormalPhysicalType}
          open={formOpen}
          onClose={handleFormClose}
          onSubmit={handleNormalPhysicalFormSubmit}
        />
      )}

      {selectedEventType === 'migraine-attack-types' && (
        <MigraineAttackTypeForm
          migraineAttackType={selectedMigraineAttackType}
          open={formOpen}
          onClose={handleFormClose}
          onSubmit={handleMigraineAttackFormSubmit}
        />
      )}

      {selectedEventType === 'migraine-symptom-types' && (
        <MigraineSymptomTypeForm
          migraineSymptomType={selectedMigraineSymptomType}
          open={formOpen}
          onClose={handleFormClose}
          onSubmit={handleMigraineSymptomFormSubmit}
        />
      )}

      {selectedEventType === 'migraine-trigger-types' && (
        <MigraineTriggerTypeForm
          migraineTriggerType={selectedMigraineTriggerType}
          open={formOpen}
          onClose={handleFormClose}
          onSubmit={handleMigraineTriggerFormSubmit}
        />
      )}

      {selectedEventType === 'migraine-precognition-types' && (
        <MigrainePrecognitionTypeForm
          migrainePrecognitionType={selectedMigrainePrecognitionType}
          open={formOpen}
          onClose={handleFormClose}
          onSubmit={handleMigrainePrecognitionFormSubmit}
        />
      )}

      {selectedEventType === 'migraine-medication-types' && (
        <MigraineMedicationTypeForm
          migraineMedicationType={selectedMigraineMedicationType}
          open={formOpen}
          onClose={handleFormClose}
          onSubmit={handleMigraineMedicationFormSubmit}
        />
      )}

      {selectedEventType === 'migraine-relief-types' && (
        <MigraineReliefTypeForm
          migraineReliefType={selectedMigraineReliefType}
          open={formOpen}
          onClose={handleFormClose}
          onSubmit={handleMigraineReliefFormSubmit}
        />
      )}

      {selectedEventType === 'migraine-activity-types' && (
        <MigraineActivityTypeForm
          migraineActivityType={selectedMigraineActivityType}
          open={formOpen}
          onClose={handleFormClose}
          onSubmit={handleMigraineActivityFormSubmit}
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete{' '}
              {selectedEventType === 'birth-control'
                ? 'Birth Control'
                : selectedEventType === 'irregular-physical'
                  ? 'Irregular Physical'
                  : selectedEventType === 'normal-physical'
                    ? 'Normal Physical'
                    : selectedEventType === 'migraine-attack-types'
                      ? 'Migraine Attack'
                      : selectedEventType === 'migraine-symptom-types'
                        ? 'Migraine Symptom'
                        : selectedEventType === 'migraine-trigger-types'
                          ? 'Migraine Trigger'
                          : selectedEventType === 'migraine-precognition-types'
                            ? 'Migraine Precognition'
                            : selectedEventType === 'migraine-medication-types'
                              ? 'Migraine Medication'
                              : selectedEventType === 'migraine-relief-types'
                                ? 'Migraine Relief'
                                : 'Migraine Activity'}{' '}
              Type
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;
              {selectedBirthControlType?.name ||
                selectedIrregularPhysicalType?.name ||
                selectedNormalPhysicalType?.name ||
                selectedMigraineAttackType?.name ||
                selectedMigraineSymptomType?.name ||
                selectedMigraineTriggerType?.name ||
                selectedMigrainePrecognitionType?.name ||
                selectedMigraineMedicationType?.name ||
                selectedMigraineReliefType?.name ||
                selectedMigraineActivityType?.name}
              &quot;?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
              <p className="text-sm text-destructive font-medium mb-2">Warning</p>
              <p className="text-sm text-destructive">
                This action cannot be undone. All{' '}
                {selectedEventType === 'birth-control'
                  ? 'birth control'
                  : selectedEventType === 'irregular-physical'
                    ? 'irregular physical'
                    : selectedEventType === 'normal-physical'
                      ? 'normal physical'
                      : selectedEventType === 'migraine-attack-types'
                        ? 'migraine attack'
                        : selectedEventType === 'migraine-symptom-types'
                          ? 'migraine symptom'
                          : selectedEventType === 'migraine-trigger-types'
                            ? 'migraine trigger'
                            : selectedEventType === 'migraine-precognition-types'
                              ? 'migraine precognition'
                              : selectedEventType === 'migraine-medication-types'
                                ? 'migraine medication'
                                : selectedEventType === 'migraine-relief-types'
                                  ? 'migraine relief'
                                  : 'migraine activity'}{' '}
                entries associated with this type will also be deleted.
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
