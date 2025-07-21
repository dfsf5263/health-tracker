'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, RefreshCw } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'

function VerifyEmailSentContent() {
  const [isResending, setIsResending] = useState(false)
  const [email, setEmail] = useState<string>('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get email from URL params if available
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
    }
  }, [searchParams])

  const handleResendVerification = async () => {
    try {
      setIsResending(true)

      // Use Better Auth's resend verification functionality
      const { error } = await authClient.sendVerificationEmail({
        email: email,
        callbackURL: '/email-verified',
      })

      if (error) {
        toast.error('Failed to resend verification email', {
          description: error.message,
        })
        return
      }

      toast.success('Verification email sent!', {
        description: 'Please check your inbox for the new verification email.',
      })
    } catch (error) {
      toast.error('Failed to resend verification email', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setIsResending(false)
    }
  }

  const handleBackToSignIn = () => {
    router.push('/sign-in')
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-2xl">Check your email</CardTitle>
        <CardDescription className="text-center">
          We&apos;ve sent a verification link to:
        </CardDescription>
        {email && <div className="rounded-md bg-muted p-2 font-mono text-sm">{email}</div>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center text-sm text-muted-foreground">
          <p>Click the verification link in the email to activate your account.</p>
          <p className="mt-2">
            The verification link will expire in <strong>24 hours</strong>.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleResendVerification}
            disabled={isResending || !email}
          >
            {isResending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            {isResending ? 'Sending...' : 'Resend verification email'}
          </Button>

          <Button type="button" variant="ghost" className="w-full" onClick={handleBackToSignIn}>
            Back to sign in
          </Button>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <p>Didn&apos;t receive the email? Check your spam folder or try resending.</p>
          <p className="mt-1">If you&apos;re still having trouble, contact support.</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailSentPage() {
  return (
    <Suspense
      fallback={
        <Card className="mx-auto max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Loading</CardTitle>
            <CardDescription>Please wait...</CardDescription>
          </CardHeader>
        </Card>
      }
    >
      <VerifyEmailSentContent />
    </Suspense>
  )
}
