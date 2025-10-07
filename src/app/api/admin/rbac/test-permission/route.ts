import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseConfig } from '@/lib/config';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

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

async function getOrganizationAndCheckPermission(supabase: any, userId: string) {
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', userId)
    .single();

  if (userError || !userData?.organization_id) {
    throw new Error('User organization not found');
  }

  // Check if user has admin permissions
  if (!['admin', 'super_admin'].includes(userData.role)) {
    throw new Error('Insufficient permissions - Admin required');
  }

  return userData.organization_id;
}

// =============================================================================
// PERMISSION TESTING API ENDPOINTS
// =============================================================================

// POST /api/admin/rbac/test-permission - Test user permission
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationAndCheckPermission(supabase, user.id);

    const body = await request.json();
    const { testUserId, permissionKey } = body;

    console.log('🧪 Testing permission:', { testUserId, permissionKey, organizationId });

    // Validate required fields
    if (!testUserId || !permissionKey) {
      return NextResponse.json(
        { error: 'Invalid request body', details: 'testUserId and permissionKey are required' },
        { status: 400 }
      );
    }

    // Verify test user belongs to the same organization
    const { data: testUser, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', testUserId)
      .eq('organization_id', organizationId)
      .single();

    if (userError || !testUser) {
      return NextResponse.json(
        { error: 'Test user not found', details: 'User does not exist or is not in your organization' },
        { status: 404 }
      );
    }

    // Test permission using the database function
    const { data: hasPermission, error: permError } = await supabase
      .rpc('has_permission', {
        p_user_id: testUserId,
        p_permission_key: permissionKey,
        p_organization_id: organizationId
      });

    if (permError) {
      console.error('❌ Error testing permission:', permError);
      return NextResponse.json(
        { error: 'Failed to test permission', details: permError.message },
        { status: 500 }
      );
    }

    // Get user roles for context
    const { data: userRoles, error: rolesError } = await supabase
      .rpc('get_user_roles', {
        p_user_id: testUserId,
        p_organization_id: organizationId
      });

    if (rolesError) {
      console.error('❌ Error fetching user roles:', rolesError);
      // Don't fail the whole operation, just log the error
    }

    // Log the permission test
    const { error: auditError } = await supabase
      .from('rbac_audit_log')
      .insert({
        user_id: user.id,
        action: 'Permission Test',
        resource_type: 'permission',
        resource_id: permissionKey,
        permission_key: permissionKey,
        result: hasPermission ? 'Granted' : 'Denied',
        details: {
          test_user_id: testUserId,
          test_user_email: testUser.email,
          organization_id: organizationId
        },
        organization_id: organizationId
      });

    if (auditError) {
      console.error('❌ Error logging permission test:', auditError);
      // Don't fail the whole operation, just log the error
    }

    console.log('✅ Permission test completed:', { 
      user: testUser.email, 
      permission: permissionKey, 
      hasAccess: hasPermission 
    });

    return NextResponse.json({
      success: true,
      result: {
        user: {
          id: testUser.id,
          email: testUser.email,
          fullName: testUser.full_name
        },
        permission: permissionKey,
        hasAccess: hasPermission,
        reason: hasPermission ? 'User has required role' : 'User lacks required role',
        userRoles: userRoles || [],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error in POST /api/admin/rbac/test-permission:', error);
    return NextResponse.json(
      { error: 'Failed to test permission', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
