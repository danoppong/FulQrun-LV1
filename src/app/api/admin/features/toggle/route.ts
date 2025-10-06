// API Route: Toggle Module Feature
// Enables or disables a specific module feature

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
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

// Helper function to get organization ID
async function getOrganizationId(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error('User not found');
  }

  return data.organization_id;
}

// POST /api/admin/features/toggle
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationId(supabase, user.id);

    // Parse request body
    const { moduleName, featureKey, enabled } = await request.json();

    if (!moduleName || !featureKey || enabled === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: moduleName, featureKey, enabled' },
        { status: 400 }
      );
    }

    console.log('🔄 Toggling feature:', { 
      organizationId, 
      moduleName, 
      featureKey, 
      enabled 
    });

    // Update feature in database using RPC function
    const { data, error } = await supabase.rpc('toggle_module_feature', {
      p_organization_id: organizationId,
      p_module_name: moduleName,
      p_feature_key: featureKey,
      p_enabled: enabled,
      p_user_id: user.id
    });

    if (error) {
      console.error('❌ Error toggling feature:', error);
      throw error;
    }

    console.log('✅ Feature toggled successfully:', data);

    return NextResponse.json({ 
      success: true,
      feature: data 
    });

  } catch (error) {
    console.error('❌ Error in toggle API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to toggle feature',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

