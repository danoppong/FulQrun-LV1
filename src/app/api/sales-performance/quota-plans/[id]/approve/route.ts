import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { AuthService } from '@/lib/auth-unified'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getCurrentUserServer()
    if (!user?.profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['manager', 'admin'].includes(user.profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const supabase = createServerClient()

    const { data: quotaPlan, error } = await supabase
      .from('quota_plans')
      .update({
        is_approved: true,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('organization_id', user.profile.organization_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(quotaPlan)
  } catch (error) {
    console.error('Approve quota plan error:', error)
    return NextResponse.json(
      { error: 'Failed to approve quota plan' },
      { status: 500 }
    )
  }
}

