import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'
import { standardApiSizeLimit } from '@/lib/middleware/request-size'
import { apiRateLimit, authRateLimit, strictRateLimit, twoFactorRateLimit } from '@/lib/rate-limit'

// Define public routes that don't require authentication
const isPublicRoute = (pathname: string) => {
  const publicPaths = [
    '/',
    '/sign-in',
    '/sign-up',
    '/verify-email-sent',
    '/email-verified',
    '/api/auth',
    '/api/health',
    '/api/cron',
    '/api/migraine-location-types',
  ]

  return publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

// Define routes that require partial authentication (signed in but may need 2FA)
const isPartialAuthRoute = (pathname: string) => {
  const partialAuthPaths = ['/two-factor']
  return partialAuthPaths.includes(pathname)
}

// Define authentication routes (user login attempts)
const isAuthRoute = (pathname: string) => {
  return pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')
}

// Define 2FA verification routes that need special rate limiting
const is2FARoute = (pathname: string) => {
  return pathname === '/two-factor' || pathname.startsWith('/api/auth/two-factor/verify')
}

// Define routes that should have no rate limiting
const isUnlimitedRoute = (pathname: string) => {
  return pathname === '/api/health' || pathname.startsWith('/api/cron/')
}

// Define routes for sensitive operations
const isSensitiveRoute = (pathname: string) => {
  const sensitivePaths = ['/api/birth-control-days', '/api/period-days', '/api/migraines']

  return sensitivePaths.some((path) => pathname.startsWith(path))
}

export default async function middleware(req: NextRequest) {
  const response = NextResponse.next()
  const pathname = req.nextUrl.pathname

  // Apply rate limiting for API routes, auth routes, and 2FA routes
  // if (pathname.startsWith('/api/') || isAuthRoute(pathname) || is2FARoute(pathname)) {
  //   // Skip rate limiting for unlimited routes
  //   if (!isUnlimitedRoute(pathname)) {
  //     // Apply auth rate limiting for login/signup attempts
  //     if (isAuthRoute(pathname)) {
  //       const rateLimitResult = await authRateLimit(req)
  //       if (rateLimitResult) return rateLimitResult
  //     }
  //     // Apply stricter rate limiting for 2FA verification
  //     else if (is2FARoute(pathname)) {
  //       const rateLimitResult = await twoFactorRateLimit(req)
  //       if (rateLimitResult) return rateLimitResult
  //     }
  //     // Apply strict rate limiting for sensitive data operations
  //     else if (isSensitiveRoute(pathname)) {
  //       const rateLimitResult = await strictRateLimit(req)
  //       if (rateLimitResult) return rateLimitResult
  //     }
  //     // Apply standard rate limiting for all other API routes
  //     else if (pathname.startsWith('/api/')) {
  //       const rateLimitResult = await apiRateLimit(req)
  //       if (rateLimitResult) return rateLimitResult
  //     }
  //   }
  // }

  // CORS headers for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // Standard size limit for non-bulk API endpoints
    const sizeCheck = await standardApiSizeLimit(req)
    if (sizeCheck) return sizeCheck

    response.headers.set('Access-Control-Allow-Origin', req.headers.get('origin') || '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    )
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400')

    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers })
    }
  }

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=()')

  // Content Security Policy
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self'",
    "frame-src 'self' https://challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ')

  response.headers.set('Content-Security-Policy', cspHeader)

  // HSTS for HTTPS
  if (req.url.startsWith('https://')) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // Protect all routes except public ones
  if (!isPublicRoute(pathname)) {
    // Check for Better Auth session cookie (optimistic check)
    const sessionCookie = getSessionCookie(req)


    // Handle partial auth routes (like 2FA verification)
    if (isPartialAuthRoute(pathname)) {
      // Check for two-factor cookie using Better Auth's default prefix
      const twoFactorCookie = req.cookies.get('better-auth.two_factor')


      if (!twoFactorCookie && !sessionCookie) {
        // No partial authentication, redirect to sign-in
        return NextResponse.redirect(new URL('/sign-in', req.url))
      }

      // Allow access to 2FA route with partial auth
      return response
    }

    if (!sessionCookie) {
      // Redirect to sign-in for protected routes
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
