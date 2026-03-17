---
description: "Use when creating or modifying API route handlers in src/app/api/. Covers auth middleware, ApiError helpers, and logging."
applyTo: "src/app/api/**/*.ts"
---

# API Route Conventions

## Route Structure

Every API route handler follows this pattern:

```ts
import { requireAuth } from '@/lib/auth-middleware'
import { ApiError } from '@/lib/api-response'
import { logApiError } from '@/lib/error-logger'
import { withApiLogging } from '@/lib/middleware/with-api-logging'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const GET = withApiLogging(async (request: NextRequest) => {
  try {
    const authContext = await requireAuth()
    if (authContext instanceof NextResponse) {
      return authContext
    }
    const { userId, user } = authContext

    // ... business logic, always scope queries with userId
    const data = await prisma.someModel.findMany({
      where: { userId: user.id },
    })

    return NextResponse.json(data)
  } catch (error) {
    await logApiError({
      request,
      error,
      operation: 'describe what failed',
      context: { userId },
    })
    return ApiError.internal('describe what failed')
  }
})
```

## Key Rules

- Always wrap handlers with `withApiLogging()` from `@/lib/middleware/with-api-logging`
- Call `requireAuth()` and check `instanceof NextResponse` for auth failure
- Validate request bodies with Zod schemas — return `ApiError.validation(error)` on failure
- Scope all database queries by `userId` — never expose cross-user data
- Use `logApiError()` in catch blocks with request, error, operation description, and context
- Do not generate request IDs — the `x-correlation-id` header from the nginx reverse proxy is automatically logged by `withApiLogging` and `logApiError`

## Error Helpers (`ApiError.*`)

- `ApiError.unauthorized()` — 401
- `ApiError.notFound(resourceName)` — 404
- `ApiError.validation(zodError)` — 400
- `ApiError.conflict(message)` — 409
- `ApiError.internal(operation)` — 500
- `ApiError.serviceUnavailable(message, details?)` — 503
