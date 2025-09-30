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
    const userId = searchParams.get('userId')

    const supabase = createServerClient()

    let query = supabase
      .from('quota_plans')
      .select(`
        *,
        territory:sales_territories(name, region),
        user:users(id, full_name, email),
        performance_metrics(*)
      `)
      .eq('organization_id', organizationId)

    // If userId is specified, filter by user
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: quotaPlans, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(quotaPlans || [])
  } catch (error) {
    console.error('Quota plans API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quota plans' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
      user_id
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
      .insert({
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
        organization_id: user.profile.organization_id,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(quotaPlan)
  } catch (error) {
    console.error('Create quota plan error:', error)
    return NextResponse.json(
      { error: 'Failed to create quota plan' },
      { status: 500 }
    )
  }
}
