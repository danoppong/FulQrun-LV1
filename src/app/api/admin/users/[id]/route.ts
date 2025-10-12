// API Route: User Management - Individual User Operations
// Handles updating and deleting specific users

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
type SelectClient<T> = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => { single: () => Promise<{ data: T | null; error: unknown }> }
    }
  }
}

type UpdateClient<T> = {
  from: (table: string) => {
    update: (val: Record<string, unknown>) => {
      eq: (column: string, value: string) => {
        select: () => { single: () => Promise<{ data: T | null; error: unknown }> }
      }
    }
  }
}

type UserRow = {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
  organization_id: string
  department?: string | null
  manager_id?: string | null
  updated_at: string
}

async function checkAdminPermission(supabase: unknown, userId: string) {
  const { data, error } = await (supabase as unknown as SelectClient<{ role?: string; organization_id?: string }>)
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
    const { user, supabase } = await getAuthenticatedUser();
    const organizationId = await checkAdminPermission(supabase, user.id);

    const { id: userId } = await params;
    const schema = z.object({
      email: z.string().email().optional(),
      fullName: z.string().min(1).optional(),
      role: z.enum(['rep','manager','admin','super_admin']).optional(),
      department: z.string().optional(),
      managerId: z.string().uuid().nullable().optional(),
      isActive: z.boolean().optional(),
      region: z.string().min(1).nullable().optional(),
      country: z.string().min(1).nullable().optional(),
    })
    const { email, fullName, role, department, managerId, isActive, region, country } = schema.parse(await request.json())

  console.log('✏️ Updating user:', userId, { email, fullName, role, department, managerId, isActive, region, country });

    // Verify the user belongs to the same organization
    const { data: targetUser, error: checkError } = await (supabase as unknown as SelectClient<{ email: string | null; organization_id: string }>)
      .from('users')
      .select('email, organization_id')
      .eq('id', userId)
      .single();

    if (checkError) {
      console.error('❌ Error checking user:', checkError);
      return NextResponse.json(
        { error: 'User not found', details: String((checkError as Error).message || checkError) },
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
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (email !== undefined) updateData.email = email;
    if (fullName !== undefined) updateData.full_name = fullName;
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (managerId !== undefined) updateData.manager_id = managerId || null;

    console.log('📝 Update data:', updateData);

    // Update the user record
    const { data: updatedUserRaw, error: updateError } = await (supabase as unknown as UpdateClient<UserRow>)
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
    const updatedUser = updatedUserRaw as UserRow | null

    if (updateError) {
      console.error('❌ Error updating user in database:', updateError);
      return NextResponse.json(
        { 
          error: 'Failed to update user in database',
          details: String((updateError as Error).message || updateError),
          code: (updateError as { code?: string } | null)?.code
        },
        { status: 500 }
      );
    }

  // Also update the auth email if it changed (service role only)
    // Narrow type for targetUser
    const target = targetUser as { email: string | null; organization_id: string }
    if (email && email !== target.email) {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (serviceKey) {
          const { createClient } = await import('@supabase/supabase-js')
          const { supabaseConfig } = await import('@/lib/config')
          const admin = createClient(supabaseConfig.url!, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    console.log('📧 Updating auth email from', target.email, 'to', email)
          const { error: authError } = await admin.auth.admin.updateUserById(userId, { email })
          if (authError) console.error('⚠️ Warning: Failed to update auth email:', authError)
        } else {
          console.warn('Service role key not configured; skipping auth email update')
        }
      }

    if (!updatedUser) {
      return NextResponse.json({ error: 'User update returned no data' }, { status: 500 })
    }
    console.log('✅ User updated successfully:', updatedUser.id);

    // Sync active status with auth (ban/unban)
    if (typeof isActive === 'boolean') {
      try {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (serviceKey) {
          const { createClient } = await import('@supabase/supabase-js')
          const { supabaseConfig } = await import('@/lib/config')
          const admin = createClient(supabaseConfig.url!, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
          if (isActive) {
            await admin.auth.admin.updateUserById(userId, { ban_duration: 'none' })
          } else {
            await admin.auth.admin.updateUserById(userId, { ban_duration: '876000h' })
          }
        } else {
          console.warn('Service role key not configured; skipping active status sync')
        }
      } catch (e) {
        console.warn('⚠️ Warning: Failed to sync active status with auth:', e)
      }
    }

    // Update region/country in user_profiles when provided
    if (region !== undefined || country !== undefined) {
      try {
        const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (region !== undefined) payload.region = region
        if (country !== undefined) payload.country = country

        // Try upsert with current client first (RLS may allow org admins)
        type UpsertClient = {
          from: (t: string) => {
            upsert: (v: Record<string, unknown>, opts: { onConflict?: string }) => {
              select: (cols: string) => { single: () => Promise<{ data: { user_id: string } | null; error: unknown }> }
            }
          }
        }
        let ok = false
        try {
          const { data: up1, error: err1 } = await (supabase as unknown as UpsertClient)
            .from('user_profiles')
            .upsert({ user_id: userId, organization_id: organizationId, ...payload }, { onConflict: 'user_id' })
            .select('user_id')
            .single()
          if (!err1 && up1) ok = true
        } catch { /* ignore */ }
        if (!ok) {
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
          if (serviceKey) {
            const { createClient } = await import('@supabase/supabase-js')
            const { supabaseConfig } = await import('@/lib/config')
            const admin = createClient(supabaseConfig.url!, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
            const { error: err2 } = await admin
              .from('user_profiles')
              .upsert({ user_id: userId, organization_id: organizationId, ...payload }, { onConflict: 'user_id' })
            if (err2) console.error('⚠️ Failed to upsert user_profiles:', err2)
          } else {
            console.warn('Service role not configured; skipping user_profiles update')
          }
        }
      } catch (e) {
        console.error('⚠️ Error updating user_profiles:', e)
      }
    }

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
        isActive: typeof isActive === 'boolean' ? isActive : true,
        region: region ?? undefined,
        country: country ?? undefined,
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
  const { user, supabase } = await getAuthenticatedUser();
    const organizationId = await checkAdminPermission(supabase, user.id);

    const { id: userId } = await params;

    console.log('🗑️ Deleting user:', userId);

    // Verify the user belongs to the same organization
    const { data: targetUser, error: checkError } = await (supabase as unknown as SelectClient<{ organization_id: string }>)
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

    const tu = targetUser as { organization_id: string }
    if (tu.organization_id !== organizationId) {
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

    // Also delete the auth user (service role)
    {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (serviceKey) {
        const { createClient } = await import('@supabase/supabase-js')
        const { supabaseConfig } = await import('@/lib/config')
        const admin = createClient(supabaseConfig.url!, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
        await admin.auth.admin.deleteUser(userId)
      } else {
        console.warn('Service role key not configured; skipping auth user deletion')
      }
    }

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

