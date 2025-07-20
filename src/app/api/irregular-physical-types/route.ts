import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createIrregularPhysicalTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
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

    const irregularPhysicalTypes = await prisma.irregularPhysicalType.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(irregularPhysicalTypes)
  } catch (error) {
    console.error('Error fetching irregular physical types:', error)
    return NextResponse.json({ error: 'Failed to fetch irregular physical types' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let validatedData: z.infer<typeof createIrregularPhysicalTypeSchema> | null = null

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
    validatedData = createIrregularPhysicalTypeSchema.parse(body)

    const irregularPhysicalType = await prisma.irregularPhysicalType.create({
      data: {
        userId: user.id,
        name: validatedData.name,
      },
    })

    return NextResponse.json(irregularPhysicalType, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error creating irregular physical type:', {
        error: error.issues,
        requestBody: body,
        userId,
        userDbId: user?.id,
        endpoint: 'POST /api/irregular-physical-types',
      })
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    // Handle unique constraint violation (duplicate name)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        {
          error: `Irregular physical type "${validatedData?.name}" already exists. Please use a different name.`,
        },
        { status: 409 }
      )
    }

    console.error('Error creating irregular physical type:', {
      error,
      requestBody: body,
      userId,
      userDbId: user?.id,
      endpoint: 'POST /api/irregular-physical-types',
    })
    return NextResponse.json({ error: 'Failed to create irregular physical type' }, { status: 500 })
  }
}
