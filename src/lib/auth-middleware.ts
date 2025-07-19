import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface AuthContext {
  userId: string
  user: {
    id: string
    clerkUserId: string
    email: string
    firstName: string | null
    lastName: string | null
  }
}

/**
 * Middleware to verify user authentication
 * Returns the authenticated user context or an error response
 */
export async function requireAuth(): Promise<AuthContext | NextResponse> {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      id: true,
      clerkUserId: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  })

  if (!user) {
    return NextResponse.json(
      { error: 'User account not properly synced. Please sign out and sign back in.' },
      { status: 401 }
    )
  }

  return {
    userId,
    user,
  }
}
