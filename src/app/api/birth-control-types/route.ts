import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createBirthControlTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
  vaginalRingInsertion: z.boolean().optional(),
  vaginalRingRemoval: z.boolean().optional(),
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

    const birthControlTypes = await prisma.birthControlType.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(birthControlTypes)
  } catch (error) {
    console.error('Error fetching birth control types:', error)
    return NextResponse.json({ error: 'Failed to fetch birth control types' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let validatedData: z.infer<typeof createBirthControlTypeSchema> | null = null

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
    validatedData = createBirthControlTypeSchema.parse(body)

    // Validate vaginal ring insertion uniqueness
    if (validatedData.vaginalRingInsertion) {
      const existingInsertionType = await prisma.birthControlType.findFirst({
        where: {
          userId: user.id,
          vaginalRingInsertion: true,
        },
      })

      if (existingInsertionType) {
        return NextResponse.json(
          {
            error: `Only one birth control type can be designated for vaginal ring insertion. "${existingInsertionType.name}" is already set for insertion.`,
          },
          { status: 409 }
        )
      }
    }

    // Validate vaginal ring removal uniqueness
    if (validatedData.vaginalRingRemoval) {
      const existingRemovalType = await prisma.birthControlType.findFirst({
        where: {
          userId: user.id,
          vaginalRingRemoval: true,
        },
      })

      if (existingRemovalType) {
        return NextResponse.json(
          {
            error: `Only one birth control type can be designated for vaginal ring removal. "${existingRemovalType.name}" is already set for removal.`,
          },
          { status: 409 }
        )
      }
    }

    const birthControlType = await prisma.birthControlType.create({
      data: {
        userId: user.id,
        name: validatedData.name,
        vaginalRingInsertion: validatedData.vaginalRingInsertion || false,
        vaginalRingRemoval: validatedData.vaginalRingRemoval || false,
      },
    })

    return NextResponse.json(birthControlType, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error creating birth control type:', {
        error: error.issues,
        requestBody: body,
        userId,
        userDbId: user?.id,
        endpoint: 'POST /api/birth-control-types',
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
          error: `Birth control type "${validatedData?.name}" already exists. Please use a different name.`,
        },
        { status: 409 }
      )
    }

    console.error('Error creating birth control type:', {
      error,
      requestBody: body,
      userId,
      userDbId: user?.id,
      endpoint: 'POST /api/birth-control-types',
    })
    return NextResponse.json({ error: 'Failed to create birth control type' }, { status: 500 })
  }
}
