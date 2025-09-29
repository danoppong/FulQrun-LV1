import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const moduleId = searchParams.get('moduleId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    let query = supabase
      .from('user_learning_progress')
      .select('*')
      .eq('user_id', userId)

    if (moduleId) {
      query = query.eq('module_id', moduleId)
    }

    const { data: progress, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json(progress || [])
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to fetch learning progress' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, moduleId, progress, currentLessonIndex, completed } = body

    if (!userId || !moduleId || progress === undefined) {
      return NextResponse.json(
        { error: 'User ID, module ID, and progress are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Upsert learning progress
    const { data: progressData, error } = await supabase
      .from('user_learning_progress')
      .upsert({
        user_id: userId,
        module_id: moduleId,
        progress,
        current_lesson_index: currentLessonIndex || 0,
        completed: completed || false,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,module_id' })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(progressData)
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to update learning progress' },
      { status: 500 }
    )
  }
}
