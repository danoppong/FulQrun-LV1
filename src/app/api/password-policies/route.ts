// Password Policy API Routes
// Comprehensive API endpoints for password policy management

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { z } from 'zod';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const PasswordPolicySchema = z.object({
  policy_name: z.string().min(1, 'Policy name is required'),
  description: z.string().optional(),
  min_length: z.number().min(8).max(50),
  require_uppercase: z.boolean(),
  require_lowercase: z.boolean(),
  require_numbers: z.boolean(),
  require_special_chars: z.boolean(),
  max_age_days: z.number().min(30).max(365),
  prevent_reuse_count: z.number().min(1).max(24),
  complexity_score_min: z.number().min(1).max(10),
  max_failed_attempts: z.number().min(3).max(10),
  lockout_duration_minutes: z.number().min(5).max(60),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false)
});

const PasswordValidationSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  email: z.string().email().optional()
});

const PolicyAssignmentSchema = z.object({
  policy_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  role_id: z.string().uuid().optional(),
  expires_at: z.string().datetime().optional()
}).refine(data => data.user_id || data.role_id, {
  message: 'Either user_id or role_id must be provided'
});

// =============================================================================
// GET /api/password-policies
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get password policies for organization
    const { data: policies, error: policiesError } = await supabase
      .from('password_policies')
      .select(`
        *,
        password_policy_assignments (
          id,
          user_id,
          role_id,
          assigned_at,
          expires_at,
          is_active
        )
      `)
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false });

    if (policiesError) {
      return NextResponse.json({ error: 'Failed to fetch policies' }, { status: 500 });
    }

    return NextResponse.json({ policies });
  } catch (error) {
    console.error('Error fetching password policies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================================================
// POST /api/password-policies
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = PasswordPolicySchema.parse(body);

    // If this is being set as default, unset other defaults
    if (validatedData.is_default) {
      await supabase
        .from('password_policies')
        .update({ is_default: false })
        .eq('organization_id', userData.organization_id);
    }

    // Create new password policy
    const { data: policy, error: policyError } = await supabase
      .from('password_policies')
      .insert({
        ...validatedData,
        organization_id: userData.organization_id,
        created_by: user.id
      })
      .select()
      .single();

    if (policyError) {
      return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 });
    }

    // Log the policy creation
    await supabase
      .from('password_policy_audit_log')
      .insert({
        policy_id: policy.id,
        user_id: user.id,
        action_type: 'policy_created',
        action_details: {
          policy_name: policy.policy_name,
          created_at: new Date().toISOString()
        }
      });

    return NextResponse.json({ policy }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating password policy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

