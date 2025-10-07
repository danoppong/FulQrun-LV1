import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { z } from 'zod';

// Validation schemas
const ICPProfileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  criteria: z.record(z.any()).optional()
})

// GET /api/icp-profiles/[id] - Get specific ICP profile
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
    
    // Get ICP profile
    const { data, error } = await supabase
      .from('icp_profiles')
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

// PUT /api/icp-profiles/[id] - Update ICP profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient()
    const { id } = await params
    const body = await request.json()
    
    // Validate request body
    const validatedData = ICPProfileUpdateSchema.parse(body)
    
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
    
    // Update ICP profile
    const { data, error } = await supabase
      .from('icp_profiles')
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

// DELETE /api/icp-profiles/[id] - Soft delete ICP profile
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
    
    // Check if ICP profile is being used by any lead briefs
    const { data: briefs } = await supabase
      .from('lead_briefs')
      .select('id')
      .eq('icp_profile_id', id)
      .eq('organization_id', profile.organization_id)
      .eq('deleted_at', null)
      .limit(1)
    
    if (briefs && briefs.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete ICP profile that is being used by lead briefs' 
      }, { status: 400 })
    }
    
    // Soft delete ICP profile
    const { error } = await supabase
      .from('icp_profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ message: 'ICP profile deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
