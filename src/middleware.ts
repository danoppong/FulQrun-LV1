import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr'
import { supabaseConfig } from '@/lib/config';
import { PROTECTED_PREFIXES } from '@/lib/security/protected-routes';

type CookieOptions = {
  path?: string
  domain?: string
  maxAge?: number
  secure?: boolean
  httpOnly?: boolean
  sameSite?: 'lax' | 'strict' | 'none'
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const { pathname } = request.nextUrl

  // Enhanced security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "media-src 'self'"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)

  // Handle Supabase authentication
  if (supabaseConfig.isConfigured) {
    const supabase = createServerClient(
      supabaseConfig.url!,
      supabaseConfig.anonKey!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Refresh session if expired
    const { data: { user } } = await supabase.auth.getUser()

    // Route protection: require auth for protected pages
    const isApiRoute = pathname.startsWith('/api/')
    const isAuthRoute = pathname.startsWith('/auth/')
    // Pages that should always require authentication
    const protectedPrefixes = PROTECTED_PREFIXES
    const isProtected = protectedPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/'))

    if (!isApiRoute) {
      // SECURITY: If hitting protected page without a session, redirect to login with next param
      if (isProtected && !user && !isAuthRoute) {
        console.warn(`🚨 SECURITY: Unauthorized access attempt to protected route: ${pathname}`)
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/auth/login'
        loginUrl.searchParams.set('next', pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Log successful access to protected routes for monitoring
      if (isProtected && user) {
        console.log(`✅ SECURITY: Authorized access to protected route: ${pathname} by user: ${user.id}`)
      }

      // If already authenticated and trying to access login/signup, redirect to dashboard
      // UNLESS they're coming from a sign out (check for sign out indication)
      if (user && isAuthRoute && pathname.startsWith('/auth/')) {
        // Check if this is a fresh request that might be from sign out
        const referer = request.headers.get('referer')
        const isFromSignOut = !referer || referer.includes('/dashboard') || referer.includes('/admin')
        
        // If this looks like a sign out redirect, allow it to proceed to login
        if (isFromSignOut && pathname === '/auth/login') {
          // Allow the login page to load - the user will be signed out
          return response
        }
        
        const dashboardUrl = request.nextUrl.clone()
        dashboardUrl.pathname = '/dashboard'
        return NextResponse.redirect(dashboardUrl)
      }
    }
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - debug-auth (for debugging)
     */
    '/((?!_next/static|_next/image|favicon.ico|debug-auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
