// API Route: Reset User Password
// Sends a password reset email to the user

import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-unified'
import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '@/lib/config'

// Helper function to get authenticated user
async function getAuthenticatedUser() {
  const supabase = await AuthService.getServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { user, supabase }
}

// Helper function to check admin permission
type SelectClient<T> = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => { single: () => Promise<{ data: T | null; error: unknown }> }
    }
  }
}

async function checkAdminPermission(supabase: unknown, userId: string) {
  const { data, error } = await (supabase as unknown as SelectClient<{ role?: string; organization_id?: string }>)
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    const organizationId = await checkAdminPermission(supabase, user.id);

    const { id: userId } = await context.params;

    console.log('🔑 Resetting password for user:', userId);

    // Get the target user's email
    const { data: targetUser, error: userError } = await (supabase as unknown as SelectClient<{ email: string; organization_id: string }>)
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

    // Validate target has an email
    if (!targetUser.email) {
      return NextResponse.json(
        { error: 'User has no email', details: 'Cannot send a reset link without an email address' },
        { status: 400 }
      )
    }

    // Generate a password reset link using Supabase Admin API (service role)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: 'Service role key not configured', details: 'Set SUPABASE_SERVICE_ROLE_KEY in your environment to enable admin password resets.' }, { status: 500 })
  if (!supabaseConfig.url) return NextResponse.json({ error: 'Supabase URL not configured', details: 'Set NEXT_PUBLIC_SUPABASE_URL in your environment.' }, { status: 500 })
    const admin = createClient(supabaseConfig.url!, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const { error: resetError } = await admin.auth.admin.generateLink({ type: 'recovery', email: targetUser.email })

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

