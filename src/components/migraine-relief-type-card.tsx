'use client'

import { Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'

interface MigraineReliefType {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

interface MigraineReliefTypeCardProps {
  migraineReliefType: MigraineReliefType
  onEdit: (migraineReliefType: MigraineReliefType) => void
  onDelete: (migraineReliefType: MigraineReliefType) => void
}

export function MigraineReliefTypeCard({
  migraineReliefType,
  onEdit,
  onDelete,
}: MigraineReliefTypeCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg truncate pr-2">{migraineReliefType.name}</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(migraineReliefType)}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit {migraineReliefType.name}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(migraineReliefType)}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete {migraineReliefType.name}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
