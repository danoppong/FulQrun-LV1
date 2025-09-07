import { createMiddlewareClient } from '@/lib/auth-server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabaseConfig } from '@/lib/config'

export async function middleware(request: NextRequest) {
  // If Supabase is not configured, redirect to setup page (except for setup page itself)
  if (!supabaseConfig.isConfigured && request.nextUrl.pathname !== '/setup') {
    return NextResponse.redirect(new URL('/setup', request.url))
  }

  // For now, let client-side AuthWrapper handle all authentication
  // This prevents middleware conflicts with client-side auth
  return NextResponse.next()
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
