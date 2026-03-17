import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiError } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-middleware'
import { logApiError } from '@/lib/error-logger'
import { withApiLogging } from '@/lib/middleware/with-api-logging'
import { prisma } from '@/lib/prisma'

const updateSettingsSchema = z.object({
  birthControlEmailNotifications: z.boolean().optional(),
  ringInsertionReminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional(),
  ringRemovalReminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional(),
})

export const GET = withApiLogging(async (request: NextRequest) => {
  let userId: string | null = null
  let user: { id: string } | null = null

  try {
    const authContext = await requireAuth()
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { userId: authUserId, user: authUser } = authContext
    userId = authUserId
    user = authUser

    const userSettings = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        birthControlEmailNotifications: true,
        ringInsertionReminderTime: true,
        ringRemovalReminderTime: true,
      },
    })

    if (!userSettings) {
      return ApiError.notFound('User')
    }

    return NextResponse.json({
      birthControlEmailNotifications: userSettings.birthControlEmailNotifications,
      ringInsertionReminderTime: userSettings.ringInsertionReminderTime?.toLocaleTimeString(
        'en-US',
        { hour12: false, hour: '2-digit', minute: '2-digit' }
      ),
      ringRemovalReminderTime: userSettings.ringRemovalReminderTime?.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      }),
    })
  } catch (error) {
    await logApiError({
      request,
      error,
      context: {
        userId,
        userDbId: user?.id,
      },
      operation: 'get user settings',
    })
    return ApiError.internal('get user settings')
  }
})

export const PUT = withApiLogging(async (request: NextRequest) => {
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null

  try {
    const authContext = await requireAuth()
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { userId: authUserId, user: authUser } = authContext
    userId = authUserId
    user = authUser

    body = await request.json()
    const validationResult = updateSettingsSchema.safeParse(body)

    if (!validationResult.success) {
      await logApiError({
        request,
        error: validationResult.error,
        context: {
          userId,
          userDbId: user.id,
          requestBody: body,
        },
        operation: 'update user settings validation',
      })
      return ApiError.validation(validationResult.error)
    }

    const { birthControlEmailNotifications, ringInsertionReminderTime, ringRemovalReminderTime } =
      validationResult.data

    const updateData: Record<string, boolean | Date> = {}
    if (birthControlEmailNotifications !== undefined) {
      updateData.birthControlEmailNotifications = birthControlEmailNotifications
    }
    if (ringInsertionReminderTime !== undefined) {
      updateData.ringInsertionReminderTime = new Date(`1970-01-01T${ringInsertionReminderTime}:00`)
    }
    if (ringRemovalReminderTime !== undefined) {
      updateData.ringRemovalReminderTime = new Date(`1970-01-01T${ringRemovalReminderTime}:00`)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No updates provided' })
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        birthControlEmailNotifications: true,
        ringInsertionReminderTime: true,
        ringRemovalReminderTime: true,
      },
    })

    return NextResponse.json({
      message: 'Settings updated successfully',
      birthControlEmailNotifications: updatedUser.birthControlEmailNotifications,
      ringInsertionReminderTime: updatedUser.ringInsertionReminderTime?.toLocaleTimeString(
        'en-US',
        { hour12: false, hour: '2-digit', minute: '2-digit' }
      ),
      ringRemovalReminderTime: updatedUser.ringRemovalReminderTime?.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      }),
    })
  } catch (error) {
    await logApiError({
      request,
      error,
      context: {
        userId,
        userDbId: user?.id,
        requestBody: body,
      },
      operation: 'update user settings',
    })
    return ApiError.internal('update user settings')
  }
})
