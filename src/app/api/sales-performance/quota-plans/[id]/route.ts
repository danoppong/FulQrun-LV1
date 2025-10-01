import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { AuthService } from '@/lib/auth-unified'

export const dynamic = 'force-dynamic'

export async function PUT(
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

    const body = await request.json()
    const {
      name,
      description,
      plan_type,
      start_date,
      end_date,
      target_revenue,
      target_deals,
      target_activities,
      territory_id,
      user_id,
      parent_plan_id,
      planning_method,
      planning_level
    } = body

    if (!name || !plan_type || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Name, plan type, start date, and end date are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { data: quotaPlan, error } = await supabase
      .from('quota_plans')
      .update({
        name,
        description,
        plan_type,
        start_date,
        end_date,
        target_revenue: target_revenue || 0,
        target_deals: target_deals || 0,
        target_activities: target_activities || 0,
        territory_id: territory_id || null,
        user_id: user_id || null,
        parent_plan_id: parent_plan_id || null,
        planning_method: planning_method || 'direct',
        planning_level: planning_level || 'individual',
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
    console.error('Update quota plan error:', error)
    return NextResponse.json(
      { error: 'Failed to update quota plan' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Delete child plans first (cascade)
    await supabase
      .from('quota_plans')
      .delete()
      .eq('parent_plan_id', params.id)
      .eq('organization_id', user.profile.organization_id)

    // Delete the plan
    const { error } = await supabase
      .from('quota_plans')
      .delete()
      .eq('id', params.id)
      .eq('organization_id', user.profile.organization_id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete quota plan error:', error)
    return NextResponse.json(
      { error: 'Failed to delete quota plan' },
      { status: 500 }
    )
  }
}

