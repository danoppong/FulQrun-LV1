// Password Policy Status API Routes
// API endpoints for password policy status and management

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { z } from 'zod';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const PasswordStatusSchema = z.object({
  user_id: z.string().uuid().optional()
});

// =============================================================================
// GET /api/password-policies/status
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || user.id;

    // Get password policy status using database function
    const { data: status, error: statusError } = await supabase
      .rpc('get_password_policy_status', {
        user_uuid: userId
      });

    if (statusError) {
      return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
    }

    // Get recent violations
    const { data: violations, error: violationsError } = await supabase
      .from('password_policy_violations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (violationsError) {
      console.warn('Failed to get violations:', violationsError);
    }

    return NextResponse.json({ 
      status: status[0] || null,
      recent_violations: violations || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting password status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

