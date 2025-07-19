import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { syncCycles } from '@/lib/sync-cycles'
import { Flow, Color } from '@prisma/client'

const createPeriodDaySchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  flow: z.nativeEnum(Flow),
  color: z.nativeEnum(Color),
  notes: z.string().optional(),
})

export async function GET() {
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

    const periodDays = await prisma.periodDay.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(periodDays)
  } catch (error) {
    console.error('Error fetching period days:', error)
    return NextResponse.json({ error: 'Failed to fetch period days' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const validatedData = createPeriodDaySchema.parse(body)

    const date = new Date(validatedData.date)
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
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating period day:', error)
    return NextResponse.json({ error: 'Failed to create period day' }, { status: 500 })
  }
}
