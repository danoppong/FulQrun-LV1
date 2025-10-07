// API Route: User Management - Individual User Operations
// Handles updating and deleting specific users

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
async function checkAdminPermission(supabase: unknown, userId: string) {
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

// PUT /api/admin/users/[id] - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request);
    const organizationId = await checkAdminPermission(supabase, user.id);

    const { id: userId } = await params;
    const body = await request.json();
    const { email, fullName, role, department, managerId, isActive } = body;

    console.log('✏️ Updating user:', userId, { email, fullName, role, department, managerId, isActive });

    // Verify the user belongs to the same organization
    const { data: targetUser, error: checkError } = await supabase
      .from('users')
      .select('email, organization_id')
      .eq('id', userId)
      .single();

    if (checkError) {
      console.error('❌ Error checking user:', checkError);
      return NextResponse.json(
        { error: 'User not found', details: checkError.message },
        { status: 404 }
      );
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found', details: 'No user with that ID' },
        { status: 404 }
      );
    }

    if (targetUser.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'Cannot modify users from other organizations', details: 'Organization mismatch' },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: unknown = {
      updated_at: new Date().toISOString()
    };

    if (email !== undefined) updateData.email = email;
    if (fullName !== undefined) updateData.full_name = fullName;
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (managerId !== undefined) updateData.manager_id = managerId || null;

    console.log('📝 Update data:', updateData);

    // Update the user record
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating user in database:', updateError);
      return NextResponse.json(
        { 
          error: 'Failed to update user in database',
          details: updateError.message,
          code: updateError.code
        },
        { status: 500 }
      );
    }

    // Also update the auth email if it changed
    if (email && email !== targetUser.email) {
      console.log('📧 Updating auth email from', targetUser.email, 'to', email);
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, { email });
      
      if (authError) {
        console.error('⚠️ Warning: Failed to update auth email:', authError);
        // Don't fail the whole operation if just the email update fails
      }
    }

    console.log('✅ User updated successfully:', updatedUser.id);

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.full_name,
        role: updatedUser.role,
        organizationId: updatedUser.organization_id,
        department: updatedUser.department,
        managerId: updatedUser.manager_id,
        updatedAt: updatedUser.updated_at,
        isActive: true
      }
    });

  } catch (error) {
    console.error('❌ Error in PUT /api/admin/users/[id]:', error);
    
    // More detailed error logging
    if (error && typeof error === 'object') {
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update user',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request);
    const organizationId = await checkAdminPermission(supabase, user.id);

    const { id: userId } = await params;

    console.log('🗑️ Deleting user:', userId);

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
        { error: 'Cannot delete users from other organizations' },
        { status: 403 }
      );
    }

    // Prevent deleting yourself
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete the user record (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('❌ Error deleting user:', deleteError);
      throw deleteError;
    }

    // Also delete the auth user
    await supabase.auth.admin.deleteUser(userId);

    console.log('✅ User deleted successfully');

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error in DELETE /api/admin/users/[id]:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

