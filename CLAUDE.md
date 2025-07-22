# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build for production
- `npm run format` - Format code with Biome
- `npm run check` - Run lint and typecheck (run this before committing)

**IMPORTANT**: After making any code changes, always run:
1. `npm run format` - Format the code
2. `npm run check` - Verify no linting or type errors. Attempt to fix warnings as well.

## Project Overview

This is a **Health Tracker** application built with Next.js 15 using the App Router, TypeScript, and a comprehensive shadcn/ui dashboard interface. The application enables users to track and predict both menstrual cycles and migraines.

## Project Structure and Guidelines

### Technology Stack

**Frontend:**
- **Next.js 15** with App Router architecture for modern React patterns
- **TypeScript** for comprehensive type safety and developer experience
- **Tailwind CSS v4** for utility-first styling with Tailwind Animate
- **shadcn/ui** component library built on Radix UI primitives
- **React 19** with modern hooks and concurrent features

**Backend & Database:**
- **PostgreSQL 17** database with native UUID support
- **Prisma ORM** for type-safe database operations and migrations
- **Next.js API Routes** for RESTful backend services
- **Better Auth** for email/password authentication with server-side sessions reference **docs/BETTER-AUTH.md** for documentation

**Development Tools:**
- **Biome** for fast formatting and linting (replaces ESLint + Prettier)
- **TypeScript** compiler for type checking
- **Turbopack** for fast development builds

### Project Structure

```
src/
├── app/                          # Next.js App Router pages and API routes
│   ├── api/                     # Backend API endpoints
│   ├── dashboard/              # Main application pages
├── components/                 # Reusable React components
├── hooks/                     # Custom React hooks
├── lib/                      # Utility functions and configurations
prisma/
├── schema.prisma            # Database schema definition
└── seed.ts                 # Database seeding script
```

### Coding Guidelines

**Key Design Principals**
- **Always use the shadcn/ui Component**: If there is a shadcn/ui component available for the task, use it instead of basic html or react

### Database Schema Guidelines

**Key Design Principles:**
- **UUID Primary Keys**: All models use PostgreSQL native UUIDs via `@default(uuid()) @db.Uuid`
- **Normalized Structure**: Separate entities for accounts, users, categories, and types
- **Audit Trails**: All models include `createdAt` and `updatedAt` timestamps
- **Referential Integrity**: Proper foreign key relationships with cascading rules
- **Singular Naming**: All models are named in the singular context

### API Route Guidelines

**All API routes (`src/app/api/**/*.ts`) must follow these patterns for consistent error handling, logging, and responses:**

#### Required Imports
```typescript
import { logApiError } from '@/lib/error-logger'
import { ApiError, generateRequestId } from '@/lib/api-response'
```

#### Request ID Generation
- **Every API route** must generate a unique request ID: `const requestId = generateRequestId()`
- Pass `requestId` to all error responses and logging calls

#### Error Handling Pattern
- **✅ DO**: Use `ApiError.*` methods for all error responses
  ```typescript
  return ApiError.unauthorized(requestId)
  return ApiError.notFound('Resource name', requestId)
  return ApiError.validation(zodError, requestId)
  return ApiError.internal('operation name', requestId)
  ```
- **❌ DON'T**: Use raw `NextResponse.json()` with error status codes
- **❌ DON'T**: Use raw `Response()` objects for errors

#### Error Logging Pattern
- **All errors** must be logged using `logApiError()` before returning error responses
- Include relevant context: `userId`, `userDbId`, request body, operation parameters
- Specify clear operation descriptions for debugging

#### Validation Error Handling
- Use `ApiError.validation(zodError, requestId)` for Zod validation failures
- Log validation errors with request body context before returning

### Frontend API Calling Guidelines

**All frontend API calls must use the `apiFetch` utility for consistent error handling and user feedback:**

#### Required Import
```typescript
import { apiFetch, showSuccessToast } from '@/lib/http-utils'
```

#### Error Handling Pattern
- **✅ DO**: Use `apiFetch()` for all API calls - errors are automatically shown to users with HTTP status codes and request IDs
- **❌ DON'T**: Use raw `fetch()` calls or manual error handling

#### GET Requests Pattern
```typescript
const { data, error } = await apiFetch<ExpectedType[]>('/api/endpoint')
if (error || !data) {
  // Error toast automatically shown with HTTP status + request ID
  return
}
// Use data safely (TypeScript knows it's not null)
setItems(data)
```

#### POST/PUT/DELETE Requests Pattern
```typescript
const { data, error } = await apiFetch<ResponseType>('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestData),
})

if (error || !data) {
  // Error toast automatically shown
  throw new Error(error || 'Operation failed')
}

// Success case
showSuccessToast('Operation completed successfully')
```

#### Type Safety Requirements
- Always provide TypeScript generics: `apiFetch<ExpectedType>()`
- Check for both `error` and `!data` before using response
- Use proper null checks to satisfy TypeScript strict mode

#### User Experience Benefits
- **Consistent Error Messages**: All API errors show as toasts with format "Error 400: Message" 
- **Request ID Tracking**: Each error toast includes request ID for backend log correlation
- **Status Code Context**: Users see HTTP status codes for technical troubleshooting
- **Automatic Handling**: No need for manual try/catch blocks or custom error toasts