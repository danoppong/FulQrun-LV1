import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const moduleId = params.id

    if (!moduleId) {
      return NextResponse.json(
        { error: 'Module ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient() as any

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
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch learning module' },
      { status: 500 }
    )
  }
}
