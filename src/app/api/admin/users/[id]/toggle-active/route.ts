// API Route: Toggle User Active Status
// Enables or disables a user account

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

// POST /api/admin/users/[id]/toggle-active - Toggle user active status
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request);
    const organizationId = await checkAdminPermission(supabase, user.id);

    const userId = params.id;
    const { isActive } = await request.json();

    console.log('🔄 Toggling user active status:', userId, 'to', isActive);

    // Verify the user belongs to the same organization
    const { data: targetUser, error: checkError } = await supabase
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

    // Update the auth user status
    // Note: Supabase doesn't have a direct "isActive" field, but we can ban/unban users
    if (isActive) {
      await supabase.auth.admin.updateUserById(userId, { 
        ban_duration: 'none'
      });
    } else {
      await supabase.auth.admin.updateUserById(userId, { 
        ban_duration: '876000h' // 100 years (effectively permanent)
      });
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

