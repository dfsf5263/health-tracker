import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiError } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-middleware'
import { logApiError } from '@/lib/error-logger'
import { withApiLogging } from '@/lib/middleware/with-api-logging'
import { prisma } from '@/lib/prisma'

const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').optional(),
  lastName: z.string().trim().min(1, 'Last name is required').optional(),
  daysWithoutBirthControlRing: z.number().int().min(1).optional(),
  daysWithBirthControlRing: z.number().int().min(1).optional(),
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

    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        daysWithoutBirthControlRing: true,
        daysWithBirthControlRing: true,
      },
    })

    if (!userProfile) {
      return ApiError.notFound('User')
    }

    return NextResponse.json({
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      name: userProfile.name,
      email: userProfile.email,
      daysWithoutBirthControlRing: userProfile.daysWithoutBirthControlRing,
      daysWithBirthControlRing: userProfile.daysWithBirthControlRing,
    })
  } catch (error) {
    await logApiError({
      request,
      error,
      context: {
        userId,
        userDbId: user?.id,
      },
      operation: 'get user profile',
    })
    return ApiError.internal('get user profile')
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
    const validationResult = updateProfileSchema.safeParse(body)

    if (!validationResult.success) {
      await logApiError({
        request,
        error: validationResult.error,
        context: {
          userId,
          userDbId: user.id,
          requestBody: body,
        },
        operation: 'update user profile validation',
      })
      return ApiError.validation(validationResult.error)
    }

    const { firstName, lastName, daysWithoutBirthControlRing, daysWithBirthControlRing } =
      validationResult.data

    // Build update data object
    const updateData: Record<string, string | number | null> = {}
    if (firstName !== undefined) {
      updateData.firstName = firstName
    }
    if (lastName !== undefined) {
      updateData.lastName = lastName
    }
    if (daysWithoutBirthControlRing !== undefined) {
      updateData.daysWithoutBirthControlRing = daysWithoutBirthControlRing
    }
    if (daysWithBirthControlRing !== undefined) {
      updateData.daysWithBirthControlRing = daysWithBirthControlRing
    }

    // Update the combined name field if we have both first and last names
    if (firstName !== undefined || lastName !== undefined) {
      // Get current user data to build the full name
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { firstName: true, lastName: true },
      })

      if (currentUser) {
        const newFirstName = firstName !== undefined ? firstName : currentUser.firstName
        const newLastName = lastName !== undefined ? lastName : currentUser.lastName
        const fullName = [newFirstName, newLastName].filter(Boolean).join(' ')
        updateData.name = fullName || null
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No updates provided' })
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        daysWithoutBirthControlRing: true,
        daysWithBirthControlRing: true,
      },
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      name: updatedUser.name,
      email: updatedUser.email,
      daysWithoutBirthControlRing: updatedUser.daysWithoutBirthControlRing,
      daysWithBirthControlRing: updatedUser.daysWithBirthControlRing,
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
      operation: 'update user profile',
    })
    return ApiError.internal('update user profile')
  }
})
