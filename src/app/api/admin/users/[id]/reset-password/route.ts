// API Route: Reset User Password
// Sends a password reset email to the user

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseConfig } from '@/lib/config';

// Helper function to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  const supabase = createServerClient(
    supabaseConfig.url!,
    supabaseConfig.anonKey!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Not authenticated');
  }

  return { user, supabase };
}

// Helper function to check admin permission
async function checkAdminPermission(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error('User not found');
  }

  if (!['admin', 'super_admin'].includes(data.role)) {
    throw new Error('Insufficient permissions');
  }

  return data.organization_id;
}

// POST /api/admin/users/[id]/reset-password - Reset user password
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request);
    const organizationId = await checkAdminPermission(supabase, user.id);

    const userId = params.id;

    console.log('🔑 Resetting password for user:', userId);

    // Get the target user's email
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('email, organization_id')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (targetUser.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'Cannot reset password for users from other organizations' },
        { status: 403 }
      );
    }

    // Generate a password reset link using Supabase Admin API
    const { error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: targetUser.email,
    });

    if (resetError) {
      console.error('❌ Error generating password reset link:', resetError);
      throw resetError;
    }

    console.log('✅ Password reset email sent successfully');

    return NextResponse.json({ 
      success: true,
      message: `Password reset email sent to ${targetUser.email}`
    });

  } catch (error) {
    console.error('❌ Error in POST /api/admin/users/[id]/reset-password:', error);
    return NextResponse.json(
      { 
        error: 'Failed to reset password',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

