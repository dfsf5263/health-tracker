'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { Shield, Smartphone, AlertCircle } from 'lucide-react'

export default function TwoFactorPage() {
  const router = useRouter()
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  const [isBackupMode, setIsBackupMode] = useState(false)
  const [backupCode, setBackupCode] = useState('')

  const handleVerification = async () => {
    if (verificationCode.length !== 6) return

    setIsVerifying(true)
    setError('')

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: verificationCode,
        trustDevice: true,
      })

      if (result.error) {
        throw new Error(result.error.message)
      }

      // Successfully verified, redirect to dashboard
      router.push('/dashboard')
    } catch {
      setError('Invalid verification code. Please try again.')
      setVerificationCode('')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleBackupCodeVerification = async () => {
    if (backupCode.trim().length === 0) return

    setIsVerifying(true)
    setError('')

    try {
      const result = await authClient.twoFactor.verifyBackupCode({
        code: backupCode.trim(),
      })

      if (result.error) {
        throw new Error(result.error.message)
      }

      // Successfully verified, redirect to dashboard
      router.push('/dashboard')
    } catch {
      setError('Invalid backup code. Please try again.')
      setBackupCode('')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleToggleMode = () => {
    setIsBackupMode(!isBackupMode)
    setError('')
    setVerificationCode('')
    setBackupCode('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
          <p className="text-muted-foreground">
            Enter the 6-digit code from your authenticator app to complete sign in.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              {isBackupMode ? 'Backup Recovery Code' : 'Verification Code'}
            </CardTitle>
            <CardDescription>
              {isBackupMode
                ? 'Enter one of your backup recovery codes to complete sign in.'
                : 'Open your authenticator app and enter the current verification code.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isBackupMode ? (
              <div className="space-y-2">
                <Label>Enter 6-digit code</Label>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={verificationCode} onChange={setVerificationCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Enter backup code</Label>
                <Input
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  placeholder="Enter your backup recovery code"
                  className="text-center font-mono"
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              onClick={isBackupMode ? handleBackupCodeVerification : handleVerification}
              disabled={
                isBackupMode
                  ? backupCode.trim().length === 0 || isVerifying
                  : verificationCode.length !== 6 || isVerifying
              }
              className="w-full"
            >
              {isVerifying ? 'Verifying...' : 'Verify & Continue'}
            </Button>

            <div className="text-center">
              <Button variant="ghost" onClick={handleToggleMode} className="text-sm">
                {isBackupMode ? '← Use authenticator app instead' : 'Use a backup recovery code'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="ghost" onClick={() => router.push('/sign-in')} className="text-sm">
            ← Back to sign in
          </Button>
        </div>
      </div>
    </div>
  )
}
