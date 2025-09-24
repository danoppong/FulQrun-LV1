import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient() as any

    // Get learning modules for the organization
    const { data: modules, error } = await supabase
      .from('learning_modules')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json(modules || [])
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch learning modules' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, title, description, category, lessons, duration, difficulty } = body

    if (!organizationId || !title || !description || !category) {
      return NextResponse.json(
        { error: 'Organization ID, title, description, and category are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient() as any

    // Create new learning module
    const { data: module, error } = await supabase
      .from('learning_modules')
      .insert({
        organization_id: organizationId,
        title,
        description,
        category,
        lessons: lessons || [],
        duration: duration || 0,
        difficulty: difficulty || 'beginner',
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(module)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create learning module' },
      { status: 500 }
    )
  }
}
