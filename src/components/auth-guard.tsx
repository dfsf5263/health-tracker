'use client'

import { useEffect } from 'react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { LoadingOverlay } from '@/components/ui/loading-overlay'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

  useEffect(() => {
    // If we're done loading and there's no session, redirect to sign-in
    if (!isPending && !session) {
      router.push('/sign-in')
    }
  }, [session, isPending, router])

  // Show loading overlay while checking session
  if (isPending) {
    return <LoadingOverlay isLoading={true} text="Checking authentication..." />
  }

  // If no session, don't render children (redirect will happen via useEffect)
  if (!session) {
    return null
  }

  // Session is valid, render the protected content
  return <>{children}</>
}
