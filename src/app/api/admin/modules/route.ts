// Administration Module - Module Configuration API Routes
// API routes for module-specific configuration management

import { NextRequest, NextResponse } from 'next/server'
import { ConfigurationService } from '@/lib/admin/services/ConfigurationService'
import { createServerClient } from '@supabase/ssr'
import { supabaseConfig } from '@/lib/config';

// Helper functions using server-side Supabase client
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

async function getOrganizationId(supabase: unknown, userId: string) {
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

async function checkAdminPermission(supabase: unknown, userId: string, permission: string) {
  // For now, return true to allow access - implement proper RBAC later
  // const { data, error } = await supabase.rpc('has_admin_permission', {
  //   p_user_id: userId,
  //   p_permission_key: permission
  // });

  // if (error || !data) {
  //   return false;
  // }

  // return data;
  return true;
}

// GET /api/admin/modules
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationId(supabase, user.id);

    console.log('🔍 Fetching modules for:', { 
      userId: user.id, 
      email: user.email,
      organizationId 
    });

    // Check permission
    const hasPermission = await checkAdminPermission(supabase, user.id, 'admin.modules.view');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const configService = new ConfigurationService(organizationId, user.id);
    const features = await configService.getModuleFeatures();

    console.log('📊 Features retrieved:', { 
      count: features.length,
      modules: [...new Set(features.map(f => f.moduleName))]
    });

    // Group features by module
    const modules = features.reduce((acc, feature) => {
      if (!acc[feature.moduleName]) {
        acc[feature.moduleName] = {
          name: feature.moduleName,
          features: [],
          enabledFeatures: 0,
          totalFeatures: 0
        };
      }
      acc[feature.moduleName].features.push(feature);
      acc[feature.moduleName].totalFeatures++;
      if (feature.isEnabled) {
        acc[feature.moduleName].enabledFeatures++;
      }
      return acc;
    }, {} as Record<string, unknown>);

    console.log('✅ Returning modules:', Object.keys(modules));

    return NextResponse.json({ modules: Object.values(modules) });

  } catch (error) {
    console.error('❌ Error getting modules:', error);
    return NextResponse.json(
      { error: 'Failed to get modules' },
      { status: 500 }
    );
  }
}
