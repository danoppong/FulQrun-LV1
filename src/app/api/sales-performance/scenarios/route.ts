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
    const scenarioType = searchParams.get('scenarioType')

    const supabase = createServerClient()

    let query = supabase
      .from('scenario_plans')
      .select(`
        *,
        created_by_user:users!created_by(id, full_name, email)
      `)
      .eq('organization_id', organizationId)

    if (scenarioType) {
      query = query.eq('scenario_type', scenarioType)
    }

    const { data: scenarios, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(scenarios || [])
  } catch (error) {
    console.error('Scenarios API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scenarios' },
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
      scenario_type,
      base_scenario_id,
      assumptions,
      quota_changes,
      territory_changes,
      compensation_changes,
      impact_analysis,
      budget_variance,
      fairness_score
    } = body

    if (!name || !scenario_type) {
      return NextResponse.json(
        { error: 'Name and scenario type are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { data: scenario, error } = await supabase
      .from('scenario_plans')
      .insert({
        name,
        description,
        scenario_type,
        base_scenario_id: base_scenario_id || null,
        assumptions: assumptions || {},
        quota_changes: quota_changes || {},
        territory_changes: territory_changes || {},
        compensation_changes: compensation_changes || {},
        impact_analysis: impact_analysis || {},
        budget_variance: budget_variance || 0,
        fairness_score: fairness_score || 0,
        organization_id: user.profile.organization_id,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(scenario)
  } catch (error) {
    console.error('Create scenario error:', error)
    return NextResponse.json(
      { error: 'Failed to create scenario' },
      { status: 500 }
    )
  }
}
