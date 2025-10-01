import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { AuthService } from '@/lib/auth-unified'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUserServer()
    if (!user?.profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId') || user.profile.organization_id

    const supabase = createServerClient()

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, organization_id')
      .eq('organization_id', organizationId)
      .order('full_name', { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json(users || [])
  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

