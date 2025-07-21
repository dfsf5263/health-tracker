import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { WebhookEvent } from '@clerk/nextjs/server'
import { Webhook } from 'svix'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { prepopulateUserTypes } from '@/lib/prepopulate-user-types'
import { logApiError } from '@/lib/error-logger'
import { ApiError, generateRequestId } from '@/lib/api-response'

export async function POST(req: Request) {
  const requestId = generateRequestId()

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    await logApiError({
      request: req as NextRequest,
      error: new Error('Missing svix headers'),
      context: {
        hasSvixId: !!svix_id,
        hasSvixTimestamp: !!svix_timestamp,
        hasSvixSignature: !!svix_signature,
      },
      operation: 'validate webhook headers',
      requestId,
    })
    return ApiError.validation(
      {
        issues: [
          {
            code: 'custom',
            message: 'Missing required svix headers',
            path: ['headers'],
          },
        ],
      } as z.ZodError,
      requestId
    )
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    await logApiError({
      request: req as NextRequest,
      error: err,
      context: {
        svix_id,
        svix_timestamp,
        hasSignature: !!svix_signature,
      },
      operation: 'verify webhook signature',
      requestId,
    })
    return ApiError.validation(
      {
        issues: [
          {
            code: 'custom',
            message: 'Invalid webhook signature',
            path: ['signature'],
          },
        ],
      } as z.ZodError,
      requestId
    )
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data

    // Get primary email
    const primaryEmail = email_addresses.find(
      (email) => email.id === evt.data.primary_email_address_id
    )?.email_address

    if (!primaryEmail) {
      await logApiError({
        request: req as NextRequest,
        error: new Error('No primary email found'),
        context: {
          eventType,
          clerkUserId: id,
          emailAddresses: email_addresses.map((e) => ({
            id: e.id,
            verified: e.verification?.status,
          })),
          primaryEmailAddressId: evt.data.primary_email_address_id,
        },
        operation: 'extract primary email',
        requestId,
      })
      return ApiError.validation(
        {
          issues: [
            {
              code: 'custom',
              message: 'No primary email found for user',
              path: ['email_addresses'],
            },
          ],
        } as z.ZodError,
        requestId
      )
    }

    const upsertData = {
      clerkUserId: id,
      email: primaryEmail,
      firstName: first_name || null,
      lastName: last_name || null,
    }

    // Track the sync operation for logging
    let syncOperation = 'unknown'

    try {
      // Enhanced user sync: Look up by clerkUserId first, then by email, then create
      let result: { id: string }

      // Step 1: Look for existing user by clerkUserId
      const existingUserByClerkId = await prisma.user.findUnique({
        where: { clerkUserId: id },
      })

      if (existingUserByClerkId) {
        // Update existing user found by clerkUserId
        result = await prisma.user.update({
          where: { clerkUserId: id },
          data: {
            email: primaryEmail,
            firstName: first_name || null,
            lastName: last_name || null,
          },
        })
        syncOperation = 'updated_by_clerk_id'
        console.log(`Webhook ${eventType}: Updated user by Clerk ID - Request ID: ${requestId}`, {
          databaseUserId: result.id,
          clerkUserId: id,
          email: primaryEmail,
          operation: syncOperation,
        })
      } else {
        // Step 2: Look for existing user by email
        const existingUserByEmail = await prisma.user.findUnique({
          where: { email: primaryEmail },
        })

        if (existingUserByEmail) {
          // Update existing user found by email (sync Clerk ID)
          result = await prisma.user.update({
            where: { email: primaryEmail },
            data: {
              clerkUserId: id,
              firstName: first_name || null,
              lastName: last_name || null,
            },
          })
          syncOperation = 'updated_by_email'
          console.log(
            `Webhook ${eventType}: Updated user by email, synced Clerk ID - Request ID: ${requestId}`,
            {
              databaseUserId: result.id,
              clerkUserId: id,
              email: primaryEmail,
              operation: syncOperation,
              previousClerkUserId: existingUserByEmail.clerkUserId,
            }
          )
        } else {
          // Step 3: Create new user
          result = await prisma.user.create({
            data: upsertData,
          })
          syncOperation = 'created'
          console.log(`Webhook ${eventType}: Created new user - Request ID: ${requestId}`, {
            databaseUserId: result.id,
            clerkUserId: id,
            email: primaryEmail,
            operation: syncOperation,
          })
        }
      }

      // If this is a user creation event AND we actually created a new user, prepopulate their types
      if (eventType === 'user.created' && syncOperation === 'created') {
        try {
          await prepopulateUserTypes(result.id)
        } catch (prepopulationError) {
          await logApiError({
            request: req as NextRequest,
            error: prepopulationError,
            context: {
              eventType,
              clerkUserId: id,
              databaseUserId: result.id,
              email: primaryEmail,
              syncOperation,
            },
            operation: 'prepopulate user types',
            requestId,
          })
          // Don't re-throw here - user sync succeeded, this is a secondary operation
        }
      }
    } catch (error) {
      await logApiError({
        request: req as NextRequest,
        error,
        context: {
          eventType,
          eventData: evt.data,
          clerkUserId: id,
          primaryEmail,
          upsertData,
          syncOperation: syncOperation || 'unknown',
        },
        operation: `webhook ${eventType} user sync`,
        requestId,
      })

      return ApiError.internal(`webhook ${eventType}`, requestId)
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data

    try {
      // Delete user from database
      await prisma.user.delete({
        where: { clerkUserId: id },
      })
    } catch (error) {
      // Check if error is "Record not found" (P2025)
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        // User doesn't exist - this is fine, deletion is idempotent
        // No logging needed as the desired outcome is already achieved
        return NextResponse.json({ message: 'Webhook processed' }, { status: 200 })
      }

      // For any other error, log and re-throw
      await logApiError({
        request: req as NextRequest,
        error,
        context: {
          eventType,
          eventData: evt.data,
          clerkUserIdToDelete: id,
        },
        operation: 'webhook user.deleted',
        requestId,
      })

      return ApiError.internal('webhook user.deleted', requestId)
    }
  }

  return NextResponse.json({ message: 'Webhook processed' }, { status: 200 })
}
