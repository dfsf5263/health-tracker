'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { authClient } from '@/lib/auth-client'
import { apiFetch, showSuccessToast } from '@/lib/http-utils'

interface UserProfile {
  firstName: string | null
  lastName: string | null
  name: string | null
  email: string
  sex: string
  daysWithoutBirthControlRing?: number
  daysWithBirthControlRing?: number
}

export function ProfileForm() {
  const { data: session, refetch } = authClient.useSession()
  const user = session?.user

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [sex, setSex] = useState<'Male' | 'Female' | ''>('')
  const [daysWithoutBirthControlRing, setDaysWithoutBirthControlRing] = useState<number>()
  const [daysWithBirthControlRing, setDaysWithBirthControlRing] = useState<number>()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Load user profile data on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return

      setIsLoadingProfile(true)
      const { data, error } = await apiFetch<UserProfile>('/api/user/profile')

      if (error || !data) {
        setIsLoadingProfile(false)
        return
      }

      setFirstName(data.firstName || '')
      setLastName(data.lastName || '')
      setSex(data.sex === 'Male' || data.sex === 'Female' ? data.sex : '')
      setDaysWithoutBirthControlRing(data.daysWithoutBirthControlRing || undefined)
      setDaysWithBirthControlRing(data.daysWithBirthControlRing || undefined)
      setIsLoadingProfile(false)
    }

    loadUserProfile()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await apiFetch<UserProfile>('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          sex: sex || undefined,
          daysWithoutBirthControlRing: daysWithoutBirthControlRing || undefined,
          daysWithBirthControlRing: daysWithBirthControlRing || undefined,
        }),
      })

      if (error || !data) {
        setIsLoading(false)
        return
      }

      showSuccessToast('Profile updated successfully')

      // Update local state with response data
      setFirstName(data.firstName || '')
      setLastName(data.lastName || '')
      setSex(data.sex === 'Male' || data.sex === 'Female' ? data.sex : '')
      setDaysWithoutBirthControlRing(data.daysWithoutBirthControlRing || undefined)
      setDaysWithBirthControlRing(data.daysWithBirthControlRing || undefined)

      // Refresh the session to update the sidebar display
      await refetch()
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Personal Information</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
              disabled={isLoadingProfile || isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
              disabled={isLoadingProfile || isLoading}
            />
          </div>

          {sex !== 'Male' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="daysWithoutRing">Days without birth control ring</Label>
                <Input
                  id="daysWithoutRing"
                  type="number"
                  min="1"
                  max="10"
                  value={daysWithoutBirthControlRing || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value, 10) : undefined
                    setDaysWithoutBirthControlRing(value)
                  }}
                  placeholder="Enter number of days"
                  disabled={isLoadingProfile || isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Number of days to keep the ring out during your cycle
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="daysWithRing">Days with birth control ring</Label>
                <Input
                  id="daysWithRing"
                  type="number"
                  min="1"
                  max="35"
                  value={daysWithBirthControlRing || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value, 10) : undefined
                    setDaysWithBirthControlRing(value)
                  }}
                  placeholder="Enter number of days"
                  disabled={isLoadingProfile || isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Number of days to keep the ring in during your cycle
                </p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="sex">Biological Sex</Label>
            <Select
              value={sex}
              onValueChange={(value) => {
                const newSex = value as 'Male' | 'Female'
                setSex(newSex)
                if (newSex === 'Male') {
                  setDaysWithoutBirthControlRing(undefined)
                  setDaysWithBirthControlRing(undefined)
                }
              }}
              disabled={isLoadingProfile || isLoading}
            >
              <SelectTrigger id="sex">
                <SelectValue placeholder="Select your sex" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={user?.email || ''} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed for security reasons
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || isLoadingProfile}>
          {isLoading ? 'Saving...' : isLoadingProfile ? 'Loading...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
