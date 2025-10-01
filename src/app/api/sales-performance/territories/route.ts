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

    const { data: territories, error } = await supabase
      .from('sales_territories')
      .select(`
        *,
        assigned_user:users!assigned_user_id(id, full_name, email),
        manager:users!manager_id(id, full_name, email),
        quota_plans(*)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(territories || [])
  } catch (error) {
    console.error('Territories API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch territories' },
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
      region,
      zip_codes,
      industry_codes,
      revenue_tier_min,
      revenue_tier_max,
      assigned_user_id,
      manager_id
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Territory name is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { data: territory, error } = await supabase
      .from('sales_territories')
      .insert({
        name,
        description,
        region,
        zip_codes: zip_codes || [],
        industry_codes: industry_codes || [],
        revenue_tier_min: revenue_tier_min || null,
        revenue_tier_max: revenue_tier_max || null,
        assigned_user_id: assigned_user_id || null,
        manager_id: manager_id || null,
        organization_id: user.profile.organization_id,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(territory)
  } catch (error) {
    console.error('Create territory error:', error)
    return NextResponse.json(
      { error: 'Failed to create territory' },
      { status: 500 }
    )
  }
}
