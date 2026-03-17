'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

function EmailVerifiedContent() {
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error'>('success')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    // Don't do anything while session is loading
    if (isPending) return

    // Check if there's an error parameter in the URL (from Better Auth)
    const error = searchParams.get('error')

    if (error) {
      setVerificationStatus('error')
      switch (error) {
        case 'invalid_token':
          setErrorMessage('The verification link is invalid or has expired.')
          break
        case 'token_expired':
          setErrorMessage('The verification link has expired. Please request a new one.')
          break
        default:
          setErrorMessage('Email verification failed. Please try again.')
      }
    } else {
      // No error means verification was successful
      setVerificationStatus('success')

      // Determine redirect based on session state - 5 second timeout
      setTimeout(() => {
        if (session) {
          // User is signed in, go to dashboard
          router.push('/dashboard')
        } else {
          // User needs to sign in
          router.push('/sign-in')
        }
      }, 5000)
    }
  }, [searchParams, router, session, isPending])

  const handleContinue = () => {
    if (session) {
      router.push('/dashboard')
    } else {
      router.push('/sign-in')
    }
  }

  const handleBackToSignIn = () => {
    router.push('/sign-in')
  }

  if (verificationStatus === 'error') {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Verification failed</CardTitle>
          <CardDescription className="text-center">
            We couldn&apos;t verify your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{errorMessage}</div>

          <div className="text-center text-sm text-muted-foreground">
            <p>This could happen if:</p>
            <ul className="mt-2 space-y-1 text-left">
              <li>• The verification link has expired (after 24 hours)</li>
              <li>• The link has already been used</li>
              <li>• The link is invalid or corrupted</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button type="button" className="w-full" onClick={handleBackToSignIn}>
              Back to sign in
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>Need help? Contact support for assistance with email verification.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Success state
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <CardTitle className="text-2xl">Email verified!</CardTitle>
        <CardDescription>
          {session
            ? 'Your email has been successfully verified.'
            : 'Your account is now active and ready to use.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center text-sm text-muted-foreground">
          {session ? (
            <>
              <p>Welcome back to Health Tracker!</p>
              <p className="mt-2">
                You&apos;ll be automatically redirected to your dashboard in 5 seconds.
              </p>
            </>
          ) : (
            <>
              <p>Your account has been verified and is ready to use.</p>
              <p className="mt-2">
                Please sign in to continue. You&apos;ll be redirected to the sign-in page in 5
                seconds.
              </p>
            </>
          )}
        </div>

        <div className="space-y-3">
          <Button type="button" className="w-full" onClick={handleContinue}>
            {session ? 'Continue to Dashboard' : 'Go to Sign In'}
          </Button>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <p>
            {session
              ? 'You can now start tracking your health data and insights.'
              : 'Your verified email will allow you to access all features once signed in.'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function EmailVerifiedPage() {
  return (
    <Suspense
      fallback={
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
          <Card className="mx-auto max-w-md">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Loading</CardTitle>
              <CardDescription>Please wait...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <EmailVerifiedContent />
    </Suspense>
  )
}
