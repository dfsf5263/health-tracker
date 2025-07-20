import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const migraineLocationTypes = await prisma.migraineLocationType.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(migraineLocationTypes)
  } catch (error) {
    console.error('Error fetching migraine location types:', error)
    return NextResponse.json({ error: 'Failed to fetch migraine location types' }, { status: 500 })
  }
}
