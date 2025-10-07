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
// RBAC CONFIGURATION API ENDPOINTS
// =============================================================================

// GET /api/admin/rbac/settings - Get RBAC settings
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationAndCheckPermission(supabase, user.id);

    console.log('📋 Fetching RBAC settings for organization:', organizationId);

    // Get RBAC settings
    const { data: settings, error } = await supabase
      .from('rbac_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error fetching RBAC settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch RBAC settings', details: error.message },
        { status: 500 }
      );
    }

    // Return default settings if none exist
    const defaultSettings = {
      enableRbac: true,
      strictMode: false,
      auditLogging: true,
      sessionTimeoutMinutes: 30,
      maxFailedAttempts: 5,
      lockoutDurationMinutes: 15
    };

    console.log('✅ RBAC settings retrieved successfully.');
    return NextResponse.json({ 
      settings: settings || defaultSettings 
    });
  } catch (error) {
    console.error('❌ Error in GET /api/admin/rbac/settings:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve RBAC settings', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/admin/rbac/settings - Update RBAC settings
export async function PUT(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationAndCheckPermission(supabase, user.id);

    const body = await request.json();
    const { 
      enableRbac, 
      strictMode, 
      auditLogging, 
      sessionTimeoutMinutes, 
      maxFailedAttempts, 
      lockoutDurationMinutes 
    } = body;

    console.log('✏️ Updating RBAC settings for organization:', organizationId);

    // Validate required fields
    if (typeof enableRbac !== 'boolean' || 
        typeof strictMode !== 'boolean' || 
        typeof auditLogging !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body', details: 'Boolean fields are required' },
        { status: 400 }
      );
    }

    // Upsert RBAC settings
    const { data: updatedSettings, error } = await supabase
      .from('rbac_settings')
      .upsert({
        organization_id: organizationId,
        enable_rbac: enableRbac,
        strict_mode: strictMode,
        audit_logging: auditLogging,
        session_timeout_minutes: sessionTimeoutMinutes || 30,
        max_failed_attempts: maxFailedAttempts || 5,
        lockout_duration_minutes: lockoutDurationMinutes || 15
      }, {
        onConflict: 'organization_id'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating RBAC settings:', error);
      return NextResponse.json(
        { error: 'Failed to update RBAC settings', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ RBAC settings updated successfully.');

    return NextResponse.json({
      success: true,
      settings: {
        enableRbac: updatedSettings.enable_rbac,
        strictMode: updatedSettings.strict_mode,
        auditLogging: updatedSettings.audit_logging,
        sessionTimeoutMinutes: updatedSettings.session_timeout_minutes,
        maxFailedAttempts: updatedSettings.max_failed_attempts,
        lockoutDurationMinutes: updatedSettings.lockout_duration_minutes
      }
    });
  } catch (error) {
    console.error('❌ Error in PUT /api/admin/rbac/settings:', error);
    return NextResponse.json(
      { error: 'Failed to update RBAC settings', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
