import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-unified'

export async function GET(_request: NextRequest) {
  try {
    // Test server-side auth
    const user = await AuthService.getCurrentUserServer()
    
    return NextResponse.json({
      authenticated: !!user,
      userId: user?.id || null,
      email: user?.email || null,
      organizationId: user?.profile?.organization_id || null,
      role: user?.profile?.role || null,
      timestamp: new Date().toISOString()
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (_error) {
    return NextResponse.json({
      authenticated: false,
      error: 'Authentication check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}