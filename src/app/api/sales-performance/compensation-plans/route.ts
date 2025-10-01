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
      .from('compensation_plans')
      .select(`
        *,
        territory:sales_territories(name, region),
        user:users!compensation_plans_user_id_fkey(id, full_name, email),
        commission_calculations(*)
      `)
      .eq('organization_id', organizationId)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: compensationPlans, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(compensationPlans || [])
  } catch (error) {
    console.error('Compensation plans API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch compensation plans' },
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
      base_salary,
      commission_rate,
      commission_cap,
      bonus_thresholds,
      product_weightings,
      territory_id,
      user_id
    } = body

    if (!name || !plan_type) {
      return NextResponse.json(
        { error: 'Name and plan type are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { data: compensationPlan, error } = await supabase
      .from('compensation_plans')
      .insert({
        name,
        description,
        plan_type,
        base_salary: base_salary || 0,
        commission_rate: commission_rate || 0,
        commission_cap: commission_cap || null,
        bonus_thresholds: bonus_thresholds || {},
        product_weightings: product_weightings || {},
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

    return NextResponse.json(compensationPlan)
  } catch (error) {
    console.error('Create compensation plan error:', error)
    return NextResponse.json(
      { error: 'Failed to create compensation plan' },
      { status: 500 }
    )
  }
}
