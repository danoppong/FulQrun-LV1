import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server';
import { AuthService } from '@/lib/auth-unified';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUserServer()
    if (!user?.profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User profile:', user.profile)
    console.log('Organization ID:', user.profile.organization_id)

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId') || user.profile.organization_id
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')

    console.log('Query params:', { organizationId, category, isActive })

    const supabase = createServerClient()

    // Start with a simple query without joins
    let query = supabase
      .from('metric_templates')
      .select('*')
      .eq('organization_id', organizationId)

    if (category) {
      query = query.eq('category', category)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data: templates, error } = await query.order('created_at', { ascending: false })

    console.log('Query result:', { templates, error })

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return NextResponse.json(templates || [])
  } catch (error) {
    console.error('Metric templates API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metric templates', details: error.message },
      { status: 500 }
    )
  }
}

// Keep the other methods unchanged for now
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
      category,
      metric_type,
      unit,
      target_default,
      custom_fields
    } = body

    if (!name || !category || !metric_type) {
      return NextResponse.json(
        { error: 'Name, category, and metric type are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Create metric template
    const { data: template, error: templateError } = await supabase
      .from('metric_templates')
      .insert({
        name,
        description,
        category,
        metric_type,
        unit: unit || null,
        target_default: target_default || 0,
        organization_id: user.profile.organization_id,
        created_by: user.id
      })
      .select()
      .single()

    if (templateError) {
      throw templateError
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Create metric template error:', error)
    return NextResponse.json(
      { error: 'Failed to create metric template' },
      { status: 500 }
    )
  }
}
