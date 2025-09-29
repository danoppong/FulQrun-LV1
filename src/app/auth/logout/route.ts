import { createMiddlewareClient } from '@/lib/auth-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { supabase, response: _response } = createMiddlewareClient(request)
  
  await supabase.auth.signOut()
  
  return NextResponse.redirect(new URL('/', request.url))
}
