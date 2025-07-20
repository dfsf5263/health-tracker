'use client'

import { Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'

interface MigraineTriggerType {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

interface MigraineTriggerTypeCardProps {
  migraineTriggerType: MigraineTriggerType
  onEdit: (migraineTriggerType: MigraineTriggerType) => void
  onDelete: (migraineTriggerType: MigraineTriggerType) => void
}

export function MigraineTriggerTypeCard({
  migraineTriggerType,
  onEdit,
  onDelete,
}: MigraineTriggerTypeCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg truncate pr-2">{migraineTriggerType.name}</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(migraineTriggerType)}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit {migraineTriggerType.name}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(migraineTriggerType)}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete {migraineTriggerType.name}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
