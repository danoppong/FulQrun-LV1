// Administration Module - Module Configuration API Routes
// API routes for module-specific configuration management

import { NextRequest, NextResponse } from 'next/server';
import { ConfigurationService } from '@/lib/admin/services/ConfigurationService';
import { getSupabaseClient } from '@/lib/supabase-client';

const supabase = getSupabaseClient();

// Helper functions (same as in config/route.ts)
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Invalid token');
  }

  return user;
}

async function getOrganizationId(userId: string) {
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

async function checkAdminPermission(userId: string, permission: string) {
  const { data, error } = await supabase.rpc('has_admin_permission', {
    p_user_id: userId,
    p_permission_key: permission
  });

  if (error || !data) {
    return false;
  }

  return data;
}

// GET /api/admin/modules
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationId(user.id);

    // Check permission
    const hasPermission = await checkAdminPermission(user.id, 'admin.modules.view');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const configService = new ConfigurationService(organizationId, user.id);
    const features = await configService.getModuleFeatures();

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
    }, {} as Record<string, any>);

    return NextResponse.json({ modules: Object.values(modules) });

  } catch (error) {
    console.error('Error getting modules:', error);
    return NextResponse.json(
      { error: 'Failed to get modules' },
      { status: 500 }
    );
  }
}
