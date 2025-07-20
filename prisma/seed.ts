import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Seed migraine location types
  const migraineLocations = [
    'Headband',
    'Front Right Top of Head',
    'Front Left Top of Head',
    'Back Right Top of Head',
    'Back Left Top of Head',
    'Left Temple',
    'Right Temple',
    'Left Eye',
    'Right Eye',
    'Bridge of Nose/Sinusus',
    'Left Cheek',
    'Right Cheek',
    'Left Jaw',
    'Right Jaw',
    'Mouth',
    'Left Neck',
    'Right Neck',
    'Left Base of Skull/Back of Head',
    'Right Base of Skull/Back of Head',
  ]

  console.log('Seeding migraine location types...')

  for (const location of migraineLocations) {
    try {
      await prisma.migraineLocationType.upsert({
        where: { name: location },
        update: {},
        create: { name: location },
      })
      console.log(`✓ Seeded location: ${location}`)
    } catch (error) {
      console.error(`✗ Failed to seed location: ${location}`, error)
    }
  }

  console.log(`Seeded ${migraineLocations.length} migraine location types.`)
  console.log('Database seeding completed.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
