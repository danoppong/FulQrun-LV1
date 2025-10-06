import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { AIOrchestrationService } from '@/lib/services/ai-orchestration'

const LeadGenerationSchema = z.object({
  lead_brief_id: z.string().uuid(),
  target_count: z.number().min(1).max(1000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  enrichment_level: z.enum(['BASIC', 'ENHANCED', 'PREMIUM']).optional()
})

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = LeadGenerationSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { lead_brief_id, target_count, priority, enrichment_level } = validationResult.data

    // Verify user has access to the lead brief
    const { data: leadBrief, error: briefError } = await supabase
      .from('lead_briefs')
      .select(`
        *,
        icp_profiles!inner(*)
      `)
      .eq('id', lead_brief_id)
      .eq('organization_id', user.user_metadata?.organization_id)
      .single()

    if (briefError || !leadBrief) {
      return NextResponse.json(
        { error: 'Lead brief not found or access denied' },
        { status: 404 }
      )
    }

    // Check if lead brief is in correct status
    if (leadBrief.status !== 'submitted') {
      return NextResponse.json(
        { error: 'Lead brief must be in submitted status to generate leads' },
        { status: 400 }
      )
    }

    // Initialize AI orchestration service
    const aiService = new AIOrchestrationService(supabase)

    // Generate leads
    const result = await aiService.generateLeads({
      lead_brief_id,
      target_count,
      priority,
      enrichment_level
    })

    if (result.status === 'FAILED') {
      return NextResponse.json(
        { 
          error: 'Failed to generate leads',
          details: result.errors
        },
        { status: 500 }
      )
    }

    // Update lead brief status to orchestrated
    await supabase
      .from('lead_briefs')
      .update({ 
        status: 'orchestrated',
        updated_at: new Date().toISOString()
      })
      .eq('id', lead_brief_id)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error in lead generation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Initialize AI orchestration service
    const aiService = new AIOrchestrationService(supabase)

    // Get job status
    const job = await aiService.getJobStatus(jobId)

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this job
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (userProfile?.organization_id !== job.organization_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: job
    })

  } catch (error) {
    console.error('Error in job status API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
