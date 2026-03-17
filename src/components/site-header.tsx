'use client'

import { useRouter } from 'next/navigation'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ModeToggle } from '@/components/mode-toggle'

export function SiteHeader({ title, pathname }: { title: string; pathname?: string }) {
  const router = useRouter()

  const handleAddEvent = () => {
    router.push('/dashboard/add-event')
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          {pathname !== '/dashboard/add-event' && (
            <Button variant="outline" size="icon" title="Add Event" onClick={handleAddEvent}>
              <PlusIcon className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Add Event</span>
            </Button>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
