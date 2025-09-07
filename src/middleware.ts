import { createMiddlewareClient } from '@/lib/auth-server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabaseConfig } from '@/lib/config'

export async function middleware(request: NextRequest) {
  // If Supabase is not configured, redirect to setup page (except for setup page itself)
  if (!supabaseConfig.isConfigured && request.nextUrl.pathname !== '/setup') {
    return NextResponse.redirect(new URL('/setup', request.url))
  }

  // If Supabase is configured, proceed with normal authentication flow
  if (supabaseConfig.isConfigured) {
    const { supabase, response } = createMiddlewareClient(request)
    
    // Refresh session if expired - required for Server Components
    const { data: { session }, error } = await supabase.auth.getSession()

    // Define protected routes (including dashboard)
    const protectedRoutes = ['/dashboard', '/contacts', '/companies', '/leads', '/opportunities', '/settings']
    const authRoutes = ['/auth/login', '/auth/signup']
    
    const isProtectedRoute = protectedRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )
    const isAuthRoute = authRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )

    // If user is not authenticated and trying to access protected route
    if (isProtectedRoute && (!session || error)) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is authenticated and trying to access auth routes
    if (isAuthRoute && session && !error) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  }

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
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
