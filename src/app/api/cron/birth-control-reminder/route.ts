import { NextRequest, NextResponse } from 'next/server'
import { ApiError } from '@/lib/api-response'
import { getCurrentTimeWindow, processReminderUsers } from '@/lib/birth-control-reminders'
import { sendBirthControlReminder } from '@/lib/email-service'
import { logApiError } from '@/lib/error-logger'
import { withApiLogging } from '@/lib/middleware/with-api-logging'

export const POST = withApiLogging(async (request: NextRequest) => {
  try {
    // Verify the request is from the cron job
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      await logApiError({
        request,
        error: new Error('CRON_SECRET environment variable is not set'),
        context: {},
        operation: 'verify cron secret',
      })
      return ApiError.internal('Cron secret not configured')
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      await logApiError({
        request,
        error: new Error('Invalid or missing authorization header for cron job'),
        context: {
          hasAuthHeader: !!authHeader,
        },
        operation: 'authorize cron job',
      })
      return ApiError.unauthorized()
    }

    const now = new Date()
    console.log(
      `[DEBUG] Birth control reminder cron job triggered at: ${now.toLocaleString()} (local time)`
    )

    const currentWindow = getCurrentTimeWindow()
    console.log(
      `Current time window: ${currentWindow.hour.toString().padStart(2, '0')}:${currentWindow.start.toString().padStart(2, '0')}-${currentWindow.hour.toString().padStart(2, '0')}:${currentWindow.end.toString().padStart(2, '0')} (local time)`
    )

    // Process all eligible users for reminders
    const reminderResults = await processReminderUsers()

    // Send emails for qualified users
    const details: Array<{ email: string; success: boolean; error?: string }> = []
    let successful = 0
    let failed = 0

    for (const result of reminderResults) {
      if (result.qualified && result.reminderType) {
        try {
          const emailResult = await sendBirthControlReminder({
            to: result.email,
            firstName: result.firstName,
            reminderType: result.reminderType,
          })

          if (emailResult.success) {
            successful++
            details.push({
              email: result.email,
              success: true,
            })
            console.log(`✓ Sent ${result.reminderType} reminder to ${result.email}`)
          } else {
            failed++
            details.push({
              email: result.email,
              success: false,
              error: emailResult.error || 'Email sending failed',
            })
            console.log(
              `✗ Failed to send ${result.reminderType} reminder to ${result.email}: ${emailResult.error}`
            )
          }
        } catch (error) {
          failed++
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          details.push({
            email: result.email,
            success: false,
            error: errorMessage,
          })
          console.error(`✗ Error sending reminder to ${result.email}:`, error)
        }
      } else {
        // User was processed but didn't qualify - just log for debugging
        console.log(`- Skipped ${result.email}: ${result.reason}`)
      }
    }

    const results = {
      total: reminderResults.length,
      successful,
      failed,
    }

    console.log('Birth control reminder cron job completed')
    console.log(`- Total users checked: ${results.total}`)
    console.log(`- Reminders sent: ${results.successful}`)
    console.log(`- Failed: ${results.failed}`)

    return NextResponse.json({
      success: true,
      results,
      details,
      message: 'Birth control reminder cron job completed',
    })
  } catch (error) {
    await logApiError({
      request,
      error,
      context: {},
      operation: 'birth control reminder cron job',
    })
    return ApiError.internal('birth control reminder cron job')
  }
})
