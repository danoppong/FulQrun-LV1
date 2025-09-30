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
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')

    const supabase = createServerClient()

    let query = supabase
      .from('metric_templates')
      .select(`
        *,
        custom_metric_fields(*),
        created_by_user:users!created_by(id, full_name, email)
      `)
      .eq('organization_id', organizationId)

    if (category) {
      query = query.eq('category', category)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data: templates, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(templates || [])
  } catch (error) {
    console.error('Metric templates API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metric templates' },
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

    // Create custom fields if provided
    if (custom_fields && custom_fields.length > 0) {
      const fieldInserts = custom_fields.map((field: any, index: number) => ({
        metric_template_id: template.id,
        field_name: field.field_name,
        field_type: field.field_type,
        field_options: field.field_options || {},
        is_required: field.is_required || false,
        display_order: index,
        organization_id: user.profile.organization_id
      }))

      const { error: fieldsError } = await supabase
        .from('custom_metric_fields')
        .insert(fieldInserts)

      if (fieldsError) {
        console.error('Error creating custom fields:', fieldsError)
        // Don't fail the whole request if custom fields fail
      }
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
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { data: template, error } = await supabase
      .from('metric_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Update metric template error:', error)
    return NextResponse.json(
      { error: 'Failed to update metric template' },
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

    if (!['manager', 'admin'].includes(user.profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { error } = await supabase
      .from('metric_templates')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete metric template error:', error)
    return NextResponse.json(
      { error: 'Failed to delete metric template' },
      { status: 500 }
    )
  }
}
