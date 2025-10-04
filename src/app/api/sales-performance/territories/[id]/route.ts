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
      .update({
        name,
        description,
        region,
        zip_codes: zip_codes || [],
        industry_codes: industry_codes || [],
        revenue_tier_min: revenue_tier_min || null,
        revenue_tier_max: revenue_tier_max || null,
        assigned_user_id: assigned_user_id || null,
        manager_id: manager_id || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('organization_id', user.profile.organization_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(territory)
  } catch (error) {
    console.error('Update territory error:', error)
    return NextResponse.json(
      { error: 'Failed to update territory' },
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

    const { error } = await supabase
      .from('sales_territories')
      .delete()
      .eq('id', params.id)
      .eq('organization_id', user.profile.organization_id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete territory error:', error)
    return NextResponse.json(
      { error: 'Failed to delete territory' },
      { status: 500 }
    )
  }
}





