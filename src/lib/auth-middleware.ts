import { getSession } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface AuthContext {
  userId: string
  user: {
    id: string
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
  const session = await getSession()

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  })

  if (!user) {
    return NextResponse.json(
      { error: 'User account not found. Please sign in again.' },
      { status: 401 }
    )
  }

  return {
    userId,
    user,
  }
}
