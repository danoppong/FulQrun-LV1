import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { z } from 'zod';

// Validation schemas
const LeadBriefSchema = z.object({
  lead_type: z.enum(['account', 'contact']),
  geography: z.enum(['US', 'EU', 'UK', 'APAC']),
  industry: z.string().optional(),
  revenue_band: z.enum(['<$10M', '$10–50M', '$50–250M', '$250M–$1B', '>$1B']).optional(),
  employee_band: z.enum(['1–50', '51–200', '201–1k', '1k–5k', '>5k']).optional(),
  entity_type: z.enum(['PUBLIC', 'PRIVATE', 'NONPROFIT', 'OTHER']),
  technographics: z.array(z.string()).max(50).optional(),
  installed_tools_hints: z.array(z.string()).optional(),
  intent_keywords: z.array(z.string().regex(/^[A-Za-z0-9\-+& ]{2,50}$/)).optional(),
  time_horizon: z.enum(['NEAR_TERM', 'MID_TERM', 'LONG_TERM']).optional(),
  notes: z.string().max(2000).optional(),
  icp_profile_id: z.string().uuid()
})

const _LeadBriefUpdateSchema = z.object({
  status: z.enum(['draft', 'submitted', 'orchestrated']).optional()
})

// GET /api/lead-briefs - Get all lead briefs
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('page_size') || '50')
    const offset = (page - 1) * pageSize
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user organization
    const { data: profile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()
    
    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }
    
    // Get lead briefs
    const { data, error, count } = await supabase
      .from('lead_briefs')
      .select('*', { count: 'exact' })
      .eq('organization_id', profile.organization_id)
      .eq('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({
      items: data,
      page,
      page_size: pageSize,
      total: count || 0
    })
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/lead-briefs - Create new lead brief
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    
    // Validate request body
    const validatedData = LeadBriefSchema.parse(body)
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user organization
    const { data: profile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()
    
    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }
    
    // Create lead brief
    const { data, error } = await supabase
      .from('lead_briefs')
      .insert({
        ...validatedData,
        organization_id: profile.organization_id,
        created_by: user.id,
        technographics: validatedData.technographics || [],
        installed_tools_hints: validatedData.installed_tools_hints || [],
        intent_keywords: validatedData.intent_keywords || []
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
