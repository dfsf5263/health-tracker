import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { predictCycles, PredictionModel, PredictionResult } from '@/lib/cycle-prediction'

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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const count = parseInt(searchParams.get('count') || '3')
    const model = (searchParams.get('model') || 'simple_average') as PredictionModel

    // Validate parameters
    if (count < 1 || count > 12) {
      return NextResponse.json({ error: 'Count must be between 1 and 12' }, { status: 400 })
    }

    const validModels: PredictionModel[] = ['simple_average', 'weighted_average']
    if (!validModels.includes(model)) {
      return NextResponse.json(
        { error: `Invalid model. Must be one of: ${validModels.join(', ')}` },
        { status: 400 }
      )
    }

    // Fetch user's cycles
    const cycles = await prisma.cycle.findMany({
      where: { userId: user.id },
      orderBy: { startDate: 'desc' },
    })

    if (cycles.length === 0) {
      return NextResponse.json({ error: 'No cycle data available' }, { status: 404 })
    }

    try {
      const predictions: PredictionResult = predictCycles(cycles, count, model)
      return NextResponse.json(predictions)
    } catch (predictionError: unknown) {
      const errorMessage =
        predictionError instanceof Error ? predictionError.message : 'Unknown prediction error'
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error generating predictions:', error)
    return NextResponse.json({ error: 'Failed to generate predictions' }, { status: 500 })
  }
}
