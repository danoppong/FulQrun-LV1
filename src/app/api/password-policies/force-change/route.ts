// Password Policy Force Change API Route
// API endpoint for forcing password changes

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { z } from 'zod';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const ForcePasswordChangeSchema = z.object({
  user_id: z.string().uuid(),
  reason: z.string().optional()
});

// =============================================================================
// POST /api/password-policies/force-change
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = ForcePasswordChangeSchema.parse(body);

    // Check if user has permission to force password change
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if target user is in same organization
    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', validatedData.user_id)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    if (targetUser.organization_id !== userData.organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Force password change using database function
    const { data: result, error: forceError } = await supabase
      .rpc('force_password_change', {
        user_uuid: validatedData.user_id,
        reason: validatedData.reason || 'admin_forced'
      });

    if (forceError) {
      return NextResponse.json({ error: 'Failed to force password change' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: result,
      message: 'Password change forced successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error forcing password change:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
