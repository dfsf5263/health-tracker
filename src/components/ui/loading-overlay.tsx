import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

interface LoadingOverlayProps {
  isLoading: boolean
  text?: string
  className?: string
}

export function LoadingOverlay({ isLoading, text = 'Loading...', className }: LoadingOverlayProps) {
  if (!isLoading) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}
