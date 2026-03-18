'use client'

import { useEffect, useState } from 'react'
import { OnboardingDialog } from '@/components/onboarding-dialog'
import Calendar from '@/components/tracker-calendar'
import { LoadingOverlay } from '@/components/ui/loading-overlay'

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    fetch('/api/user/onboarding')
      .then((res) => res.json())
      .then((data) => {
        if (!data.completed) {
          setShowOnboarding(true)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <LoadingOverlay isLoading={isLoading} text="Loading dashboard data..." />
      <OnboardingDialog open={showOnboarding} onComplete={() => setShowOnboarding(false)} />
      <div className="@container/main flex flex-1 p-4 justify-center items-start">
        <Calendar onLoadingChange={setIsLoading} />
      </div>
    </>
  )
}
