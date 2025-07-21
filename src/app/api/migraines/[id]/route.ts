import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { PeriodStatus } from '@prisma/client'
import { logApiError } from '@/lib/error-logger'
import { ApiError, generateRequestId } from '@/lib/api-response'

const updateMigraineSchema = z.object({
  startDateTime: z.string().datetime().optional(),
  endDateTime: z.string().datetime().optional(),
  painLevel: z.number().int().min(1).max(10).optional(),
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = generateRequestId()
  let userId: string | null = null
  let user: { id: string } | null = null
  let id: string | null = null

  try {
    const authResult = await auth()
    userId = authResult.userId
    if (!userId) {
      return ApiError.unauthorized(requestId)
    }

    user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    })

    if (!user) {
      return ApiError.notFound('User', requestId)
    }

    const { id: paramId } = await params
    id = paramId

    const migraine = await prisma.migraine.findFirst({
      where: {
        id,
        userId: user.id,
      },
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
    })

    if (!migraine) {
      return ApiError.notFound('Migraine', requestId)
    }

    return NextResponse.json(migraine)
  } catch (error) {
    await logApiError({
      request,
      error,
      context: {
        userId,
        userDbId: user?.id,
        migraineId: id,
      },
      operation: 'fetch migraine',
      requestId,
    })
    return ApiError.internal('fetch migraine', requestId)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = generateRequestId()
  let userId: string | null = null
  let user: { id: string } | null = null
  let id: string | null = null
  let body: unknown = null
  let validatedData: z.infer<typeof updateMigraineSchema> | null = null

  try {
    const authResult = await auth()
    userId = authResult.userId
    if (!userId) {
      return ApiError.unauthorized(requestId)
    }

    user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    })

    if (!user) {
      return ApiError.notFound('User', requestId)
    }

    const { id: paramId } = await params
    id = paramId

    // Check if the migraine exists and belongs to the user
    const existingMigraine = await prisma.migraine.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingMigraine) {
      return ApiError.notFound('Migraine', requestId)
    }

    body = await request.json()
    validatedData = updateMigraineSchema.parse(body)

    // Convert string dates to Date objects if provided
    const startDateTime = validatedData.startDateTime
      ? new Date(validatedData.startDateTime)
      : undefined
    const endDateTime = validatedData.endDateTime ? new Date(validatedData.endDateTime) : undefined

    // Validate that end time is after start time if both provided
    if (startDateTime && endDateTime && endDateTime <= startDateTime) {
      return ApiError.validation(
        {
          issues: [
            {
              code: 'custom',
              message: 'End date/time must be after start date/time',
              path: ['endDateTime'],
            },
          ],
        } as z.ZodError,
        requestId
      )
    }

    // Use transaction to ensure all-or-nothing update
    await prisma.$transaction(async (tx) => {
      // Prepare update data
      const updateData: {
        startDateTime?: Date
        endDateTime?: Date
        painLevel?: number
        geographicLocation?: string | null
        periodStatus?: 'Yes' | 'No' | 'Upcoming' | null
        notes?: string | null
      } = {}
      if (startDateTime !== undefined) updateData.startDateTime = startDateTime
      if (endDateTime !== undefined) updateData.endDateTime = endDateTime
      if (validatedData!.painLevel !== undefined) updateData.painLevel = validatedData!.painLevel
      if (validatedData!.geographicLocation !== undefined)
        updateData.geographicLocation = validatedData!.geographicLocation || null
      if (validatedData!.periodStatus !== undefined)
        updateData.periodStatus = validatedData!.periodStatus || null
      if (validatedData!.notes !== undefined) updateData.notes = validatedData!.notes || null

      // Update the main migraine record
      const migraine = await tx.migraine.update({
        where: { id: id! }, // We know id is not null here due to validation above
        data: updateData,
      })

      // Update relationships if provided
      if (validatedData!.attackTypeIds !== undefined) {
        await tx.migraineMigraineAttackType.deleteMany({ where: { migraineId: id! } })
        if (validatedData!.attackTypeIds.length > 0) {
          await tx.migraineMigraineAttackType.createMany({
            data: validatedData!.attackTypeIds.map((typeId) => ({
              migraineId: id!,
              migraineAttackTypeId: typeId,
            })),
          })
        }
      }

      if (validatedData!.symptomTypeIds !== undefined) {
        await tx.migraineMigraineSymptomType.deleteMany({ where: { migraineId: id! } })
        if (validatedData!.symptomTypeIds.length > 0) {
          await tx.migraineMigraineSymptomType.createMany({
            data: validatedData!.symptomTypeIds.map((typeId) => ({
              migraineId: id!,
              migraineSymptomTypeId: typeId,
            })),
          })
        }
      }

      if (validatedData!.triggerTypeIds !== undefined) {
        await tx.migraineMigraineTriggerType.deleteMany({ where: { migraineId: id! } })
        if (validatedData!.triggerTypeIds.length > 0) {
          await tx.migraineMigraineTriggerType.createMany({
            data: validatedData!.triggerTypeIds.map((typeId) => ({
              migraineId: id!,
              migraineTriggerTypeId: typeId,
            })),
          })
        }
      }

      if (validatedData!.precognitionTypeIds !== undefined) {
        await tx.migraineMigrainePrecognitionType.deleteMany({ where: { migraineId: id! } })
        if (validatedData!.precognitionTypeIds.length > 0) {
          await tx.migraineMigrainePrecognitionType.createMany({
            data: validatedData!.precognitionTypeIds.map((typeId) => ({
              migraineId: id!,
              migrainePrecognitionTypeId: typeId,
            })),
          })
        }
      }

      if (validatedData!.medicationData !== undefined) {
        await tx.migraineMigraineMedicationType.deleteMany({ where: { migraineId: id! } })
        if (validatedData!.medicationData.length > 0) {
          await tx.migraineMigraineMedicationType.createMany({
            data: validatedData!.medicationData.map((med) => ({
              migraineId: id!,
              migraineMedicationTypeId: med.typeId,
              dosageModifier: med.dosageModifier,
            })),
          })
        }
      }

      if (validatedData!.reliefTypeIds !== undefined) {
        await tx.migraineMigraineReliefType.deleteMany({ where: { migraineId: id! } })
        if (validatedData!.reliefTypeIds.length > 0) {
          await tx.migraineMigraineReliefType.createMany({
            data: validatedData!.reliefTypeIds.map((typeId) => ({
              migraineId: id!,
              migraineReliefTypeId: typeId,
            })),
          })
        }
      }

      if (validatedData!.activityTypeIds !== undefined) {
        await tx.migraineMigraineActivityType.deleteMany({ where: { migraineId: id! } })
        if (validatedData!.activityTypeIds.length > 0) {
          await tx.migraineMigraineActivityType.createMany({
            data: validatedData!.activityTypeIds.map((typeId) => ({
              migraineId: id!,
              migraineActivityTypeId: typeId,
            })),
          })
        }
      }

      if (validatedData!.locationTypeIds !== undefined) {
        await tx.migraineMigraineLocationType.deleteMany({ where: { migraineId: id! } })
        if (validatedData!.locationTypeIds.length > 0) {
          await tx.migraineMigraineLocationType.createMany({
            data: validatedData!.locationTypeIds.map((typeId) => ({
              migraineId: id!,
              migraineLocationTypeId: typeId,
            })),
          })
        }
      }

      return migraine
    })

    // Fetch and return the updated migraine with all relationships
    const updatedMigraine = await prisma.migraine.findUnique({
      where: { id: id! },
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
    })

    return NextResponse.json(updatedMigraine)
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logApiError({
        request,
        error,
        context: {
          requestBody: body,
          userId,
          userDbId: user?.id,
          migraineId: id,
        },
        operation: 'validate migraine update',
        requestId,
      })
      return ApiError.validation(error, requestId)
    }

    await logApiError({
      request,
      error,
      context: {
        requestBody: body,
        userId,
        userDbId: user?.id,
        migraineId: id,
      },
      operation: 'update migraine',
      requestId,
    })
    return ApiError.internal('update migraine', requestId)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId()
  let userId: string | null = null
  let user: { id: string } | null = null
  let id: string | null = null

  try {
    const authResult = await auth()
    userId = authResult.userId
    if (!userId) {
      return ApiError.unauthorized(requestId)
    }

    user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    })

    if (!user) {
      return ApiError.notFound('User', requestId)
    }

    const { id: paramId } = await params
    id = paramId

    // Check if the migraine exists and belongs to the user
    const existingMigraine = await prisma.migraine.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingMigraine) {
      return ApiError.notFound('Migraine', requestId)
    }

    await prisma.migraine.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Migraine deleted successfully' })
  } catch (error) {
    await logApiError({
      request,
      error,
      context: {
        userId,
        userDbId: user?.id,
        migraineId: id,
      },
      operation: 'delete migraine',
      requestId,
    })
    return ApiError.internal('delete migraine', requestId)
  }
}
