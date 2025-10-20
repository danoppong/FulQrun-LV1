import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-unified'

export async function POST(_request: NextRequest) {
  try {
    // Get server client and sign out
    const supabase = await AuthService.getServerClient()
    await supabase.auth.signOut()
    
    // Create response with cleared auth cookies
    const response = NextResponse.json({ success: true })
    
    // Clear all auth-related cookies
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token', 
      'supabase-auth-token',
      'supabase.auth.token'
    ]
    
    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    })
    
    return response
  } catch (error) {
    console.error('Sign out error:', error)
    return NextResponse.json({ error: 'Sign out failed' }, { status: 500 })
  }
}