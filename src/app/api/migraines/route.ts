import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { PeriodStatus } from '@prisma/client'

const createMigraineSchema = z.object({
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime().optional(),
  painLevel: z.number().int().min(1).max(10),
  geographicLocation: z.string().trim().optional(),
  periodStatus: z.nativeEnum(PeriodStatus).optional(),
  notes: z.string().trim().optional(),
  attackTypeIds: z.array(z.string().uuid()).optional(),
  symptomTypeIds: z.array(z.string().uuid()).optional(),
  triggerTypeIds: z.array(z.string().uuid()).optional(),
  precognitionTypeIds: z.array(z.string().uuid()).optional(),
  medicationTypeIds: z.array(z.string().uuid()).optional(),
  reliefTypeIds: z.array(z.string().uuid()).optional(),
  activityTypeIds: z.array(z.string().uuid()).optional(),
  locationTypeIds: z.array(z.string().uuid()).optional(),
  medicationData: z
    .array(
      z.object({
        typeId: z.string().uuid(),
        dosageModifier: z.number(),
      })
    )
    .optional(),
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

    const migraines = await prisma.migraine.findMany({
      where: { userId: user.id },
      include: {
        migraineMigraineAttackTypes: {
          include: {
            migraineAttackType: true,
          },
        },
        migraineMigraineSymptomTypes: {
          include: {
            migraineSymptomType: true,
          },
        },
        migraineMigraineTriggerTypes: {
          include: {
            migraineTriggerType: true,
          },
        },
        migraineMigrainePrecognitionTypes: {
          include: {
            migrainePrecognitionType: true,
          },
        },
        migraineMigraineMedicationTypes: {
          include: {
            migraineMedicationType: true,
          },
        },
        migraineMigraineReliefTypes: {
          include: {
            migraineReliefType: true,
          },
        },
        migraineMigraineActivityTypes: {
          include: {
            migraineActivityType: true,
          },
        },
        migraineMigraineLocationTypes: {
          include: {
            migraineLocationType: true,
          },
        },
      },
      orderBy: { startDateTime: 'desc' },
    })

    return NextResponse.json(migraines)
  } catch (error) {
    console.error('Error fetching migraines:', {
      error,
      userId,
      userDbId: user?.id,
      endpoint: 'GET /api/migraines',
    })
    return NextResponse.json({ error: 'Failed to fetch migraines' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let userId: string | null = null
  let user: { id: string } | null = null
  let body: unknown = null
  let validatedData: z.infer<typeof createMigraineSchema> | null = null

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
    validatedData = createMigraineSchema.parse(body)

    // Convert string dates to Date objects
    const startDateTime = new Date(validatedData.startDateTime)
    const endDateTime = validatedData.endDateTime ? new Date(validatedData.endDateTime) : undefined

    // Validate that end time is after start time if provided
    if (endDateTime && endDateTime <= startDateTime) {
      return NextResponse.json(
        { error: 'End date/time must be after start date/time' },
        { status: 400 }
      )
    }

    // Use transaction to ensure all-or-nothing creation
    const result = await prisma.$transaction(async (tx) => {
      // Create the main migraine record
      const migraine = await tx.migraine.create({
        data: {
          userId: user!.id,
          startDateTime,
          endDateTime,
          painLevel: validatedData!.painLevel,
          geographicLocation: validatedData!.geographicLocation || null,
          periodStatus: validatedData!.periodStatus || null,
          notes: validatedData!.notes || null,
        },
      })

      // Create attack type relationships
      if (validatedData!.attackTypeIds?.length) {
        await tx.migraineMigraineAttackType.createMany({
          data: validatedData!.attackTypeIds.map((typeId) => ({
            migraineId: migraine.id,
            migraineAttackTypeId: typeId,
          })),
        })
      }

      // Create symptom type relationships
      if (validatedData!.symptomTypeIds?.length) {
        await tx.migraineMigraineSymptomType.createMany({
          data: validatedData!.symptomTypeIds.map((typeId) => ({
            migraineId: migraine.id,
            migraineSymptomTypeId: typeId,
          })),
        })
      }

      // Create trigger type relationships
      if (validatedData!.triggerTypeIds?.length) {
        await tx.migraineMigraineTriggerType.createMany({
          data: validatedData!.triggerTypeIds.map((typeId) => ({
            migraineId: migraine.id,
            migraineTriggerTypeId: typeId,
          })),
        })
      }

      // Create precognition type relationships
      if (validatedData!.precognitionTypeIds?.length) {
        await tx.migraineMigrainePrecognitionType.createMany({
          data: validatedData!.precognitionTypeIds.map((typeId) => ({
            migraineId: migraine.id,
            migrainePrecognitionTypeId: typeId,
          })),
        })
      }

      // Create medication type relationships with dosage modifiers
      if (validatedData!.medicationData?.length) {
        await tx.migraineMigraineMedicationType.createMany({
          data: validatedData!.medicationData.map((med) => ({
            migraineId: migraine.id,
            migraineMedicationTypeId: med.typeId,
            dosageModifier: med.dosageModifier,
          })),
        })
      }

      // Create relief type relationships
      if (validatedData!.reliefTypeIds?.length) {
        await tx.migraineMigraineReliefType.createMany({
          data: validatedData!.reliefTypeIds.map((typeId) => ({
            migraineId: migraine.id,
            migraineReliefTypeId: typeId,
          })),
        })
      }

      // Create activity type relationships
      if (validatedData!.activityTypeIds?.length) {
        await tx.migraineMigraineActivityType.createMany({
          data: validatedData!.activityTypeIds.map((typeId) => ({
            migraineId: migraine.id,
            migraineActivityTypeId: typeId,
          })),
        })
      }

      // Create location type relationships
      if (validatedData!.locationTypeIds?.length) {
        await tx.migraineMigraineLocationType.createMany({
          data: validatedData!.locationTypeIds.map((typeId) => ({
            migraineId: migraine.id,
            migraineLocationTypeId: typeId,
          })),
        })
      }

      return migraine
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error creating migraine:', {
        error: error.issues,
        requestBody: body,
        userId,
        userDbId: user?.id,
        endpoint: 'POST /api/migraines',
      })
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating migraine:', {
      error,
      requestBody: body,
      userId,
      userDbId: user?.id,
      endpoint: 'POST /api/migraines',
    })
    return NextResponse.json({ error: 'Failed to create migraine' }, { status: 500 })
  }
}
