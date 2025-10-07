// Administration Module - Module Enable/Disable API Routes
// API routes for enabling and disabling modules

import { NextRequest, NextResponse } from 'next/server'
import { ConfigurationService } from '@/lib/admin/services/ConfigurationService'
import { getSupabaseClient } from '@/lib/supabase-client';

const supabase = getSupabaseClient();

// Helper functions
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

// POST /api/admin/modules/[moduleName]/enable
export async function POST(
  request: NextRequest,
  { params }: { params: { moduleName: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationId(user.id);

    // Check permission
    const hasPermission = await checkAdminPermission(user.id, 'admin.modules.toggle');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const configService = new ConfigurationService(organizationId, user.id);
    
    // Enable all features for the module
    const features = await configService.getModuleFeatures(params.moduleName as any);
    for (const feature of features) {
      if (!feature.isEnabled) {
        await configService.toggleModuleFeature(
          params.moduleName as any,
          feature.featureKey,
          true,
          'Module enabled via API'
        );
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error enabling module:', error);
    return NextResponse.json(
      { error: 'Failed to enable module' },
      { status: 500 }
    );
  }
}
