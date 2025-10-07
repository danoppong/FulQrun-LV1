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
// PERMISSIONS API ENDPOINTS
// =============================================================================

// GET /api/admin/permissions - List all permissions
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationAndCheckPermission(supabase, user.id);

    console.log('📋 Fetching permissions for organization:', organizationId);

    // Fetch permissions grouped by category
    const { data: permissions, error } = await supabase
      .from('permissions')
      .select(`
        id,
        permission_key,
        permission_name,
        permission_category,
        description,
        module_name,
        is_system_permission,
        parent_permission_id,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .order('permission_category, permission_name');

    if (error) {
      console.error('❌ Error fetching permissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch permissions', details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${permissions.length} permissions.`);
    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('❌ Error in GET /api/admin/permissions:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve permissions', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/admin/permissions - Create new permission
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationAndCheckPermission(supabase, user.id);

    const body = await request.json();
    const { permissionKey, permissionName, permissionCategory, description, moduleName, parentPermissionId } = body;

    console.log('➕ Creating new permission:', { permissionKey, permissionName, organizationId });

    // Validate required fields
    if (!permissionKey || !permissionName || !permissionCategory || !moduleName) {
      return NextResponse.json(
        { error: 'Invalid request body', details: 'permissionKey, permissionName, permissionCategory, and moduleName are required' },
        { status: 400 }
      );
    }

    // Check if permission key already exists
    const { data: existingPermission } = await supabase
      .from('permissions')
      .select('id')
      .eq('permission_key', permissionKey)
      .eq('organization_id', organizationId)
      .single();

    if (existingPermission) {
      return NextResponse.json(
        { error: 'Permission key already exists', details: 'A permission with this key already exists' },
        { status: 409 }
      );
    }

    // Create the permission
    const { data: newPermission, error: permissionError } = await supabase
      .from('permissions')
      .insert({
        permission_key: permissionKey,
        permission_name: permissionName,
        permission_category: permissionCategory,
        description: description || null,
        module_name: moduleName,
        parent_permission_id: parentPermissionId || null,
        organization_id: organizationId,
        is_system_permission: false,
        created_by: user.id,
        updated_by: user.id
      })
      .select()
      .single();

    if (permissionError) {
      console.error('❌ Error creating permission:', permissionError);
      return NextResponse.json(
        { error: 'Failed to create permission', details: permissionError.message },
        { status: 500 }
      );
    }

    console.log('✅ Permission created successfully:', newPermission.id);

    return NextResponse.json({
      success: true,
      permission: {
        id: newPermission.id,
        permissionKey: newPermission.permission_key,
        permissionName: newPermission.permission_name,
        permissionCategory: newPermission.permission_category,
        description: newPermission.description,
        moduleName: newPermission.module_name,
        isSystemPermission: newPermission.is_system_permission,
        parentPermissionId: newPermission.parent_permission_id,
        createdAt: newPermission.created_at,
        updatedAt: newPermission.updated_at
      }
    });
  } catch (error) {
    console.error('❌ Error in POST /api/admin/permissions:', error);
    return NextResponse.json(
      { error: 'Failed to create permission', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
