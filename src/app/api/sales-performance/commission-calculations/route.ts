import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
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
    const status = searchParams.get('status')

    const supabase = createServerClient()

    let query = supabase
      .from('commission_calculations')
      .select(`
        *,
        user:users(id, full_name, email),
        compensation_plan:compensation_plans(name, plan_type, commission_rate),
        approved_by_user:users!approved_by(id, full_name, email)
      `)
      .eq('organization_id', organizationId)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: calculations, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(calculations || [])
  } catch (error) {
    console.error('Commission calculations API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch commission calculations' },
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

    const body = await request.json()
    const {
      user_id,
      compensation_plan_id,
      period_start,
      period_end,
      base_salary,
      commission_earned,
      bonus_earned,
      total_compensation,
      quota_attainment,
      commission_rate_applied,
      adjustments
    } = body

    if (!user_id || !compensation_plan_id || !period_start || !period_end) {
      return NextResponse.json(
        { error: 'User ID, compensation plan ID, period start, and period end are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { data: calculation, error } = await supabase
      .from('commission_calculations')
      .insert({
        user_id,
        compensation_plan_id,
        period_start,
        period_end,
        base_salary: base_salary || 0,
        commission_earned: commission_earned || 0,
        bonus_earned: bonus_earned || 0,
        total_compensation: total_compensation || 0,
        quota_attainment: quota_attainment || 0,
        commission_rate_applied: commission_rate_applied || 0,
        adjustments: adjustments || {},
        organization_id: user.profile.organization_id
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(calculation)
  } catch (error) {
    console.error('Create commission calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to create commission calculation' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUserServer()
    if (!user?.profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['manager', 'admin'].includes(user.profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status, adjustments } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID and status are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'approved') {
      updateData.approved_by = user.id
      updateData.approved_at = new Date().toISOString()
    }

    if (adjustments) {
      updateData.adjustments = adjustments
    }

    const { data: calculation, error } = await supabase
      .from('commission_calculations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(calculation)
  } catch (error) {
    console.error('Update commission calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to update commission calculation' },
      { status: 500 }
    )
  }
}
