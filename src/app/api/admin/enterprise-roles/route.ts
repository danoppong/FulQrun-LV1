// API Route: Enterprise Roles Management
// Handles enterprise role CRUD operations

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

// GET /api/admin/enterprise-roles - List all enterprise roles
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request);
    const organizationId = await checkSuperAdminPermission(supabase, user.id);

    console.log('📋 Fetching enterprise roles for organization:', organizationId);

    // Fetch all users with their enterprise roles
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        enterprise_role,
        organization_id,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .not('enterprise_role', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching enterprise roles:', error);
      throw error;
    }

    console.log(`✅ Found ${users?.length || 0} users with enterprise roles`);

    // Transform to enterprise role format
    const enterpriseRoles = users?.map(u => ({
      id: u.id,
      userId: u.id,
      userEmail: u.email,
      userFullName: u.full_name || '',
      enterpriseRole: u.enterprise_role,
      organizationId: u.organization_id,
      grantedBy: 'system', // We'll track this properly later
      grantedAt: u.created_at,
      isActive: true,
      permissions: getPermissionsForRole(u.enterprise_role)
    })) || [];

    return NextResponse.json({ enterpriseRoles });

  } catch (error) {
    console.error('❌ Error in GET /api/admin/enterprise-roles:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch enterprise roles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: error instanceof Error && error.message.includes('Insufficient permissions') ? 403 : 500 }
    );
  }
}

// POST /api/admin/enterprise-roles - Grant enterprise role
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request);
    const organizationId = await checkSuperAdminPermission(supabase, user.id);

    const body = await request.json();
    const { userId, enterpriseRole, expiresAt } = body;

    if (!userId || !enterpriseRole) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, enterpriseRole' },
        { status: 400 }
      );
    }

    console.log('➕ Granting enterprise role:', { userId, enterpriseRole });

    // Verify the target user belongs to the same organization
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('organization_id, email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    if (targetUser.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'Cannot grant roles to users from other organizations' },
        { status: 403 }
      );
    }

    // Update the user's enterprise role
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

    console.log('✅ Enterprise role granted successfully');

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
    console.error('❌ Error in POST /api/admin/enterprise-roles:', error);
    return NextResponse.json(
      { 
        error: 'Failed to grant enterprise role',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
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
