import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createNormalPhysicalDaySchema = z.object({
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

    const normalPhysicalDays = await prisma.normalPhysicalDay.findMany({
      where: whereClause,
      include: {
        type: true,
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(normalPhysicalDays)
  } catch (error) {
    console.error('Error fetching normal physical days:', error)
    return NextResponse.json({ error: 'Failed to fetch normal physical days' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let validatedData: z.infer<typeof createNormalPhysicalDaySchema> | null = null

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
    validatedData = createNormalPhysicalDaySchema.parse(body)

    // Verify the type belongs to the user
    const normalPhysicalType = await prisma.normalPhysicalType.findFirst({
      where: {
        id: validatedData.typeId,
        userId: user.id,
      },
    })

    if (!normalPhysicalType) {
      return NextResponse.json({ error: 'Normal physical type not found' }, { status: 404 })
    }

    const normalPhysicalDay = await prisma.normalPhysicalDay.create({
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

    return NextResponse.json(normalPhysicalDay, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error creating normal physical day:', {
        error: error.issues,
        requestBody: body,
        userId,
        userDbId: user?.id,
        endpoint: 'POST /api/normal-physical-days',
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
          error: `Normal physical day for this date and type already exists. Please choose a different date or type.`,
        },
        { status: 409 }
      )
    }

    console.error('Error creating normal physical day:', {
      error,
      requestBody: body,
      userId,
      userDbId: user?.id,
      endpoint: 'POST /api/normal-physical-days',
    })
    return NextResponse.json({ error: 'Failed to create normal physical day' }, { status: 500 })
  }
}
