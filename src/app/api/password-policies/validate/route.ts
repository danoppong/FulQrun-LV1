// Password Validation API Routes
// API endpoints for password validation and policy enforcement

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { z } from 'zod';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const PasswordValidationSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  email: z.string().email().optional()
});

const PasswordStatusSchema = z.object({
  user_id: z.string().uuid().optional()
});

// =============================================================================
// POST /api/password-policies/validate
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
    const validatedData = PasswordValidationSchema.parse(body);

    // Validate password against policy using database function
    const { data: validationResult, error: validationError } = await supabase
      .rpc('api_validate_password', {
        user_uuid: user.id,
        password_text: validatedData.password,
        email_text: validatedData.email || user.email
      });

    if (validationError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
    }

    return NextResponse.json({ 
      validation: validationResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error validating password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================================================
// GET /api/password-policies/requirements
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get password policy requirements using database function
    const { data: requirements, error: requirementsError } = await supabase
      .rpc('get_password_policy_requirements', {
        user_uuid: user.id
      });

    if (requirementsError) {
      return NextResponse.json({ error: 'Failed to get requirements' }, { status: 500 });
    }

    return NextResponse.json({ requirements });
  } catch (error) {
    console.error('Error getting password requirements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
