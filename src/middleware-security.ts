import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function securityMiddleware(request: NextRequest) {
  const url = request.nextUrl
  const searchParams = url.searchParams
  
  // Check for sensitive data in URL parameters
  const sensitiveParams = ['email', 'password', 'token', 'secret', 'key', 'auth']
  const hasSensitiveData = sensitiveParams.some(param => searchParams.has(param))
  
  if (hasSensitiveData) {
    // Log security violation (in production, use proper logging service)
    console.warn(`SECURITY WARNING: Sensitive data detected in URL: ${url.pathname}${url.search}`)
    
    // Create a clean URL without sensitive parameters
    const cleanUrl = new URL(url)
    sensitiveParams.forEach(param => {
      cleanUrl.searchParams.delete(param)
    })
    
    // Redirect to clean URL
    return NextResponse.redirect(cleanUrl, 301)
  }
  
  return NextResponse.next()
}

// Security headers middleware
export function securityHeadersMiddleware(_request: NextRequest) {
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  return response
}
