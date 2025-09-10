import { createMiddlewareClient } from '@/lib/auth-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request)
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'


  if (code) {
    try {
      const result = await supabase.auth.exchangeCodeForSession(code)
      const { data, error } = result
      
      if (error) {
        return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    } catch (error) {
      return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_exception`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
}
