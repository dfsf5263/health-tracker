---
description: "Use when writing Prisma schema, migrations, or database queries. Covers query scoping, transactions, and the prisma singleton."
applyTo: "prisma/**,src/lib/**"
---

# Database Conventions

## Prisma

- Prisma 7 with `@prisma/adapter-pg` driver adapter
- Always import the singleton: `import { prisma } from '@/lib/prisma'` — never instantiate `PrismaClient` directly
- Import enums and generated types from `@prisma/client`

## Query Rules

- All user-scoped queries must filter by `userId` — never return data across users
- Use `select` to limit returned fields when the full model isn't needed
- Use transactions (`prisma.$transaction()`) when multiple writes must be atomic

## Schema Conventions

- All primary keys are UUIDs: `id String @id @default(uuid())`
- Use `@relation(onDelete: Cascade)` for dependent entities
- Dates: `@db.Date` for date-only fields, `DateTime` for timestamps
- Enums: `Flow` (Spotting→SuperHeavy), `Color` (Red/Brown), `PeriodStatus` (Yes/No/Upcoming)
- Many-to-many relations use explicit junction tables (e.g., `MigraineMigraineAttackType`)
- Composite uniqueness: `@@unique([userId, name])` for user-scoped type definitions

## Key Models

- **User**: Auth user with firstName, lastName, health preferences
- **Cycle / PeriodDay**: Menstrual cycle and daily period tracking
- **BirthControlType / BirthControlDay**: Birth control logging
- **Migraine**: Migraine events with pain level, location, and linked type definitions
- **Migraine*Type models**: User-defined type definitions (attack, symptom, trigger, medication, etc.)

## Migrations

- Schema lives at `prisma/schema.prisma`
- Generate migrations with `npx prisma migrate dev --name description_of_change`
- Apply: `npx prisma migrate deploy`
- Seed data is in `prisma/seed.ts`
- Never edit existing migration files
