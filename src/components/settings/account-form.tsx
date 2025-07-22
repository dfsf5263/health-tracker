'use client'

import { useState, useEffect } from 'react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Card } from '@/components/ui/card'
import { AlertCircle, Trash2, Mail, Calendar } from 'lucide-react'
import { apiFetch, showSuccessToast } from '@/lib/http-utils'
import { TimePickerDrawer } from '@/components/ui/time-picker-drawer'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface UserSettings {
  birthControlEmailNotifications: boolean
  ringInsertionReminderTime?: string
  ringRemovalReminderTime?: string
}

export function AccountForm() {
  const { data: session } = authClient.useSession()
  const [birthControlEmailNotifications, setBirthControlEmailNotifications] = useState(false)
  const [ringInsertionReminderTime, setRingInsertionReminderTime] = useState<string>('')
  const [ringRemovalReminderTime, setRingRemovalReminderTime] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const user = session?.user

  // Load user settings on component mount
  useEffect(() => {
    const loadUserSettings = async () => {
      const { data, error } = await apiFetch<UserSettings>('/api/user/settings')
      if (error || !data) return

      setBirthControlEmailNotifications(data.birthControlEmailNotifications)
      setRingInsertionReminderTime(data.ringInsertionReminderTime || '')
      setRingRemovalReminderTime(data.ringRemovalReminderTime || '')
    }

    if (user) {
      loadUserSettings()
    }
  }, [user])

  // Handle email notification toggle
  const handleEmailNotificationChange = async (checked: boolean) => {
    setIsLoading(true)
    setBirthControlEmailNotifications(checked)

    const { data, error } = await apiFetch<UserSettings>('/api/user/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ birthControlEmailNotifications: checked }),
    })

    if (error || !data) {
      // Revert the local state if the API call failed
      setBirthControlEmailNotifications(!checked)
      setIsLoading(false)
      return
    }

    showSuccessToast('Email notification preferences updated')
    setIsLoading(false)
  }

  // Handle time reminder updates
  const handleTimeReminderUpdate = async (field: string, value: string) => {
    setIsLoading(true)

    const { data, error } = await apiFetch<UserSettings>('/api/user/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })

    if (error || !data) {
      setIsLoading(false)
      return
    }

    showSuccessToast('Reminder time updated')
    setIsLoading(false)
  }

  // Format the creation date
  const createdDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown'

  return (
    <div className="space-y-6">
      {/* Account Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Account Information</h3>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>Email: {user?.email || 'No email'}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Account created: {createdDate}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Email Preferences */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Email Preferences</h3>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="birth-control-email-notifications">Birth Control Reminders</Label>
            <p className="text-sm text-muted-foreground">
              Receive email reminders for birth control medications and schedule
            </p>
          </div>
          <Switch
            id="birth-control-email-notifications"
            checked={birthControlEmailNotifications}
            onCheckedChange={handleEmailNotificationChange}
            disabled={isLoading}
          />
        </div>

        {/* Time Reminders - shown when email notifications are enabled */}
        {birthControlEmailNotifications && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <TimePickerDrawer
                  label="Ring insertion reminder time"
                  value={ringInsertionReminderTime}
                  onSelect={(time) => {
                    setRingInsertionReminderTime(time)
                    handleTimeReminderUpdate('ringInsertionReminderTime', time)
                  }}
                  placeholder="Select reminder time"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Time of day to receive reminders to insert your ring
                </p>
              </div>

              <div className="space-y-2">
                <TimePickerDrawer
                  label="Ring removal reminder time"
                  value={ringRemovalReminderTime}
                  onSelect={(time) => {
                    setRingRemovalReminderTime(time)
                    handleTimeReminderUpdate('ringRemovalReminderTime', time)
                  }}
                  placeholder="Select reminder time"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Time of day to receive reminders to remove your ring
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Danger Zone */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>

        <Card className="border-destructive/50 bg-destructive/5">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data
                </p>
              </div>

              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Account</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete your account and
                      remove all your data from our servers.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600" />
                      <div className="space-y-2">
                        <p className="text-sm text-amber-800 font-medium">Warning</p>
                        <p className="text-sm text-amber-700">
                          All your health tracking data, including cycles, symptoms, and migraine
                          records will be permanently deleted.
                        </p>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        // TODO: Implement account deletion
                        console.log('Delete account')
                        setDeleteDialogOpen(false)
                      }}
                    >
                      Delete My Account
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
