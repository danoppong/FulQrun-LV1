// API Route: User Management
// Handles listing and creating users

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

// Helper function to get organization ID and check admin permission
async function getOrganizationAndCheckPermission(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error('User not found');
  }

  // Check if user has admin permission
  if (!['admin', 'super_admin'].includes(data.role)) {
    throw new Error('Insufficient permissions');
  }

  return data.organization_id;
}

// GET /api/admin/users - List all users in the organization
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationAndCheckPermission(supabase, user.id);

    console.log('📋 Fetching users for organization:', organizationId);

    // Fetch all users in the organization
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        enterprise_role,
        department,
        cost_center,
        manager_id,
        hire_date,
        last_login_at,
        mfa_enabled,
        organization_id,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching users:', error);
      throw error;
    }

    console.log(`✅ Found ${users?.length || 0} users`);

    // Transform users to match frontend interface
    const transformedUsers = users?.map(u => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name || '',
      role: u.role,
      enterpriseRole: u.enterprise_role,
      organizationId: u.organization_id,
      department: u.department,
      managerId: u.manager_id,
      lastLoginAt: u.last_login_at,
      isActive: true, // We'll determine this based on other criteria if needed
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      mfaEnabled: u.mfa_enabled,
      hireDate: u.hire_date,
      costCenter: u.cost_center
    })) || [];

    return NextResponse.json({ users: transformedUsers });

  } catch (error) {
    console.error('❌ Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: error instanceof Error && error.message === 'Insufficient permissions' ? 403 : 500 }
    );
  }
}

// POST /api/admin/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationAndCheckPermission(supabase, user.id);

    const body = await request.json();
    const { email, fullName, role, department, managerId, password } = body;

    if (!email || !fullName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, fullName, role' },
        { status: 400 }
      );
    }

    console.log('➕ Creating new user:', { email, fullName, role });

    // First, create the auth user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: password || Math.random().toString(36).slice(-8), // Generate random password if not provided
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError);
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    // Then, create the user record in the public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
        organization_id: organizationId,
        department,
        manager_id: managerId || null
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Error creating user record:', userError);
      // Cleanup: delete the auth user if we failed to create the user record
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw userError;
    }

    console.log('✅ User created successfully:', userData.id);

    return NextResponse.json({ 
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name,
        role: userData.role,
        organizationId: userData.organization_id,
        department: userData.department,
        managerId: userData.manager_id,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
        isActive: true
      }
    });

  } catch (error) {
    console.error('❌ Error in POST /api/admin/users:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

