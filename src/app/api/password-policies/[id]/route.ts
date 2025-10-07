// Password Policy Individual API Routes
// API endpoints for individual password policy operations

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
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

// =============================================================================
// GET /api/password-policies/[id]
// =============================================================================

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get password policy
    const { data: policy, error: policyError } = await supabase
      .from('password_policies')
      .select(`
        *,
        password_policy_assignments (
          id,
          user_id,
          role_id,
          assigned_at,
          expires_at,
          is_active,
          users (id, email, first_name, last_name),
          roles (id, name, description)
        )
      `)
      .eq('id', params.id)
      .eq('organization_id', userData.organization_id)
      .single();

    if (policyError || !policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    return NextResponse.json({ policy });
  } catch (error) {
    console.error('Error fetching password policy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================================================
// PUT /api/password-policies/[id]
// =============================================================================

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Update password policy
    const { data: policy, error: policyError } = await supabase
      .from('password_policies')
      .update({
        ...validatedData,
        updated_by: user.id
      })
      .eq('id', params.id)
      .eq('organization_id', userData.organization_id)
      .select()
      .single();

    if (policyError) {
      return NextResponse.json({ error: 'Failed to update policy' }, { status: 500 });
    }

    // Log the policy update
    await supabase
      .from('password_policy_audit_log')
      .insert({
        policy_id: policy.id,
        user_id: user.id,
        action_type: 'policy_updated',
        action_details: {
          policy_name: policy.policy_name,
          updated_at: new Date().toISOString(),
          changes: validatedData
        }
      });

    return NextResponse.json({ policy });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error updating password policy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================================================
// DELETE /api/password-policies/[id]
// =============================================================================

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if policy exists and belongs to organization
    const { data: existingPolicy, error: checkError } = await supabase
      .from('password_policies')
      .select('id, policy_name, is_default')
      .eq('id', params.id)
      .eq('organization_id', userData.organization_id)
      .single();

    if (checkError || !existingPolicy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    // Prevent deletion of default policy
    if (existingPolicy.is_default) {
      return NextResponse.json({ error: 'Cannot delete default policy' }, { status: 400 });
    }

    // Delete password policy
    const { error: deleteError } = await supabase
      .from('password_policies')
      .delete()
      .eq('id', params.id)
      .eq('organization_id', userData.organization_id);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete policy' }, { status: 500 });
    }

    // Log the policy deletion
    await supabase
      .from('password_policy_audit_log')
      .insert({
        policy_id: params.id,
        user_id: user.id,
        action_type: 'policy_deleted',
        action_details: {
          policy_name: existingPolicy.policy_name,
          deleted_at: new Date().toISOString()
        }
      });

    return NextResponse.json({ message: 'Policy deleted successfully' });
  } catch (error) {
    console.error('Error deleting password policy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
