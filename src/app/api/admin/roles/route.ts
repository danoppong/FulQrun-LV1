import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
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
// ROLES API ENDPOINTS
// =============================================================================

// GET /api/admin/roles - List all roles
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationAndCheckPermission(supabase, user.id);

    console.log('📋 Fetching roles for organization:', organizationId);

    // Fetch roles with permission counts
    const { data: roles, error } = await supabase
      .from('roles')
      .select(`
        id,
        role_key,
        role_name,
        description,
        inherits_from,
        is_active,
        is_system_role,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .order('role_name');

    if (error) {
      console.error('❌ Error fetching roles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch roles', details: error.message },
        { status: 500 }
      );
    }

    // Get user counts for each role (users have a role column that matches role_key)
    const rolesWithUserCounts = await Promise.all(
      roles.map(async (role) => {
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', role.role_key)
          .eq('organization_id', organizationId);

        return {
          ...role,
          userCount: count || 0
        };
      })
    );

    console.log(`✅ Found ${rolesWithUserCounts.length} roles.`);
    return NextResponse.json({ roles: rolesWithUserCounts });
  } catch (error) {
    console.error('❌ Error in GET /api/admin/roles:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve roles', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/admin/roles - Create new role
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationAndCheckPermission(supabase, user.id);

    const body = await request.json();
    const { roleKey, roleName, description, inheritsFrom, permissions } = body;

    console.log('➕ Creating new role:', { roleKey, roleName, organizationId });

    // Validate required fields
    if (!roleKey || !roleName) {
      return NextResponse.json(
        { error: 'Invalid request body', details: 'roleKey and roleName are required' },
        { status: 400 }
      );
    }

    // Check if role key already exists
    const { data: existingRole } = await supabase
      .from('roles')
      .select('id')
      .eq('role_key', roleKey)
      .eq('organization_id', organizationId)
      .single();

    if (existingRole) {
      return NextResponse.json(
        { error: 'Role key already exists', details: 'A role with this key already exists' },
        { status: 409 }
      );
    }

    // Create the role
    const { data: newRole, error: roleError } = await supabase
      .from('roles')
      .insert({
        role_key: roleKey,
        role_name: roleName,
        description: description || null,
        inherits_from: inheritsFrom || null,
        organization_id: organizationId
      })
      .select()
      .single();

    if (roleError) {
      console.error('❌ Error creating role:', roleError);
      return NextResponse.json(
        { error: 'Failed to create role', details: roleError.message },
        { status: 500 }
      );
    }

    // Assign permissions if provided
    if (permissions && permissions.length > 0) {
      const { data: permissionRecords, error: permError } = await supabase
        .from('permissions')
        .select('id')
        .in('permission_key', permissions)
        .eq('organization_id', organizationId);

      if (permError) {
        console.error('❌ Error fetching permissions:', permError);
        return NextResponse.json(
          { error: 'Failed to fetch permissions', details: permError.message },
          { status: 500 }
        );
      }

      if (permissionRecords.length > 0) {
        const rolePermissions = permissionRecords.map(perm => ({
          role_id: newRole.id,
          permission_id: perm.id
        }));

        const { error: rolePermError } = await supabase
          .from('role_permissions')
          .insert(rolePermissions);

        if (rolePermError) {
          console.error('❌ Error assigning permissions:', rolePermError);
          // Don't fail the whole operation, just log the error
        }
      }
    }

    console.log('✅ Role created successfully:', newRole.id);

    return NextResponse.json({
      success: true,
      role: {
        id: newRole.id,
        roleKey: newRole.role_key,
        roleName: newRole.role_name,
        description: newRole.description,
        inheritsFrom: newRole.inherits_from,
        isActive: newRole.is_active,
        isSystemRole: newRole.is_system_role,
        userCount: 0,
        createdAt: newRole.created_at,
        updatedAt: newRole.updated_at
      }
    });
  } catch (error) {
    console.error('❌ Error in POST /api/admin/roles:', error);
    return NextResponse.json(
      { error: 'Failed to create role', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
