// API Route: Individual Enterprise Role Operations
// Handles updating and removing specific enterprise roles

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

// Helper function to check super admin permission
async function checkSuperAdminPermission(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('role, enterprise_role, organization_id')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error('User not found');
  }

  // Check if user has super admin enterprise role
  if (data.enterprise_role !== 'super_admin') {
    throw new Error('Insufficient permissions - Super Admin required');
  }

  return data.organization_id;
}

// Helper function to get permissions for a role
function getPermissionsForRole(role: string): string[] {
  const permissions = {
    'user': [
      'enterprise.view',
      'enterprise.profile.edit'
    ],
    'manager': [
      'enterprise.view',
      'enterprise.profile.edit',
      'enterprise.users.view',
      'enterprise.reports.view',
      'enterprise.analytics.view'
    ],
    'admin': [
      'enterprise.view',
      'enterprise.profile.edit',
      'enterprise.users.view',
      'enterprise.users.edit',
      'enterprise.reports.view',
      'enterprise.reports.create',
      'enterprise.analytics.view',
      'enterprise.analytics.create',
      'enterprise.settings.view',
      'enterprise.settings.edit'
    ],
    'super_admin': [
      'enterprise.view',
      'enterprise.profile.edit',
      'enterprise.users.view',
      'enterprise.users.edit',
      'enterprise.users.delete',
      'enterprise.reports.view',
      'enterprise.reports.create',
      'enterprise.reports.delete',
      'enterprise.analytics.view',
      'enterprise.analytics.create',
      'enterprise.analytics.delete',
      'enterprise.settings.view',
      'enterprise.settings.edit',
      'enterprise.settings.delete',
      'enterprise.roles.view',
      'enterprise.roles.edit',
      'enterprise.roles.delete',
      'enterprise.audit.view',
      'enterprise.billing.view',
      'enterprise.billing.edit'
    ]
  };

  return permissions[role as keyof typeof permissions] || [];
}

// PUT /api/admin/enterprise-roles/[id] - Update enterprise role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request);
    const organizationId = await checkSuperAdminPermission(supabase, user.id);

    const { id: userId } = await params;
    const body = await request.json();
    const { enterpriseRole } = body;

    console.log('✏️ Updating enterprise role:', userId, { enterpriseRole });

    // Verify the target user belongs to the same organization
    const { data: targetUser, error: checkError } = await supabase
      .from('users')
      .select('organization_id, email, full_name')
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

    // Prevent removing your own super admin role
    if (userId === user.id && enterpriseRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot remove your own super admin role' },
        { status: 400 }
      );
    }

    // Update the enterprise role
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        enterprise_role: enterpriseRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating enterprise role:', updateError);
      throw updateError;
    }

    console.log('✅ Enterprise role updated successfully');

    return NextResponse.json({
      success: true,
      enterpriseRole: {
        id: updatedUser.id,
        userId: updatedUser.id,
        userEmail: updatedUser.email,
        userFullName: updatedUser.full_name,
        enterpriseRole: updatedUser.enterprise_role,
        organizationId: updatedUser.organization_id,
        grantedBy: user.id,
        grantedAt: new Date().toISOString(),
        isActive: true,
        permissions: getPermissionsForRole(updatedUser.enterprise_role)
      }
    });

  } catch (error) {
    console.error('❌ Error in PUT /api/admin/enterprise-roles/[id]:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update enterprise role',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/enterprise-roles/[id] - Remove enterprise role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request);
    const organizationId = await checkSuperAdminPermission(supabase, user.id);

    const { id: userId } = await params;

    console.log('🗑️ Removing enterprise role:', userId);

    // Verify the target user belongs to the same organization
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

    // Prevent removing your own super admin role
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot remove your own super admin role' },
        { status: 400 }
      );
    }

    // Remove the enterprise role (set to null)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        enterprise_role: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Error removing enterprise role:', updateError);
      throw updateError;
    }

    console.log('✅ Enterprise role removed successfully');

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error in DELETE /api/admin/enterprise-roles/[id]:', error);
    return NextResponse.json(
      { 
        error: 'Failed to remove enterprise role',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
