import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { standardApiSizeLimit } from '@/lib/middleware/request-size'
import { apiRateLimit, authRateLimit, strictRateLimit, createRateLimit } from '@/lib/rate-limit'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk(.*)',
  '/api/health',
  '/api/cron/(.*)',
  '/api/migraine-location-types',
])

// Define authentication routes (user login attempts)
const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

// Define webhook routes that need higher limits
const isWebhookRoute = createRouteMatcher(['/api/webhooks/clerk(.*)'])

// Define routes that should have no rate limiting
const isUnlimitedRoute = createRouteMatcher([
  '/api/health',
  '/api/cron/(.*)', // Cron jobs have their own auth
])

// Define routes for sensitive operations
const isSensitiveRoute = createRouteMatcher([
  '/api/birth-control-days',
  '/api/period-days',
  '/api/migraines',
])

// Create a specific rate limiter for webhooks (much higher limit)
const webhookRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 1000, // 1000 requests per minute (for all users)
  message: 'Webhook rate limit exceeded. Please contact support.',
})

export default clerkMiddleware(async (auth, req) => {
  // Add security headers to all responses
  const response = NextResponse.next()

  // Apply rate limiting for API routes and auth routes
  if (req.nextUrl.pathname.startsWith('/api/') || isAuthRoute(req)) {
    // Skip rate limiting for unlimited routes
    if (!isUnlimitedRoute(req)) {
      // Apply webhook rate limiting (high volume)
      if (isWebhookRoute(req)) {
        const rateLimitResult = await webhookRateLimit(req)
        if (rateLimitResult) return rateLimitResult
      }
      // Apply auth rate limiting for login/signup attempts
      else if (isAuthRoute(req)) {
        const rateLimitResult = await authRateLimit(req)
        if (rateLimitResult) return rateLimitResult
      }
      // Apply strict rate limiting for sensitive data operations
      else if (isSensitiveRoute(req)) {
        const rateLimitResult = await strictRateLimit(req)
        if (rateLimitResult) return rateLimitResult
      }
      // Apply standard rate limiting for all other API routes
      else if (req.nextUrl.pathname.startsWith('/api/')) {
        const rateLimitResult = await apiRateLimit(req)
        if (rateLimitResult) return rateLimitResult
      }
    }
  }

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
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://clerk.health.crowland.us https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://api.clerk.com https://clerk.health.crowland.us wss://*.clerk.com wss://*.clerk.accounts.dev wss://clerk.health.crowland.us",
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
  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  return response
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
