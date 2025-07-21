'use client'

import { useState } from 'react'
import Calendar from '@/components/tracker-calendar'
import { LoadingOverlay } from '@/components/ui/loading-overlay'

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <>
      <LoadingOverlay isLoading={isLoading} text="Loading dashboard data..." />
      <div className="@container/main flex flex-1 p-4">
        <Calendar onLoadingChange={setIsLoading} />
      </div>
    </>
  )
}
