// API Route: Toggle User Active Status
// Enables or disables a user account

import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-unified'
import { z } from 'zod'

// Helper function to get authenticated user
async function getAuthenticatedUser() {
  const supabase = await AuthService.getServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { user, supabase }
}

// Helper function to check admin permission
type SelectClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => { single: () => Promise<{ data: { role?: string; organization_id?: string } | null; error: unknown }> }
    }
  }
}

async function checkAdminPermission(supabase: unknown, userId: string) {
  const { data, error } = await (supabase as unknown as SelectClient)
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

// POST /api/admin/users/[id]/toggle-active - Toggle user active status
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    const organizationId = await checkAdminPermission(supabase, user.id);

    const { id: userId } = await context.params;
    const { isActive } = z.object({ isActive: z.boolean() }).parse(await request.json());

    console.log('🔄 Toggling user active status:', userId, 'to', isActive);

    // Verify the user belongs to the same organization
    const { data: targetUser, error: checkError } = await (supabase as unknown as SelectClient)
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (checkError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (targetUser.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'Cannot modify users from other organizations' },
        { status: 403 }
      );
    }

    // Prevent disabling yourself
    if (userId === user.id && !isActive) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // Update the auth user status via service-role client
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }
    const { createClient } = await import('@supabase/supabase-js')
    const { supabaseConfig } = await import('@/lib/config')
    const admin = createClient(supabaseConfig.url!, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    if (isActive) {
      await admin.auth.admin.updateUserById(userId, { ban_duration: 'none' })
    } else {
      await admin.auth.admin.updateUserById(userId, { ban_duration: '876000h' })
    }

    console.log('✅ User active status toggled successfully');

    return NextResponse.json({ 
      success: true,
      isActive 
    });

  } catch (error) {
    console.error('❌ Error in POST /api/admin/users/[id]/toggle-active:', error);
    return NextResponse.json(
      { 
        error: 'Failed to toggle user status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

