import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: moduleId } = await params

    if (!moduleId) {
      return NextResponse.json(
        { error: 'Module ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get specific learning module
    const { data: module, error } = await supabase
      .from('learning_modules')
      .select('*')
      .eq('id', moduleId)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(module)
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to fetch learning module' },
      { status: 500 }
    )
  }
}
