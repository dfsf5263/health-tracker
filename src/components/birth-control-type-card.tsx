'use client'

import { Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

interface BirthControlType {
  id: string
  userId: string
  name: string
  vaginalRingInsertion: boolean
  vaginalRingRemoval: boolean
  createdAt: string
  updatedAt: string
}

interface BirthControlTypeCardProps {
  birthControlType: BirthControlType
  onEdit: (birthControlType: BirthControlType) => void
  onDelete: (birthControlType: BirthControlType) => void
}

export function BirthControlTypeCard({
  birthControlType,
  onEdit,
  onDelete,
}: BirthControlTypeCardProps) {
  const getBadges = () => {
    const badges = []
    if (birthControlType.vaginalRingInsertion) {
      badges.push(
        <span
          key="insertion"
          className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
        >
          Ring Insertion
        </span>
      )
    }
    if (birthControlType.vaginalRingRemoval) {
      badges.push(
        <span
          key="removal"
          className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10"
        >
          Ring Removal
        </span>
      )
    }
    if (badges.length === 0) {
      badges.push(
        <span
          key="general"
          className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
        >
          General Use
        </span>
      )
    }
    return badges
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg truncate pr-2">{birthControlType.name}</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(birthControlType)}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit {birthControlType.name}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(birthControlType)}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete {birthControlType.name}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">{getBadges()}</div>
      </CardContent>
    </Card>
  )
}
