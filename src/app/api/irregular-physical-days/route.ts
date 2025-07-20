import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createIrregularPhysicalDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  typeId: z.string().uuid('Type ID must be a valid UUID'),
  notes: z.string().trim().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const typeId = searchParams.get('typeId')

    const whereClause: { userId: string; date?: { gte: Date; lte: Date }; typeId?: string } = {
      userId: user.id,
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (typeId) {
      whereClause.typeId = typeId
    }

    const irregularPhysicalDays = await prisma.irregularPhysicalDay.findMany({
      where: whereClause,
      include: {
        type: true,
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(irregularPhysicalDays)
  } catch (error) {
    console.error('Error fetching irregular physical days:', error)
    return NextResponse.json({ error: 'Failed to fetch irregular physical days' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let validatedData: z.infer<typeof createIrregularPhysicalDaySchema> | null = null

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
    validatedData = createIrregularPhysicalDaySchema.parse(body)

    // Verify the type belongs to the user
    const irregularPhysicalType = await prisma.irregularPhysicalType.findFirst({
      where: {
        id: validatedData.typeId,
        userId: user.id,
      },
    })

    if (!irregularPhysicalType) {
      return NextResponse.json({ error: 'Irregular physical type not found' }, { status: 404 })
    }

    const irregularPhysicalDay = await prisma.irregularPhysicalDay.create({
      data: {
        userId: user.id,
        date: new Date(validatedData.date),
        typeId: validatedData.typeId,
        notes: validatedData.notes,
      },
      include: {
        type: true,
      },
    })

    return NextResponse.json(irregularPhysicalDay, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error creating irregular physical day:', {
        error: error.issues,
        requestBody: body,
        userId,
        userDbId: user?.id,
        endpoint: 'POST /api/irregular-physical-days',
      })
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    // Handle unique constraint violation (duplicate date + type for user)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        {
          error: `Irregular physical day for this date and type already exists. Please choose a different date or type.`,
        },
        { status: 409 }
      )
    }

    console.error('Error creating irregular physical day:', {
      error,
      requestBody: body,
      userId,
      userDbId: user?.id,
      endpoint: 'POST /api/irregular-physical-days',
    })
    return NextResponse.json({ error: 'Failed to create irregular physical day' }, { status: 500 })
  }
}
