import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { syncCycles } from '@/lib/sync-cycles'
import { Flow, Color } from '@prisma/client'

const createPeriodDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  }),
  flow: z.nativeEnum(Flow),
  color: z.nativeEnum(Color),
  notes: z.string().optional(),
})

export async function GET() {
  let userId: string | null = null
  let user: { id: string } | null = null

  try {
    const authResult = await auth()
    userId = authResult.userId
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const periodDays = await prisma.periodDay.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(periodDays)
  } catch (error) {
    console.error('Error fetching period days:', {
      error,
      userId,
      userDbId: user?.id,
      endpoint: 'GET /api/period-days',
    })
    return NextResponse.json({ error: 'Failed to fetch period days' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let validatedData: { date: string; flow: Flow; color: Color; notes?: string } | null = null

  try {
    const authResult = await auth()
    userId = authResult.userId
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    body = await request.json()
    validatedData = createPeriodDaySchema.parse(body)

    // Parse YYYY-MM-DD format directly to avoid timezone issues
    const [year, month, day] = validatedData.date.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    date.setUTCHours(0, 0, 0, 0)

    const periodDay = await prisma.periodDay.create({
      data: {
        userId: user.id,
        date,
        flow: validatedData.flow,
        color: validatedData.color,
        notes: validatedData.notes,
      },
    })

    await syncCycles(user.id)

    return NextResponse.json(periodDay)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error creating period day:', {
        error: error.issues,
        requestBody: body,
        userId,
        userDbId: user?.id,
        endpoint: 'POST /api/period-days',
      })
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    // Handle unique constraint violation (duplicate period day)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      let formattedDate = 'this date'

      // Format the date for user-friendly display if validation succeeded
      if (validatedData?.date) {
        const [year, month, day] = validatedData.date.split('-').map(Number)
        const dateObj = new Date(year, month - 1, day)
        formattedDate = dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      }

      console.error('Duplicate period day error:', {
        error,
        requestBody: body,
        userId,
        userDbId: user?.id,
        date: validatedData?.date,
        formattedDate,
        endpoint: 'POST /api/period-days',
      })

      return NextResponse.json(
        {
          error: `Period day already exists for ${formattedDate}. Please modify the existing period day.`,
        },
        { status: 409 }
      )
    }

    console.error('Error creating period day:', {
      error,
      requestBody: body,
      userId,
      userDbId: user?.id,
      endpoint: 'POST /api/period-days',
    })
    return NextResponse.json({ error: 'Failed to create period day' }, { status: 500 })
  }
}
