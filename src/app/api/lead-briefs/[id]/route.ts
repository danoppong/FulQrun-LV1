import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Validation schemas
const LeadBriefUpdateSchema = z.object({
  lead_type: z.enum(['account', 'contact']).optional(),
  geography: z.enum(['US', 'EU', 'UK', 'APAC']).optional(),
  industry: z.string().optional(),
  revenue_band: z.enum(['<$10M', '$10–50M', '$50–250M', '$250M–$1B', '>$1B']).optional(),
  employee_band: z.enum(['1–50', '51–200', '201–1k', '1k–5k', '>5k']).optional(),
  entity_type: z.enum(['PUBLIC', 'PRIVATE', 'NONPROFIT', 'OTHER']).optional(),
  technographics: z.array(z.string()).max(50).optional(),
  installed_tools_hints: z.array(z.string()).optional(),
  intent_keywords: z.array(z.string().regex(/^[A-Za-z0-9\-+& ]{2,50}$/)).optional(),
  time_horizon: z.enum(['NEAR_TERM', 'MID_TERM', 'LONG_TERM']).optional(),
  notes: z.string().max(2000).optional(),
  icp_profile_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'submitted', 'orchestrated']).optional()
})

// GET /api/lead-briefs/[id] - Get specific lead brief
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient()
    const { id } = await params
    
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
    
    // Get lead brief
    const { data, error } = await supabase
      .from('lead_briefs')
      .select('*')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .eq('deleted_at', null)
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/lead-briefs/[id] - Update lead brief
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient()
    const { id } = await params
    const body = await request.json()
    
    // Validate request body
    const validatedData = LeadBriefUpdateSchema.parse(body)
    
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
    
    // Update lead brief
    const { data, error } = await supabase
      .from('lead_briefs')
      .update(validatedData)
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .eq('deleted_at', null)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/lead-briefs/[id] - Soft delete lead brief
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient()
    const { id } = await params
    
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
    
    // Check if lead brief is orchestrated (has generated leads)
    const { data: brief } = await supabase
      .from('lead_briefs')
      .select('status')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .eq('deleted_at', null)
      .single()
    
    if (brief?.status === 'orchestrated') {
      return NextResponse.json({ 
        error: 'Cannot delete lead brief that has been orchestrated' 
      }, { status: 400 })
    }
    
    // Soft delete lead brief
    const { error } = await supabase
      .from('lead_briefs')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ message: 'Lead brief deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
