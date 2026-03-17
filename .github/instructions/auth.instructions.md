---
description: "Use when working on authentication, authorization, sessions, TOTP 2FA, password reset, or email verification flows."
---

# Authentication & Authorization Standards

## Auth Framework

- **Library**: better-auth (configured in `src/lib/auth.ts` via `getAuth()` singleton)
- **Client**: `src/lib/auth-client.ts` (`authClient` with `inferAdditionalFields` + `twoFactorClient` plugins)
- **Helpers**: `src/lib/auth-helpers.ts` (`getSession()` for server-side session access)
- **Middleware**: `src/lib/auth-middleware.ts` (`requireAuth()` for route protection)

## Session Management

- Sessions stored in the database via Prisma
- 7-day session expiry, 1-day update window
- HTTP-only cookies for session persistence
- Secure cookies in production only
- Auth routes: `/api/auth/[...all]` (handled by better-auth)

## Route Protection

### API Routes

```ts
import { requireAuth } from '@/lib/auth-middleware'
import { NextResponse } from 'next/server'

const authContext = await requireAuth()
if (authContext instanceof NextResponse) return authContext
// authContext: { userId, user: { id, email, firstName, lastName } }
```

Always check `if (result instanceof NextResponse) return result` after calling `requireAuth()`.

### Client-Side

- Use `authClient.useSession()` from `@/lib/auth-client` for session state
- `<AuthGuard>` wraps the dashboard layout — individual pages don't need auth checks

## Data Scoping

All queries must be scoped by `userId` — this is a single-user-per-account model with no shared access:

```ts
const data = await prisma.someModel.findMany({
  where: { userId: user.id },
})
```

## Features

- Email verification (optional, based on `RESEND_API_KEY` env var)
- TOTP 2FA with backup codes (via `twoFactor` plugin)
- Custom user fields: `firstName`, `lastName`
- Auto-prepopulates health type definitions for new users via `databaseHooks`
