---
description: "Use when creating or modifying React components. Covers client component patterns, shadcn/ui usage, form conventions, and data flow."
applyTo: "src/components/**/*.tsx"
---

# Component Conventions

## General

- Add `'use client'` directive to all client components — this project does not use React Server Components for data fetching
- Import UI primitives from `@/components/ui/*` (shadcn/ui)
- Import icons from `lucide-react`

## Forms

- Use `useState` for form field state and `useEffect` to sync with incoming props
- Parent components own submission logic — forms receive an `onSubmit` callback prop
- Wrap forms in `<Dialog>` from `@/components/ui/dialog`
- No form library (react-hook-form) or schema validation in forms — validation happens server-side in API routes

## Data Flow

- Parent components own API calls (fetch + mutate) and pass data/callbacks as props to children
- Use `authClient.useSession()` from `@/lib/auth-client` for auth state (better-auth)
- `<AuthGuard>` wraps the dashboard layout — individual pages don't need auth checks

## Cards

- Use shadcn/ui `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` from `@/components/ui/card`
- Accept callback props for edit/delete actions
- Use `<Button variant="ghost" size="icon">` for action buttons with lucide-react icons

## Loading

- Use `<LoadingOverlay>` from `@/components/ui/loading-overlay` for loading states

## Accessibility

- Use semantic HTML elements (`<label>`, `<button>`, `<nav>`, `<main>`, `<section>`) over generic `<div>` or `<span>` when the element has inherent meaning or behavior
- Clickable areas that trigger actions must be `<button>` or `<a>` — never a `<div>` with only `onClick`
- File upload zones should use `<label htmlFor="...">` wrapping or associated with the `<input type="file">` so they are keyboard and screen-reader accessible
- All interactive elements must be keyboard-reachable (focusable and operable via Enter/Space)
- Use `aria-label` or `aria-labelledby` on icon-only buttons and controls that lack visible text
- Prefer shadcn/ui primitives (which include ARIA roles) over custom implementations
