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
    const periodStart = searchParams.get('periodStart')
    const periodEnd = searchParams.get('periodEnd')

    const supabase = createServerClient()

    let query = supabase
      .from('performance_metrics')
      .select(`
        *,
        user:users(id, full_name, email),
        territory:sales_territories(name, region),
        quota_plan:quota_plans(name, target_revenue)
      `)
      .eq('organization_id', organizationId)

    if (userId) {
      query = query.eq('user_id', userId)
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
    console.error('Performance metrics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
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
      territory_id,
      quota_plan_id,
      period_start,
      period_end,
      revenue_actual,
      revenue_target,
      deals_closed,
      deals_target,
      activities_completed,
      activities_target,
      conversion_rate,
      pipeline_coverage
    } = body

    if (!user_id || !period_start || !period_end) {
      return NextResponse.json(
        { error: 'User ID, period start, and period end are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { data: metric, error } = await supabase
      .from('performance_metrics')
      .insert({
        user_id,
        territory_id: territory_id || null,
        quota_plan_id: quota_plan_id || null,
        period_start,
        period_end,
        revenue_actual: revenue_actual || 0,
        revenue_target: revenue_target || 0,
        deals_closed: deals_closed || 0,
        deals_target: deals_target || 0,
        activities_completed: activities_completed || 0,
        activities_target: activities_target || 0,
        conversion_rate: conversion_rate || 0,
        pipeline_coverage: pipeline_coverage || 0,
        organization_id: user.profile.organization_id
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(metric)
  } catch (error) {
    console.error('Create performance metric error:', error)
    return NextResponse.json(
      { error: 'Failed to create performance metric' },
      { status: 500 }
    )
  }
}
