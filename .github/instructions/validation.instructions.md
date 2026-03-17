---
description: "Use when working on Zod validation schemas in API routes. Covers inline schema patterns, enum validation, and error handling."
applyTo: "src/app/api/**"
---

# Validation Standards

## Framework

All validation uses **Zod 4** with schemas defined **inline** in API route handlers. There is no centralized validation file.

## Schema Patterns

```ts
import { z } from 'zod'
import { Flow, Color, PeriodStatus } from '@prisma/client'

// Simple entity
const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  }),
  flow: z.nativeEnum(Flow),
  color: z.nativeEnum(Color),
  notes: z.string().optional(),
})

// Complex entity with relations
const createMigraineSchema = z.object({
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime().optional(),
  painLevel: z.number().int().min(1).max(10),
  notes: z.string().trim().optional(),
  attackTypeIds: z.array(z.string().uuid()).optional(),
  medicationData: z
    .array(
      z.object({
        typeId: z.string().uuid(),
        dosageModifier: z.number(),
      })
    )
    .optional(),
})
```

## Conventions

- Use `z.nativeEnum()` for Prisma enums (`Flow`, `Color`, `PeriodStatus`)
- IDs: always `z.string().uuid()`
- Dates: validate format with regex (`YYYY-MM-DD`) or `z.string().datetime()`
- Optional strings: use `.trim().optional()` to strip whitespace
- Nested arrays of IDs for many-to-many relations: `z.array(z.string().uuid()).optional()`

## Validation in Handlers

Use `schema.parse()` directly — it throws `ZodError` on failure:

```ts
try {
  const body = await request.json()
  const validatedData = createSchema.parse(body)
  // validatedData is fully typed
} catch (error) {
  if (error instanceof z.ZodError) {
    return ApiError.validation(error, requestId)
  }
  throw error
}
```

Use `ApiError.validation(zodError, requestId)` from `@/lib/api-response` for consistent error responses.
