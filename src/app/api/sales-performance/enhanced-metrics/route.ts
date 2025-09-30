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
    const metricTemplateId = searchParams.get('metricTemplateId')
    const periodStart = searchParams.get('periodStart')
    const periodEnd = searchParams.get('periodEnd')

    const supabase = createServerClient()

    let query = supabase
      .from('enhanced_performance_metrics')
      .select(`
        *,
        metric_template:metric_templates(*),
        user:users(id, full_name, email),
        territory:sales_territories(name, region),
        quota_plan:quota_plans(name, target_revenue),
        created_by_user:users!created_by(id, full_name, email)
      `)
      .eq('organization_id', organizationId)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (metricTemplateId) {
      query = query.eq('metric_template_id', metricTemplateId)
    }

    if (periodStart) {
      query = query.gte('period_start', periodStart)
    }

    if (periodEnd) {
      query = query.lte('period_end', periodEnd)
    }

    const { data: metrics, error } = await query.order('period_start', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(metrics || [])
  } catch (error) {
    console.error('Enhanced performance metrics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enhanced performance metrics' },
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
      metric_template_id,
      user_id,
      territory_id,
      quota_plan_id,
      period_start,
      period_end,
      actual_value,
      target_value,
      custom_fields,
      notes
    } = body

    if (!metric_template_id || !user_id || !period_start || !period_end || actual_value === undefined || target_value === undefined) {
      return NextResponse.json(
        { error: 'Metric template ID, user ID, period dates, actual value, and target value are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { data: metric, error } = await supabase
      .from('enhanced_performance_metrics')
      .insert({
        metric_template_id,
        user_id,
        territory_id: territory_id || null,
        quota_plan_id: quota_plan_id || null,
        period_start,
        period_end,
        actual_value,
        target_value,
        custom_fields: custom_fields || {},
        notes: notes || null,
        organization_id: user.profile.organization_id,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(metric)
  } catch (error) {
    console.error('Create enhanced performance metric error:', error)
    return NextResponse.json(
      { error: 'Failed to create enhanced performance metric' },
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

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Metric ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { data: metric, error } = await supabase
      .from('enhanced_performance_metrics')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(metric)
  } catch (error) {
    console.error('Update enhanced performance metric error:', error)
    return NextResponse.json(
      { error: 'Failed to update enhanced performance metric' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUserServer()
    if (!user?.profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Metric ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { error } = await supabase
      .from('enhanced_performance_metrics')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete enhanced performance metric error:', error)
    return NextResponse.json(
      { error: 'Failed to delete enhanced performance metric' },
      { status: 500 }
    )
  }
}
