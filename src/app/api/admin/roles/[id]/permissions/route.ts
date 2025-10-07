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

async function getOrganizationAndCheckPermission(supabase: unknown, userId: string) {
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
// ROLE PERMISSIONS API ENDPOINTS
// =============================================================================

// GET /api/admin/roles/[id]/permissions - Get role permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationAndCheckPermission(supabase, user.id);

    const { id: roleId } = await params;

    console.log('📋 Fetching permissions for role:', roleId);

    // Verify role belongs to organization
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id, role_key, role_name')
      .eq('id', roleId)
      .eq('organization_id', organizationId)
      .single();

    if (roleError || !role) {
      return NextResponse.json(
        { error: 'Role not found', details: 'Role does not exist or you do not have access' },
        { status: 404 }
      );
    }

    // Get role permissions
    const { data: permissions, error } = await supabase
      .from('role_permissions')
      .select(`
        permission_id,
        permissions!inner(
          id,
          permission_key,
          permission_name,
          permission_category,
          description,
          module_name
        )
      `)
      .eq('role_id', roleId);

    if (error) {
      console.error('❌ Error fetching role permissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch role permissions', details: error.message },
        { status: 500 }
      );
    }

    const formattedPermissions = permissions.map(rp => rp.permissions);

    console.log(`✅ Found ${formattedPermissions.length} permissions for role ${role.role_name}.`);
    return NextResponse.json({ 
      role: {
        id: role.id,
        roleKey: role.role_key,
        roleName: role.role_name
      },
      permissions: formattedPermissions 
    });
  } catch (error) {
    console.error('❌ Error in GET /api/admin/roles/[id]/permissions:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve role permissions', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/admin/roles/[id]/permissions - Update role permissions
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationAndCheckPermission(supabase, user.id);

    const { id: roleId } = await params;
    const body = await request.json();
    const { permissions } = body;

    console.log('✏️ Updating permissions for role:', roleId, { permissions });

    // Verify role belongs to organization
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id, role_key, role_name')
      .eq('id', roleId)
      .eq('organization_id', organizationId)
      .single();

    if (roleError || !role) {
      return NextResponse.json(
        { error: 'Role not found', details: 'Role does not exist or you do not have access' },
        { status: 404 }
      );
    }

    // Get permission IDs for the provided permission keys
    const { data: permissionRecords, error: permError } = await supabase
      .from('permissions')
      .select('id, permission_key')
      .in('permission_key', permissions)
      .eq('organization_id', organizationId);

    if (permError) {
      console.error('❌ Error fetching permissions:', permError);
      return NextResponse.json(
        { error: 'Failed to fetch permissions', details: permError.message },
        { status: 500 }
      );
    }

    // Delete existing role permissions
    const { error: deleteError } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);

    if (deleteError) {
      console.error('❌ Error deleting existing role permissions:', deleteError);
      return NextResponse.json(
        { error: 'Failed to update role permissions', details: deleteError.message },
        { status: 500 }
      );
    }

    // Insert new role permissions
    if (permissionRecords.length > 0) {
      const rolePermissions = permissionRecords.map(perm => ({
        role_id: roleId,
        permission_id: perm.id
      }));

      const { error: insertError } = await supabase
        .from('role_permissions')
        .insert(rolePermissions);

      if (insertError) {
        console.error('❌ Error inserting role permissions:', insertError);
        return NextResponse.json(
          { error: 'Failed to update role permissions', details: insertError.message },
          { status: 500 }
        );
      }
    }

    console.log('✅ Role permissions updated successfully for role:', role.role_name);

    return NextResponse.json({
      success: true,
      message: `Permissions updated successfully for role ${role.role_name}`,
      permissions: permissionRecords.map(p => p.permission_key)
    });
  } catch (error) {
    console.error('❌ Error in PUT /api/admin/roles/[id]/permissions:', error);
    return NextResponse.json(
      { error: 'Failed to update role permissions', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
